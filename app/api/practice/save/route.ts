
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase configuration is missing.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
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

// Correct UUID format: 8-4-4-4-12
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const token = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return errorResponse("You must be logged in.", 401);
    }

    const supabase = getAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse("Invalid login session.", 401);
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
    const answers = payload.answers;

    if (
      typeof attemptId !== "string" ||
      !UUID_REGEX.test(attemptId)
    ) {
      return errorResponse("Invalid exam attempt.");
    }

    if (
      !answers ||
      typeof answers !== "object" ||
      Array.isArray(answers)
    ) {
      return errorResponse("Invalid answers.");
    }

    const entries = Object.entries(answers);

    if (
      entries.length > 100 ||
      !entries.every(
        ([key, value]) =>
          /^\d+$/.test(key) &&
          typeof value === "string" &&
          value.length <= 1000
      )
    ) {
      return errorResponse("Invalid answer data.");
    }

    const { data, error } = await supabase.rpc(
      "save_quiz_answers",
      {
        p_attempt_id: attemptId,
        p_user_id: user.id,
        p_answers: answers,
      }
    );

    if (error) {
      console.error("Answer save rejected:", error.message);

      const message = error.message.toLowerCase();

      if (
        message.includes("expired") ||
        message.includes("time has expired")
      ) {
        return errorResponse("Exam time has expired.", 409);
      }

      if (message.includes("already been submitted")) {
        return errorResponse(
          "This exam has already been submitted.",
          409
        );
      }

      if (message.includes("not found")) {
        return errorResponse("Exam attempt not found.", 404);
      }

      return errorResponse(
        process.env.NODE_ENV === "development"
          ? `Supabase save error: ${error.message}`
          : "Could not save answers.",
        400
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Practice save error:", error);

    return errorResponse(
      "Unexpected server error.",
      500
    );
  }
}
