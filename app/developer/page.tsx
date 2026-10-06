import React from "react";
import Link from "next/link";
import { Sparkles, Globe, Mail, Send, Code, Cpu, Database, Shield, Zap, Terminal, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Rohit Kumar Nagar | Full-Stack Architect & AI Engineer",
  description: "Official Developer Profile of Rohit Kumar Nagar (Dhakad Rachora) - Next.js, AI Autonomous Systems & High-Performance Web Applications.",
};

export default function DeveloperProfilePage() {
  return (
    <div className="min-h-screen bg-[#07090E] text-white selection:bg-cyan-500 selection:text-black">
      {/* Background radial ambient glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(0,240,255,0.15),rgba(255,255,255,0))]" />

      <main className="relative max-w-5xl mx-auto px-6 py-16 space-y-16">
        {/* HERO SECTION */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Available for International Freelance & Remote Contracts</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyan-400">
            Rohit Kumar Nagar
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Full-Stack Web Architect & Autonomous AI Systems Developer specializing in <span className="text-cyan-300 font-semibold">Next.js 14/15</span>, distributed backend architectures, and high-converting digital assets.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="mailto:rohitdhakaddhoti143@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 font-bold text-sm text-white shadow-[0_0_25px_rgba(0,240,255,0.3)] hover:scale-105 transition-all"
            >
              <Mail className="w-4 h-4" />
              <span>Hire Me / Email Directly</span>
            </a>
            <a
              href="https://t.me/Dhakadrachora"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 font-semibold text-sm text-slate-200 hover:text-white transition-all"
            >
              <Send className="w-4 h-4 text-cyan-400" />
              <span>Telegram Direct</span>
            </a>
          </div>
        </section>

        {/* TECH STACK GRID */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <span>Core Technical Arsenal</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0D1321]/80 border border-white/10 space-y-4 hover:border-cyan-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Code className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Frontend Architecture</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sub-second page loads, responsive glassmorphic interfaces, Canvas 3D visuals.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-cyan-300">Next.js 14/15</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-cyan-300">React 19</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-cyan-300">TypeScript</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-cyan-300">Tailwind CSS</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-cyan-300">Three.js</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0D1321]/80 border border-white/10 space-y-4 hover:border-purple-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Backend & Databases</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scalable APIs, real-time sync, relational databases and serverless architectures.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-purple-300">Node.js</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-purple-300">Python 3</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-purple-300">PostgreSQL</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-purple-300">Supabase</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-purple-300">FastAPI</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0D1321]/80 border border-white/10 space-y-4 hover:border-emerald-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">AI & Autonomous Engines</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-agent workflows, autonomous scrapers, high-speed outreach & LLM orchestration.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-emerald-300">LLMs / Groq</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-emerald-300">Autonomous Agents</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-emerald-300">Puppeteer</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-emerald-300">SMTP Triage</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED PROJECTS */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <span>Featured Deployments</span>
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-[#0D1321]/80 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-cyan-500/40 transition-all">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-white">Dhotiaale News & Media Portal</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">Live In Production</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  High-speed automated SEO content portal with dynamic schema optimization, Edge delivery, and automated publishing pipelines.
                </p>
                <div className="text-xs text-slate-500 font-mono">
                  Stack: Next.js 14 • Supabase • Tailwind CSS • Vercel Edge
                </div>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 text-sm font-semibold text-white transition-all shrink-0"
              >
                <span>View Live Site</span>
                <ExternalLink className="w-4 h-4 text-cyan-400" />
              </Link>
            </div>
          </div>
        </section>

        {/* SECURITY & ETHICS */}
        <section className="p-8 rounded-2xl bg-[#0a0e17] border border-cyan-500/20 space-y-4">
          <div className="flex items-center gap-3 text-cyan-400 font-bold text-base">
            <Shield className="w-5 h-5" />
            <span>Security & Zero-Leak Protocol</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All codebases engineered by Rohit Kumar Nagar follow strict enterprise security practices: zero hardcoded secrets, authenticated environment boundaries, automated vulnerability scans, and rigorous data privacy controls.
          </p>
        </section>
      </main>
    </div>
  );
}
