// Week1 Day4：流式输出（SSE）—— 模型逐字返回，而不是等全部生成完

const API_KEY = process.env.DEEPSEEK_API_KEY;

if (!API_KEY) {
  console.error("❌ 没读到 DEEPSEEK_API_KEY");
  process.exit(1);
}

async function chatStream(messages, { model = "deepseek-chat", temperature = 1 } = {}) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      stream: true, // ← 关键：告诉服务端"边生成边返回"
    }),
  });

  if (!res.ok) {
    throw new Error(`API 请求失败 (${res.status}): ${await res.text()}`);
  }

  const decoder = new TextDecoder();
  let buffer = "";

  // res.body 是可逐块读取的字节流，不再是等一个完整 JSON
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });

    // SSE 用空行 \n\n 分隔每个事件；网络可能把一个事件拆成两块，用 buffer 兜住
    const events = buffer.split("\n\n");
    buffer = events.pop(); // 最后一段可能不完整，留到下次拼接

    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return; // 流结束标记
        const json = JSON.parse(payload);
        const text = json.choices[0]?.delta?.content; // 注意：流式里是 delta 不是 message
        if (text) process.stdout.write(text); // 不换行，模拟打字效果
      }
    }
  }
}

const messages = [
  { role: "system", content: "你是一个简洁的助手" },
  { role: "user", content: "用 100 字左右介绍一下什么是流式输出" },
];

const start = Date.now();
await chatStream(messages, { temperature: 0.7 });
console.log(`\n\n⏱ 总耗时：${Date.now() - start}ms`);
