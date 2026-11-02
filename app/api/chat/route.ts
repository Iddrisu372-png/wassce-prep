import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const systemPrompt = {
      role: "system",
      content: "You are a helpful and encouraging WASSCE tutor for West African students. Explain concepts simply, step-by-step. If a student asks a question outside of academics, politely steer them back to their studies."
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [systemPrompt, ...messages],
      temperature: 0.7,
    });

    return NextResponse.json({ message: response.choices[0].message });
  } catch (error) {
    console.error("OpenAI Error:", error);
    return NextResponse.json({ error: "Failed to fetch response from AI." }, { status: 500 });
  }
}