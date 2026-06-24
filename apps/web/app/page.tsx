import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold tracking-tight">AromaSabor</h1>
      <p className="mt-2 text-lg text-gray-400">
        Collaborative menu proposals for caterers
      </p>
      <nav className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-white/10 px-6 py-3 text-sm font-medium transition hover:bg-white/20"
        >
          Admin Login
        </Link>
      </nav>
    </main>
  );
}
