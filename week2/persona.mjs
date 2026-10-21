// Week2 Day1：给 CLI 工具加"人设"（system prompt 定制）
// 用法：node persona.mjs <人设名>，人设名见下方 personas 的 key

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const API_KEY = process.env.DEEPSEEK_API_KEY;
if (!API_KEY) {
  console.error("❌ 没读到 DEEPSEEK_API_KEY");
  process.exit(1);
}

// ======== 今天要写的就是这里 ========
// 要求：三个 system prompt 写清楚"你是谁、说话方式、回答结构、禁止什么"
// 好的 system prompt 具体、可执行，而不是只写"你是一个面试官"
const personas = {
  interviewer: `
    - 身份：5 年经验的前端面试官
    - 行为：针对用户的回答继续追问，并指出回答里的漏洞
    - 风格：简洁、直接，每次只问一个问题
    - 禁止：不要一次性把答案全讲完`,

  reviewer: `
    - 身份：团队里最严格的 code reviewer
    - 行为：从正确性、可读性、边界情况三个角度审查
    - 风格：先给结论（通过 / 不通过），再列问题，按严重程度分级
    - 禁止：不要吹捧，不要写长篇散文`,

  tutor: `
    - 身份：引导式学习的老师
    - 行为：不直接给答案，用问题引导用户自己想出来
    - 风格：耐心，每次最多抛一个问题
    - 禁止：禁止直接给出完整答案或代码`,
};
// ===================================

const personaName = process.argv[2] ?? "interviewer";
const systemPrompt = personas[personaName];
if (!systemPrompt) {
  console.error(`❌ 未知人设：${personaName}`);
  console.error(`可用人设：${Object.keys(personas).join(", ")}`);
  process.exit(1);
}

if (systemPrompt.includes("TODO")) {
  console.warn("⚠️ 这个人设还是 TODO，先去 personas 里把它写完整。\n");
}

// 记忆数组：第一项就是 system —— 它设定模型的"身份"，优先级高于 user
const messages = [{ role: "system", content: systemPrompt }];

const TIMEOUT_MS = 30000;

async function chatStream(history) {
  let res;
  try {
    res = await fetch("https://api.deepseek.com/chat/completions", {
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
      // AbortSignal.timeout：超过 TIMEOUT_MS 还没响应就自动中断 fetch
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
      // 401 → API Key 无效
      throw new Error(`API Key 无效`);
    } else if (res.status === 402) {
      // 402 → 账户余额不足
      throw new Error(`账户余额不足`);
    } else if (res.status === 429) {
      // 429 → 请求太频繁，稍后再试
      throw new Error(`请求太频繁，稍后再试`);
    } else if (res.status >= 500) {
      // 5xx → 模型服务暂时不可用
      throw new Error(`模型服务暂时不可用`);
    } else {
      // 其他 → 带上状态码和响应文本
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

const rl = readline.createInterface({ input: stdin, output: stdout });
console.log(`人设：${personaName}，输入 exit 退出。\n`);

while (true) {
  const input = (await rl.question("你: ")).trim();
  if (input.toLowerCase() === "exit") break;
  if (!input) continue;

  messages.push({ role: "user", content: input });
  process.stdout.write("AI: ");
  try {
    const reply = await chatStream(messages);
    console.log("\n");
    messages.push({ role: "assistant", content: reply });
  } catch (err) {
    console.log(`\n❌ ${err.message}`);
    messages.pop(); // 回滚这条失败的 user 消息
  }
}

rl.close();
