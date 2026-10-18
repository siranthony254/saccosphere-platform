import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-navy px-6 text-center">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-light">404</p>
      <h1 className="mb-4 font-serif text-3xl text-white">This page doesn&rsquo;t exist</h1>
      <p className="mb-8 max-w-sm text-[14px] text-white/55">
        The page you&rsquo;re looking for isn&rsquo;t here. Head back to the homepage.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-mint px-5 py-3 text-[13px] font-semibold text-navy transition-opacity hover:opacity-90"
      >
        Back to SaccoSphere
      </Link>
    </main>
  )
}
