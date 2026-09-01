export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-cyan-400">ORCA Marine Agent</h1>
          <p className="text-slate-400">ISRO Marine Ecosystem Reasoning Platform</p>
        </div>
        <div className="bg-emerald-950/30 border border-emerald-500/20 p-4 rounded-lg text-center">
          <p className="text-emerald-400 text-sm font-medium">System Status: Database Linked & Ready</p>
        </div>
      </div>
    </main>
  );
}
