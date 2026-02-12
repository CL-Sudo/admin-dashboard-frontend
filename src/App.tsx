function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-8 px-6 py-12">
      <div className="inline-flex w-fit items-center gap-3 rounded-full border border-slate-700/60 bg-slate-900/60 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-300">
        Admin command center
      </div>
      <div className="space-y-5">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-100 sm:text-5xl">
          Tailwind v4 is live in your dashboard stack.
        </h1>
        <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
          Your UI system is ready for layouts, analytics panels, and
          high-contrast data views. Start composing components with
          utility-first styling now.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Today
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">$148,302</p>
          <p className="mt-2 text-sm text-emerald-300">+12.4% vs yesterday</p>
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Open alerts
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">8</p>
          <p className="mt-2 text-sm text-amber-300">
            2 require immediate review
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-white/20 transition hover:-translate-y-0.5 hover:shadow-white/30">
          Create report
        </button>
        <button className="rounded-full border border-slate-700/70 px-6 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500">
          Review activity
        </button>
      </div>
    </main>
  );
}

export default App;
