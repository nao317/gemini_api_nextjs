'use client';

import { useState } from "react";

import styles from "./gemini-response-panel.module.css";

type GeminiResponse = {
  model: string;
  prompt: string;
  responseText: string;
  responseId: string | null;
  usageMetadata: unknown;
};

type GeminiErrorBody = {
  error?: unknown;
};

const defaultPrompt = "";

function normalizeErrorMessage(value: unknown) {
  if (typeof value !== "string") {
    return "Gemini API の取得に失敗しました。";
  }

  try {
    const parsed = JSON.parse(value) as GeminiErrorBody;
    const nestedError = parsed.error;

    if (typeof nestedError === "string") {
      return normalizeErrorMessage(nestedError);
    }

    if (nestedError && typeof nestedError === "object") {
      const typedError = nestedError as {
        code?: unknown;
        message?: unknown;
        status?: unknown;
      };

      if (
        typedError.code === 503 ||
        typedError.status === 503 ||
        typedError.status === "UNAVAILABLE"
      ) {
        return "Gemini は現在混雑しています。少し待ってからもう一度送信してください。";
      }

      if (typeof typedError.message === "string") {
        return normalizeErrorMessage(typedError.message);
      }
    }
  } catch {
    return value;
  }

  return value;
}

export function GeminiResponsePanel() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [response, setResponse] = useState<GeminiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function runPrompt(nextPrompt: string) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: nextPrompt }),
      });

      const data = (await res.json()) as GeminiResponse & { error?: unknown };

      if (!res.ok) {
        throw new Error(normalizeErrorMessage(data.error));
      }

      setResponse(data);
    } catch (error) {
      setResponse(null);
      setError(error instanceof Error ? error.message : "Gemini API の取得に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="gemini-response-title">
      <header className={styles.header}>
        <div>
            <a href="https://github.com/nao317/gemini_api_nextjs" className={styles.aelem}>github repository</a>
        </div>
        <span className={styles.eyebrow}>Gemini Response Demo</span>
        <h1 id="gemini-response-title" className={styles.title}>
          GeminiAPI 2.5 Flash
        </h1>
        <p className={styles.description}>
          ここで入力したプロンプトは /api/gemini に送られ、genaiClient.tsx 経由で取得したレスポンスが下に表示されます。
        </p>
      </header>

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          const trimmedPrompt = prompt.trim();

          if (!trimmedPrompt || isLoading) {
            return;
          }

          void runPrompt(trimmedPrompt);
        }}
      >
        <label className={styles.label} htmlFor="prompt">
          プロンプト
        </label>
        <textarea
          id="prompt"
          className={styles.textarea}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Gemini に聞きたい内容を入力してください"
        />

        <div className={styles.actions}>
          <button className={styles.button} type="submit" disabled={isLoading || !prompt.trim()}>
            {isLoading ? "応答を取得中..." : "Gemini へ送信"}
          </button>
        </div>
      </form>

      {error ? <div className={styles.error}>{error}</div> : null}

      <section className={styles.response} aria-live="polite">
        <div className={styles.responseHeader}>
          <span className={styles.badge}>{isLoading ? "読み込み中" : response ? "API 応答" : "未送信"}</span>
          {response ? <span>{response.model}</span> : <span>応答待ち</span>}
        </div>

        <div className={styles.responseText}>
          {response?.responseText || (isLoading ? "レスポンスを取得しています。" : "プロンプトを入力して送信してください。")}
        </div>

        {response ? (
          <div className={styles.meta}>
            <span>Prompt: {response.prompt}</span>
            <span>Response ID: {response.responseId ?? "-"}</span>
            <span>
              Usage Metadata: {JSON.stringify(response.usageMetadata ?? {}, null, 2)}
            </span>
          </div>
        ) : null}
      </section>
    </section>
  );
}