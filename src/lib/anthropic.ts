import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (see .env.local.example)."
    );
  }
  client = new Anthropic({ apiKey });
  return client;
}

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

/**
 * Sends a single-turn request and returns the raw text of the reply.
 * Callers that need structured output ask for JSON in the prompt and parse
 * it with extractJson() below — the SDK's typed tool-use path is more setup
 * than this MVP needs.
 *
 * Uses the streaming client rather than a plain create() call: the SDK
 * refuses large-max_tokens non-streaming requests outright ("Streaming is
 * required for operations that may take longer than 10 minutes"), and plan
 * drafting's max_tokens is well into that range.
 */
export async function complete(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const anthropic = getAnthropic();
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: params.maxTokens ?? 4096,
    system: params.system,
    messages: [{ role: "user", content: params.user }],
  });
  const msg = await stream.finalMessage();
  const block = msg.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    console.error(
      "No text block in model reply.",
      "stop_reason:", msg.stop_reason,
      "block types:", msg.content.map((b) => b.type),
      "usage:", msg.usage
    );
    throw new Error(
      `Model returned no text content (stop_reason: ${msg.stop_reason}, blocks: ${msg.content.map((b) => b.type).join(", ") || "none"}).`
    );
  }
  if (msg.stop_reason === "max_tokens") {
    console.error("Model hit max_tokens before finishing — reply is truncated.");
  }
  return block.text;
}

/** Pulls the first {...} or [...] JSON value out of a model reply, tolerating
 * stray prose or markdown fences around it. */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) {
    throw new Error("No JSON found in model reply.");
  }
  const openChar = candidate[start];
  const closeChar = openChar === "{" ? "}" : "]";
  let depth = 0;
  let end = -1;
  for (let i = start; i < candidate.length; i++) {
    if (candidate[i] === openChar) depth++;
    else if (candidate[i] === closeChar) {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) {
    throw new Error("Unterminated JSON in model reply.");
  }
  const slice = candidate.slice(start, end + 1);
  return JSON.parse(slice) as T;
}
