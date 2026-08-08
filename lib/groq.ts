type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function sanitizeError(msg: string): string {
  return msg.replace(/[\x00-\x1f\x7f]/g, " ").replace(/\s+/g, " ").trim();
}

async function postCompletion(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY environment variable");
  }

  console.log(`[groq] Using model: ${model}`);

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Groq request failed (${response.status}): ${sanitizeError(errorText)}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("Groq response did not include message content");
  }

  console.log(`[groq] Raw response:\n${content}`);

  return content;
}

export async function generateContent(prompt: string): Promise<string> {
  return postCompletion([{ role: "user", content: prompt }]);
}

export async function generateContentWithHistory(
  history: { role: "user" | "model"; parts: string }[]
): Promise<string> {
  const messages: ChatMessage[] = history.map((h) => ({
    role: h.role === "model" ? "assistant" : h.role,
    content: h.parts,
  }));
  return postCompletion(messages);
}

export { sanitizeError };
