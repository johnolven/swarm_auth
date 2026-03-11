import Link from "next/link";
import {
  Bot,
  Shield,
  Mail,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  BadgeCheck,
  CircleDot,
  Building2,
  Inbox,
  Bell,
  Lock,
} from "lucide-react";

function Particles() {
  const lefts = [10, 25, 40, 55, 70, 85, 15, 60, 80, 35];
  const durations = [12, 10, 14, 11, 13, 9, 15, 10, 12, 11];
  const delays = [0, 2, 1, 3, 0.5, 4, 2.5, 1.5, 3.5, 0.8];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className="absolute w-[3px] h-[3px] rounded-full bg-cyan-400 opacity-0"
          style={{
            left: `${lefts[i]}%`,
            animation: `float ${durations[i]}s linear ${delays[i]}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const integrationCode = `// Add "Agent Login" to your platform
const card = await fetch(agentCardUrl)
  .then(r => r.json());

if (card.owner.trust_level === "verified") {
  // Grant access — agent is trusted
  const token = issueToken({
    sub: card.agent.id,
    type: "agent",
    trust_level: card.owner.trust_level
  });
  return { access: "full", token };
}`;

  const curlCommand = `curl -X POST https://api.swarmid.io/v1/register \\
  -H "Content-Type: application/json" \\
  -d '{"agent": {"name": "My Agent", "slug": "my-agent"}, "owner_email": "you@example.com"}'`;

  return (
    <main className="relative z-[1]">
      {/* ═══ HERO ═══ */}
      <section className="min-h-screen flex items-center justify-center text-center relative px-6 py-24 overflow-hidden">
        <div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(ellipse 600px 400px at 30% 20%, rgba(0,136,255,0.08) 0%, transparent 70%), radial-gradient(ellipse 500px 500px at 70% 60%, rgba(0,212,255,0.06) 0%, transparent 70%), radial-gradient(ellipse 400px 300px at 50% 80%, rgba(108,92,231,0.05) 0%, transparent 70%)",
            animation: "hero-glow 8s ease-in-out infinite alternate",
          }}
        />
        <Particles />
        <div className="relative z-[1] max-w-3xl mx-auto animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-sm font-medium text-cyan-400 mb-8">
            <span
              className="w-2 h-2 rounded-full bg-cyan-400"
              style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
            />
            Open Protocol v1.0
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6 bg-gradient-to-br from-white via-white to-cyan-400 bg-clip-text text-transparent">
            The Identity Protocol
            <br />
            for AI Agents
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            SwarmID gives every AI agent a verifiable identity, a responsible
            owner, and a trust score — so platforms can open their doors with
            confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-9 py-4 bg-gradient-to-br from-blue-500 to-cyan-400 text-white font-semibold rounded-xl shadow-[0_4px_24px_rgba(0,136,255,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,136,255,0.45)] transition-all"
            >
              Register Your Agent <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/spec"
              className="inline-flex items-center gap-2 px-9 py-4 bg-transparent text-gray-400 border border-white/10 font-semibold rounded-xl hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
            >
              Read the Spec
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-400 mb-3">
            How It Works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Three steps to a trusted agent
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-16">
            From anonymous to enterprise-grade in minutes, not months.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 relative">
            {[
              {
                icon: <Bot className="w-6 h-6" />,
                title: "Register Agent",
                desc: "Submit your agent\u2019s details and your email. Get an AgentCard instantly.",
              },
              {
                icon: <UserCheck className="w-6 h-6" />,
                title: "Verify Owner Email",
                desc: "Confirm your email. Your agent upgrades to Verified and gets an @swarmid.io address.",
              },
              {
                icon: <BadgeCheck className="w-6 h-6" />,
                title: "Agent Gets Identity",
                desc: "Platforms check your card. Verified agents get full access. Enterprise agents get priority.",
              },
            ].map((step, i) => (
              <div key={i} className="text-center px-8 py-10 relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white inline-flex items-center justify-center text-lg font-bold mb-6 relative z-[2]">
                  {i + 1}
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-[4.25rem] left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-30" />
                )}
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-400 mb-3">
            What is SwarmID
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Three pillars of agent identity
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-16">
            A lightweight, open standard that makes AI agents accountable,
            private, and trustworthy.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Bot className="w-8 h-8 text-cyan-400" />,
                title: "Agent Identity Card",
                desc: "Every agent gets a public AgentCard: name, capabilities, protocols. A digital face for the autonomous world.",
              },
              {
                icon: <Lock className="w-8 h-8 text-cyan-400" />,
                title: "Owner Privacy",
                desc: "Owner identity stays private. Only a salted hash appears on the card. Your email, your control.",
              },
              {
                icon: <Mail className="w-8 h-8 text-cyan-400" />,
                title: "Agent Email",
                desc: "Every verified agent gets a real @swarmid.io email address. Platforms can reach your agent. You stay in control.",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="group bg-navy-700/50 border border-white/5 rounded-2xl p-10 text-left relative overflow-hidden hover:bg-navy-700 hover:border-cyan-400/20 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="mb-5">{card.icon}</div>
                <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AGENT EMAIL HIGHLIGHT ═══ */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-blue-500/[0.03] to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-400 mb-3">
                The Bridge
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                Every Agent Gets
                <br />
                Its Own Email
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                When an agent registers with SwarmID, it automatically gets a
                real email address:{" "}
                <span className="text-cyan-400 font-mono font-medium">
                  slug@swarmid.io
                </span>
                . This is the bridge between autonomous agents and human
                accountability.
              </p>
              <div className="space-y-4">
                {[
                  {
                    icon: <Inbox className="w-5 h-5 text-cyan-400" />,
                    text: "Platforms can send verifications, invoices, and alerts to your agent",
                  },
                  {
                    icon: <Bell className="w-5 h-5 text-cyan-400" />,
                    text: "Owner gets notified at their private email when the agent receives messages",
                  },
                  {
                    icon: <Shield className="w-5 h-5 text-cyan-400" />,
                    text: "Your real email is never exposed \u2014 only the agent email is public",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5">{item.icon}</div>
                    <p className="text-gray-300 text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Email mockup */}
            <div className="bg-navy-800 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 bg-navy-700/50">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-white/10" />
                  <span className="w-3 h-3 rounded-full bg-white/10" />
                  <span className="w-3 h-3 rounded-full bg-white/10" />
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  research-bot@swarmid.io — Inbox
                </span>
              </div>
              <div className="p-5 space-y-3">
                {[
                  {
                    from: "GitHub Actions",
                    subject: "Your deployment succeeded",
                    time: "2m ago",
                    highlight: true,
                  },
                  {
                    from: "Stripe",
                    subject: "Invoice #4821 — $29.00",
                    time: "1h ago",
                    highlight: false,
                  },
                  {
                    from: "Vercel",
                    subject: "Verify your agent account",
                    time: "3h ago",
                    highlight: false,
                  },
                ].map((email, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      email.highlight
                        ? "bg-cyan-400/5 border border-cyan-400/10"
                        : "bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          email.highlight
                            ? "bg-cyan-400/20 text-cyan-400"
                            : "bg-white/5 text-gray-500"
                        }`}
                      >
                        {email.from[0]}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-medium ${email.highlight ? "text-white" : "text-gray-400"}`}
                        >
                          {email.from}
                        </p>
                        <p className="text-xs text-gray-500">
                          {email.subject}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">{email.time}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-white/5 text-center">
                <p className="text-xs text-gray-600">
                  All messages forwarded to owner&apos;s private email
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST LEVELS ═══ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-400 mb-3">
            Trust Levels
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Progressive trust, your rules
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-16">
            Every agent starts unverified. Trust is earned, not assumed.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-8">
            {[
              {
                icon: <CircleDot className="w-8 h-8" />,
                label: "Unverified",
                desc: "Registered, no email confirmed",
                color: "text-gray-500",
                bg: "bg-gradient-to-br from-gray-500/10 to-gray-500/5",
                border: "hover:border-gray-500/30",
              },
              {
                icon: <CheckCircle2 className="w-8 h-8" />,
                label: "Verified",
                desc: "Email confirmed, gets @swarmid.io",
                color: "text-cyan-400",
                bg: "bg-gradient-to-br from-blue-500/10 to-cyan-400/5",
                border:
                  "hover:border-cyan-400/30 hover:shadow-[0_8px_32px_rgba(0,212,255,0.1)]",
              },
              {
                icon: <Building2 className="w-8 h-8" />,
                label: "Enterprise",
                desc: "Org-verified, priority access",
                color: "text-yellow-400",
                bg: "bg-gradient-to-br from-yellow-400/10 to-orange-400/5",
                border:
                  "hover:border-yellow-400/30 hover:shadow-[0_8px_32px_rgba(255,193,7,0.1)]",
              },
            ].map((badge, i) => (
              <div
                key={i}
                className={`${badge.bg} border border-white/5 rounded-2xl px-11 py-9 text-center min-w-[200px] hover:-translate-y-1 transition-all duration-300 ${badge.border}`}
              >
                <div className={`${badge.color} mb-4 flex justify-center`}>
                  {badge.icon}
                </div>
                <div className={`text-lg font-bold mb-1 ${badge.color}`}>
                  {badge.label}
                </div>
                <div className="text-sm text-gray-500">{badge.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SAAS INTEGRATION ═══ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-400 mb-3">
            For SaaS Platforms
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Integrate in minutes
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-16">
            Let verified agents into your platform while keeping owners
            accountable.
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between px-5 py-3 bg-white/[0.02] border-b border-white/5 rounded-t-2xl text-sm text-gray-500">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              </div>
              <span className="text-xs font-mono">agent-auth.ts</span>
            </div>
            <div className="relative bg-[#080c20] border border-white/5 border-t-0 rounded-b-2xl p-7 text-left overflow-x-auto">
              <pre className="font-mono text-sm leading-[1.8] text-gray-300">
                <code>{integrationCode}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-blue-500/[0.03] to-transparent">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-400 mb-3">
            Get Started
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Register your first agent
          </h2>
          <p className="text-lg text-gray-400 mb-12">
            One command. That&apos;s it.
          </p>
          <div className="max-w-2xl mx-auto mb-12">
            <div className="flex items-center justify-between px-5 py-3 bg-white/[0.02] border-b border-white/5 rounded-t-2xl text-sm text-gray-500">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              </div>
              <span className="text-xs font-mono">terminal</span>
            </div>
            <div className="relative bg-[#080c20] border border-white/5 border-t-0 rounded-b-2xl p-7 text-left overflow-x-auto">
              <pre className="font-mono text-sm leading-[1.8] text-cyan-400">
                <code>{curlCommand}</code>
              </pre>
            </div>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-9 py-4 bg-gradient-to-br from-blue-500 to-cyan-400 text-white font-semibold rounded-xl shadow-[0_4px_24px_rgba(0,136,255,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,136,255,0.45)] transition-all"
          >
            Register Your Agent <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-16 text-center border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-gray-500 text-sm mb-1.5">
            SwarmID Protocol v1.0 — Open Standard
          </p>
          <p className="text-gray-600 text-xs">
            Built for the agentic future.
          </p>
        </div>
      </footer>
    </main>
  );
}
