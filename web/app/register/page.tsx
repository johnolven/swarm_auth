"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  Loader2,
  Mail,
  Home,
  FileText,
} from "lucide-react";

const CAPABILITIES = [
  "web-search",
  "code",
  "data-analysis",
  "communication",
  "file-management",
  "browsing",
] as const;

const PROTOCOLS = ["MCP", "A2A", "HTTP", "WebSocket"] as const;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full mb-10">
      <div className="flex items-center justify-between mb-3">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s < step
                  ? "bg-cyan-400 text-navy-900"
                  : s === step
                    ? "bg-gradient-to-br from-blue-500 to-cyan-400 text-white"
                    : "bg-white/5 text-gray-500"
              }`}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
            <span
              className={`hidden sm:inline text-xs ${s === step ? "text-cyan-400 font-medium" : "text-gray-500"}`}
            >
              {
                ["Agent Identity", "Owner Binding", "Review", "Success"][s - 1]
              }
            </span>
          </div>
        ))}
      </div>
      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        />
      </div>
    </div>
  );
}

function ConfettiPiece({ index }: { index: number }) {
  const colors = ["#00d4ff", "#0066ff", "#6c5ce7", "#ffc107", "#00b894"];
  const left = Math.random() * 100;
  const delay = Math.random() * 2;
  const duration = 2 + Math.random() * 3;
  return (
    <div
      className="fixed w-2 h-2 rounded-sm pointer-events-none z-50"
      style={{
        left: `${left}%`,
        top: "-10px",
        backgroundColor: colors[index % colors.length],
        animation: `confetti-fall ${duration}s linear ${delay}s forwards`,
      }}
    />
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);

  // Step 1
  const [agentName, setAgentName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [protocols, setProtocols] = useState<string[]>([]);

  // Step 2
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  // Step 3/4
  const [isRegistering, setIsRegistering] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!slugEdited) {
      setSlug(slugify(agentName));
    }
  }, [agentName, slugEdited]);

  const agentEmail = slug ? `${slug}@swarmid.io` : "";

  const agentCard = {
    swarmid: "1.0",
    agent: {
      id: agentId || "pending...",
      slug: slug || "my-agent",
      name: agentName || "My Agent",
      description: description || undefined,
      capabilities: capabilities.length > 0 ? capabilities : undefined,
      protocols: protocols.length > 0 ? protocols : undefined,
      created_at: new Date().toISOString(),
    },
    owner: {
      email_hash: ownerEmail
        ? `sha256:${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}...`
        : "sha256:pending...",
      verified: false,
      trust_level: "unverified",
    },
    endpoints: {
      card: `https://api.swarmid.io/.well-known/agents/${slug || "my-agent"}/swarmid.json`,
      agent_email: agentEmail || "pending@swarmid.io",
    },
    auth: {
      type: "bearer",
      registration_endpoint: "https://api.swarmid.io/v1/register",
    },
  };

  const agentCardJson = JSON.stringify(agentCard, null, 2);

  const handleRegister = useCallback(async () => {
    setIsRegistering(true);
    await new Promise((r) => setTimeout(r, 1500));
    setAgentId(uuidv4());
    setIsRegistering(false);
    setStep(4);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  }, []);

  const copyJson = useCallback(() => {
    navigator.clipboard.writeText(agentCardJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [agentCardJson]);

  const downloadJson = useCallback(() => {
    const blob = new Blob([agentCardJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "agent"}-card.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [agentCardJson, slug]);

  const toggleCapability = (cap: string) => {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  const toggleProtocol = (proto: string) => {
    setProtocols((prev) =>
      prev.includes(proto) ? prev.filter((p) => p !== proto) : [...prev, proto]
    );
  };

  const canProceedStep1 = agentName.trim().length > 0 && slug.length >= 3;
  const canProceedStep2 =
    ownerName.trim().length > 0 && ownerEmail.includes("@");

  return (
    <main className="relative z-[1] min-h-screen">
      {showConfetti &&
        Array.from({ length: 40 }, (_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}

      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-lg font-bold">Register Agent</h1>
          <div className="w-16" />
        </div>

        <ProgressBar step={step} />

        {/* ═══ STEP 1: Agent Identity ═══ */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-2">Agent Identity</h2>
            <p className="text-gray-400 mb-8">
              Define your agent&apos;s public profile.
            </p>

            <div className="space-y-6">
              {/* Agent Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Agent Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Research Bot"
                  className="w-full px-4 py-3 bg-navy-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Slug <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    setSlugEdited(true);
                  }}
                  placeholder="research-bot"
                  className="w-full px-4 py-3 bg-navy-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono"
                />
                {slug && (
                  <p className="mt-2 text-sm">
                    <Mail className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
                    <span className="text-cyan-400 font-mono">
                      {slug}@swarmid.io
                    </span>
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A helpful assistant that..."
                  rows={3}
                  className="w-full px-4 py-3 bg-navy-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all resize-none"
                />
              </div>

              {/* Capabilities */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Capabilities
                </label>
                <div className="flex flex-wrap gap-2">
                  {CAPABILITIES.map((cap) => (
                    <button
                      key={cap}
                      onClick={() => toggleCapability(cap)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        capabilities.includes(cap)
                          ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/30"
                          : "bg-white/5 text-gray-400 border border-white/10 hover:border-white/20"
                      }`}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
              </div>

              {/* Protocols */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Protocols
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROTOCOLS.map((proto) => (
                    <button
                      key={proto}
                      onClick={() => toggleProtocol(proto)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        protocols.includes(proto)
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-white/5 text-gray-400 border border-white/10 hover:border-white/20"
                      }`}
                    >
                      {proto}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-10">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-br from-blue-500 to-cyan-400 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_4px_24px_rgba(0,136,255,0.3)] transition-all cursor-pointer"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Owner Binding ═══ */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-2">Owner Binding</h2>
            <p className="text-gray-400 mb-8">
              Link your agent to a responsible human. This info is kept private.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Owner Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full px-4 py-3 bg-navy-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Owner Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full px-4 py-3 bg-navy-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Kept private. Only a SHA-256 hash is stored publicly.
                </p>
              </div>

              {/* Info boxes */}
              <div className="space-y-3 mt-8">
                <div className="flex items-start gap-3 p-4 bg-cyan-400/5 border border-cyan-400/10 rounded-xl">
                  <Mail className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Agent Email</p>
                    <p className="text-sm text-gray-400">
                      Your agent will be contactable at:{" "}
                      <span className="text-cyan-400 font-mono font-medium">
                        {agentEmail || "slug@swarmid.io"}
                      </span>
                    </p>
                  </div>
                </div>
                {ownerEmail && (
                  <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                    <Mail className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Notifications</p>
                      <p className="text-sm text-gray-400">
                        You will receive notifications at:{" "}
                        <span className="text-blue-400 font-medium">
                          {ownerEmail}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <p className="text-xs text-gray-500">
                    Your email is never exposed. We store only a SHA-256 hash
                    publicly. The hash is salted with your agent&apos;s unique
                    ID, preventing cross-agent correlation.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-10">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-8 py-3 bg-white/5 text-gray-400 font-semibold rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-br from-blue-500 to-cyan-400 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_4px_24px_rgba(0,136,255,0.3)] transition-all cursor-pointer"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Review & Generate ═══ */}
        {step === 3 && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-2">Review & Generate</h2>
            <p className="text-gray-400 mb-8">
              Review your AgentCard before registering.
            </p>

            {/* Agent email highlight */}
            <div className="flex items-center gap-3 p-4 bg-cyan-400/5 border border-cyan-400/10 rounded-xl mb-6">
              <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Generated Agent Email</p>
                <p className="text-lg font-mono font-bold text-cyan-400">
                  {agentEmail}
                </p>
              </div>
            </div>

            {/* JSON preview */}
            <div className="relative">
              <div className="flex items-center justify-between px-5 py-3 bg-white/[0.02] border-b border-white/5 rounded-t-2xl text-sm text-gray-500">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
                <span className="text-xs font-mono">agentcard.json</span>
              </div>
              <div className="relative bg-[#080c20] border border-white/5 border-t-0 rounded-b-2xl p-6 overflow-x-auto">
                <button
                  onClick={copyJson}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-all cursor-pointer"
                >
                  {copied ? (
                    <span className="text-green-400">
                      <Check className="w-3.5 h-3.5 inline mr-1" />
                      Copied!
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      <Copy className="w-3.5 h-3.5 inline mr-1" />
                      Copy
                    </span>
                  )}
                </button>
                <pre className="font-mono text-sm leading-[1.8] text-gray-300">
                  <code>{agentCardJson}</code>
                </pre>
              </div>
            </div>

            <div className="flex justify-between mt-10">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-8 py-3 bg-white/5 text-gray-400 font-semibold rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleRegister}
                disabled={isRegistering}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-br from-blue-500 to-cyan-400 text-white font-semibold rounded-xl disabled:opacity-70 hover:shadow-[0_4px_24px_rgba(0,136,255,0.3)] transition-all cursor-pointer"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    Register Agent <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: Success ═══ */}
        {step === 4 && (
          <div className="animate-fade-in-up text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 mx-auto flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3">
              Your agent is registered!
            </h2>
            <p className="text-gray-400 mb-10">
              Check your email ({ownerEmail}) to verify and activate your agent.
            </p>

            <div className="space-y-4 mb-10">
              <div className="flex items-center justify-between p-4 bg-navy-800 border border-white/10 rounded-xl">
                <span className="text-sm text-gray-400">Agent ID</span>
                <span className="text-sm font-mono text-white">{agentId}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-cyan-400/5 border border-cyan-400/10 rounded-xl">
                <span className="text-sm text-gray-400">Agent Email</span>
                <span className="text-sm font-mono text-cyan-400 font-medium">
                  {agentEmail}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-navy-800 border border-white/10 rounded-xl">
                <span className="text-sm text-gray-400">Trust Level</span>
                <span className="text-sm text-yellow-400 font-medium">
                  Unverified — verify email to upgrade
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <button
                onClick={downloadJson}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:shadow-[0_4px_24px_rgba(0,136,255,0.3)] transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download AgentCard
              </button>
              <button
                onClick={copyJson}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-gray-400 border border-white/10 font-semibold rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />{" "}
                {copied ? "Copied!" : "Copy JSON"}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/spec"
                className="inline-flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <FileText className="w-4 h-4" /> View Spec
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <Home className="w-4 h-4" /> Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
