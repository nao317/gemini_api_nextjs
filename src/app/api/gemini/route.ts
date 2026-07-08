import { NextResponse } from "next/server";

import { generateGeminiResponse } from "@/components/api/genaiClient";

const fallbackPrompt = "";

function toErrorObject(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (typeof parsed === "object" && parsed !== null) {
      return parsed as {
        error?: { code?: unknown; message?: unknown; status?: unknown };
        code?: unknown;
        message?: unknown;
        status?: unknown;
      };
    }
  } catch {
    return null;
  }

  return null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const parsedError = toErrorObject(error.message);

    if (parsedError) {
      return getErrorMessage(parsedError);
    }

    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const typedError = error as {
      message?: unknown;
      error?: { message?: unknown; status?: unknown; code?: unknown };
      status?: unknown;
      code?: unknown;
    };

    const parsedMessage = toErrorObject(typedError.message);
    if (parsedMessage) {
      return getErrorMessage(parsedMessage);
    }

    if (typeof typedError.message === "string") {
      return typedError.message;
    }

    if (typeof typedError.error?.message === "string") {
      const parsedNestedMessage = toErrorObject(typedError.error.message);

      if (parsedNestedMessage) {
        return getErrorMessage(parsedNestedMessage);
      }

      return typedError.error.message;
    }

    if (typedError.code === 503 || typedError.status === 503 || typedError.error?.status === "UNAVAILABLE") {
      return "Gemini は現在混雑しています。少し待ってからもう一度送信してください。";
    }

    if (
      typedError.error?.code === 503 ||
      typedError.error?.status === 503 ||
      typedError.error?.status === "UNAVAILABLE"
    ) {
      return "Gemini は現在混雑しています。少し待ってからもう一度送信してください。";
    }
  }

  return "Gemini API の呼び出しに失敗しました。";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { prompt?: string }
    | null;

  const prompt = body?.prompt?.trim() || fallbackPrompt;

  try {
    const result = await generateGeminiResponse(prompt);

    return NextResponse.json(result);
  } catch (error) {
    const message = getErrorMessage(error);
    const status =
      error instanceof Error && error.message.includes('"code":503') ? 503 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}