// Route Handler：POST /api/chat（流式）
// 运行在服务端，API Key 不会暴露给浏览器

type ChatMessage = { role: "user" | "assistant"; content: string };

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const TIMEOUT_MS = 30000;
const MAX_MESSAGES = 50;

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function parseMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) {
    return null;
  }

  const messages: ChatMessage[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const { role, content } = item as { role?: unknown; content?: unknown };
    if (
      (role !== "user" && role !== "assistant") ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return null;
    }
    messages.push({ role, content });
  }
  return messages;
}

export async function POST(req: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return errorResponse("服务器未配置 DEEPSEEK_API_KEY", 500);
  }

  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return errorResponse("请求体不是合法 JSON", 400);
  }

  const messages = parseMessages(body.messages);
  if (!messages) {
    return errorResponse(
      `messages 必须是非空数组，每项包含 role(user/assistant) 和非空 content，最多 ${MAX_MESSAGES} 条`,
      400,
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是一个简洁的中文助手" },
          ...messages,
        ],
        temperature: 0.7,
        stream: true,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return errorResponse("模型响应超时，请稍后重试", 504);
    }
    return errorResponse("无法连接模型服务", 502);
  }

  if (!upstream.ok) {
    if (upstream.status === 401) return errorResponse("API Key 无效", 502);
    if (upstream.status === 402) return errorResponse("账户余额不足", 502);
    if (upstream.status === 429) return errorResponse("请求太频繁，稍后再试", 429);
    if (upstream.status >= 500) return errorResponse("模型服务暂时不可用", 502);
    return errorResponse(`模型请求失败 (${upstream.status})`, 502);
  }

  if (!upstream.body) {
    return errorResponse("模型没有返回内容", 502);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  // 把 DeepSeek 的 SSE 事件流转换成纯文本流，浏览器直接读字符串即可
  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const event of events) {
            for (const line of event.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (payload === "[DONE]") {
                controller.close();
                return;
              }

              const json = JSON.parse(payload);
              const text = json.choices?.[0]?.delta?.content;
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
