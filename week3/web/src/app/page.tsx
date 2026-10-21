"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    setError("");
    setInput("");
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `请求失败 (${res.status})`);
      }
      if (!res.body) throw new Error("浏览器不支持流式读取");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;

        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = {
            ...last,
            content: last.content + chunk,
          };
          return copy;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败");
      // 如果还没收到任何内容，移除空的 assistant 占位
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return last?.role === "assistant" && last.content === ""
          ? prev.slice(0, -1)
          : prev;
      });
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // 中文输入法选词时的 Enter 不能触发发送
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  const waiting = streaming && messages.at(-1)?.content === "";

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-950 to-indigo-950 text-zinc-100">
      <div className="mx-auto flex h-screen w-full max-w-3xl flex-col gap-4 px-4 py-6">
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold">
            AI
          </div>
          <div>
            <h1 className="text-lg font-semibold">AI 聊天</h1>
            <p className="text-xs text-zinc-400">DeepSeek · 流式输出</p>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-zinc-400">
              <p className="text-base">开始对话吧</p>
              <p className="text-sm">例如：用一句话解释什么是闭包</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((message, index) => {
                const isUser = message.role === "user";
                const isPlaceholder =
                  !isUser && message.content === "" && streaming;

                if (isPlaceholder) return null;

                return (
                  <div
                    key={index}
                    className={
                      isUser
                        ? "ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2"
                        : "mr-auto max-w-[85%] rounded-2xl rounded-bl-md bg-slate-800 px-4 py-2"
                    }
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                );
              })}

              {waiting && (
                <div className="mr-auto flex items-center gap-1 rounded-2xl rounded-bl-md bg-slate-800 px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </section>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            ❌ {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，Enter 发送，Shift+Enter 换行"
            rows={1}
            className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            发送
          </button>
        </form>
      </div>
    </main>
  );
}
