import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
        Store Inventory Dashboard
      </h1>
      <p className="max-w-xl text-lg text-gray-600">
        Kickstart your inventory analytics experience with React Query data fetching,
        Prisma ORM connectivity, and modern visualization tooling pre-configured
        for rapid iteration.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-gray-700"
          href="https://nextjs.org/docs"
        >
          Next.js Documentation
        </Link>
        <Link
          className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-900 shadow-sm transition hover:border-gray-400"
          href="https://www.prisma.io/docs"
        >
          Prisma Docs
        </Link>
      </div>
    </main>
  );
}
