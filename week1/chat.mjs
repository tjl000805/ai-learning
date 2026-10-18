// Week1 Day6：命令行 AI 对话小工具
// = Day5 的多轮对话（维护 messages 历史）
// + Day4 的流式输出（边生成边打印）

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const API_KEY = process.env.DEEPSEEK_API_KEY;
if (!API_KEY) {
  console.error("❌ 没读到 DEEPSEEK_API_KEY，请先在终端设置环境变量");
  process.exit(1);
}

// 这个数组就是"记忆"：user / assistant 每一轮都往里追加
const messages = [
  { role: "system", content: "你是一个简洁的中文助手，回答尽量简短" },
];

async function chatStream(history) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: history,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`API 请求失败 (${res.status}): ${await res.text()}`);
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let reply = ""; // TODO 1：用来收集流式拼起来的完整回复

  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });

    // SSE 用空行 \n\n 分隔事件；可能被网络拆包，用 buffer 兜住
    const events = buffer.split("\n\n");
    buffer = events.pop();

    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();

        // TODO 2：收到 [DONE] 时，结束流并返回 reply
        // 提示：直接 return 会把已收集的内容丢掉，要 return reply
        if (payload === "[DONE]") return reply;
        const json = JSON.parse(payload);
        const text = json.choices[0]?.delta?.content;

        if (text) {
          // TODO 3：一边打印（不换行），一边拼进 reply
          process.stdout.write(text);
          reply += text;
        }
      }
    }
  }

  // TODO 4：循环结束也返回 reply
  return reply;
}

const rl = readline.createInterface({ input: stdin, output: stdout });

console.log("AI 对话工具已启动（流式 + 多轮），输入 exit 退出。");
console.log("试试：先说“我叫田金龙，记住”，再问“我叫什么名字？”\n");

// TODO 5：写主循环（参考 Day5 的 multi-turn.mjs，但要改用 chatStream）
// 1) 读用户输入
// 2) exit / 空输入处理
// 3) push user 消息
// 4) 调用 chatStream(messages)，先打印 "AI: " 前缀
// 5) 等完整回复返回后，push assistant 消息，并换行
while (true) {
  const userInput = await rl.question("你: ");
  if (userInput.trim().toLowerCase() === "exit") break;
  if (!userInput.trim()) continue;

  // 1. 把用户这句加进历史
  messages.push({ role: "user", content: userInput });

  process.stdout.write("AI: ");      // 流式开始前先打前缀

  // 2. 把完整历史发出去（不是只发这一句）
  const reply = await chatStream(messages);
  console.log(`\n`);

  // 3. 把模型回复也加进历史，下一轮它才知道自己说过什么
  messages.push({ role: "assistant", content: reply });
}

rl.close();
