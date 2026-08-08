export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Fact Rot Detector</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Detect when facts in your content have gone stale.
        </p>
      </div>
    </main>
  );
}
