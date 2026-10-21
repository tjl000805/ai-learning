// 公共 API 模块：只负责"调用模型 + 错误处理"，不关心命令行交互
// 后面做 Web 后端时，这个模块可以原样复用

const TIMEOUT_MS = 30000;

export async function chatStream(history) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("未设置 DEEPSEEK_API_KEY");
  }

  let res;
  try {
    res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: history,
        temperature: 0.7,
        stream: true,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err.name === "TimeoutError") {
      throw new Error("请求超时，请稍后重试");
    }
    throw new Error("网络连接失败，请检查网络或代理");
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("API Key 无效");
    } else if (res.status === 402) {
      throw new Error("账户余额不足");
    } else if (res.status === 429) {
      throw new Error("请求太频繁，稍后再试");
    } else if (res.status >= 500) {
      throw new Error("模型服务暂时不可用");
    } else {
      throw new Error(`API 请求失败 (${res.status}): ${await res.text()}`);
    }
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";

  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop();

    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return reply;

        const json = JSON.parse(payload);
        const text = json.choices[0]?.delta?.content;
        if (text) {
          process.stdout.write(text);
          reply += text;
        }
      }
    }
  }

  return reply;
}
