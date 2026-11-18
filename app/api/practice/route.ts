
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server environment variables are missing.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return null;
  }

  const supabase = getAdminClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

function isValidAnswerObject(
  value: unknown
): value is Record<string, string> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const entries = Object.entries(value);

  return (
    entries.length <= 100 &&
    entries.every(
      ([key, answer]) =>
        /^\d+$/.test(key) &&
        typeof answer === "string" &&
        answer.length <= 1000
    )
  );
}

// GET: Create a secure quiz attempt.
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

    const supabase = getAdminClient();
    const params = request.nextUrl.searchParams;

    const examType = params.get("examType") || "WASSCE";
    const subject = params.get("subject") || "Mixed";
    const difficulty = (
      params.get("difficulty") || "All"
    ).toLowerCase();

    const count = Number(params.get("count") || 10);
    const timeLimit = Number(params.get("timeLimit") || 10);

    if (examType !== "WASSCE") {
      return errorResponse("Invalid exam type.");
    }

    if (
      !Number.isInteger(count) ||
      ![5, 10, 20, 30, 50].includes(count)
    ) {
      return errorResponse("Invalid question count.");
    }

    if (
      !Number.isInteger(timeLimit) ||
      ![5, 10, 15, 30, 60].includes(timeLimit)
    ) {
      return errorResponse("Invalid time limit.");
    }

    if (
      !["all", "easy", "medium", "hard"].includes(
        difficulty
      )
    ) {
      return errorResponse("Invalid difficulty.");
    }

    const validSubjects = [
      "Mixed",
      "Mathematics",
      "English",
      "Science",
      "Social Studies",
      "Elective Math",
      "Biology",
      "Chemistry",
      "Physics",
      "Economics",
      "Government",
      "Literature",
      "Geography",
      "ICT",
    ];

    if (!validSubjects.includes(subject)) {
      return errorResponse("Invalid subject.");
    }

    let query = supabase
      .from("questions")
      .select("id, subject, question, options")
      .eq("exam_type", examType);

    if (subject !== "Mixed") {
      query = query.eq("subject", subject);
    }

    if (difficulty !== "all") {
      query = query.eq("difficulty", difficulty);
    }

    const { data, error } = await query.limit(1000);

    if (error) {
      console.error("Question loading error:", error);
      return errorResponse("Could not load questions.", 500);
    }

    const shuffled = [...(data ?? [])];

    // Fisher-Yates shuffle.
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [shuffled[i], shuffled[j]] = [
        shuffled[j],
        shuffled[i],
      ];
    }

    const questions = shuffled.slice(0, count);

    if (questions.length === 0) {
      return NextResponse.json({
        questions: [],
        attemptId: null,
        availableCount: 0,
      });
    }

    const now = Date.now();
    const timeLimitSeconds = timeLimit * 60;

    const expiresAt = new Date(
      now + timeLimitSeconds * 1000
    ).toISOString();

    const { data: attempt, error: attemptError } =
      await supabase
        .from("quiz_attempts")
        .insert({
          user_id: user.id,
          question_ids: questions.map(
            (question) => question.id
          ),
          exam_type: examType,
          time_limit_seconds: timeLimitSeconds,
          expires_at: expiresAt,
        })
        .select("id, expires_at")
        .single();

    if (attemptError || !attempt) {
      console.error(
        "Quiz attempt creation error:",
        attemptError
      );

      return errorResponse(
        "Could not create secure quiz session.",
        500
      );
    }

    return NextResponse.json(
      {
        attemptId: attempt.id,
        expiresAt: attempt.expires_at,
        questions,
        availableCount: shuffled.length,
        requestedCount: count,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Practice GET error:", error);

    return errorResponse(
      "An unexpected server error occurred.",
      500
    );
  }
}

// POST: Securely grade one existing attempt.
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON submission.");
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return errorResponse("Invalid exam submission.");
    }

    const submission = body as Record<string, unknown>;

    const attemptId = submission.attemptId;
    const answers = submission.answers;

    if (
      typeof attemptId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        attemptId
      )
    ) {
      return errorResponse(
        "Invalid or missing quiz attempt ID."
      );
    }

    if (!isValidAnswerObject(answers)) {
      return errorResponse("Invalid answers.");
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase.rpc(
      "submit_secure_quiz",
      {
        p_attempt_id: attemptId,
        p_user_id: user.id,
        p_answers: answers,
      }
    );

    if (error) {
      console.error(
        "Secure quiz submission rejected:",
        error.message
      );

      if (
        error.message.includes("already been submitted")
      ) {
        return errorResponse(
          "This quiz has already been submitted.",
          409
        );
      }

      if (error.message.includes("time has expired")) {
        return errorResponse(
          "Your quiz submission deadline has passed.",
          409
        );
      }

      if (error.message.includes("not found")) {
        return errorResponse(
          "Quiz attempt not found.",
          404
        );
      }

      return errorResponse(
        "Could not submit your quiz. Please try again.",
        500
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Practice POST error:", error);

    return errorResponse(
      "An unexpected server error occurred.",
      500
    );
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON.");
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return errorResponse("Invalid request.");
    }

    const payload = body as Record<string, unknown>;
    const attemptId = payload.attemptId;

    if (
      typeof attemptId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        attemptId
      )
    ) {
      return errorResponse("Invalid exam attempt.");
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase.rpc(
      "finalize_saved_quiz",
      {
        p_attempt_id: attemptId,
        p_user_id: user.id,
      }
    );

    if (error) {
      console.error(
        "Quiz finalization rejected:",
        error.message
      );

      if (error.message.includes("already been submitted")) {
        return errorResponse(
          "This exam has already been submitted.",
          409
        );
      }

      if (error.message.includes("not found")) {
        return errorResponse(
          "Exam attempt not found.",
          404
        );
      }

      return errorResponse(
        "Could not finalize your exam.",
        500
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Practice PATCH error:", error);

    return errorResponse(
      "Unexpected server error.",
      500
    );
  }
}

