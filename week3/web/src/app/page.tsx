export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-black">
      <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
        AI Learning
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Week 3 · Next.js App Router 已跑通
      </p>
      <a
        className="text-blue-600 underline"
        href="http://localhost:3000/hello"
        target="_blank"
        rel="noopener noreferrer"
      >
        Express /hello 接口
      </a>
    </main>
  );
}
