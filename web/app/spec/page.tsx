import fs from "fs";
import path from "path";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SpecContent } from "./spec-content";

export default function SpecPage() {
  const protocolPath = path.join(process.cwd(), "..", "PROTOCOL.md");
  const content = fs.readFileSync(protocolPath, "utf-8");

  // Extract TOC entries from markdown headings
  const tocEntries: { level: number; text: string; id: string }[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const rawText = match[2].replace(/[🤖🔐📧✅🏦💬🕸️📊🔑🌐🔓]/g, "").trim();
      const id = rawText
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      tocEntries.push({ level, text: rawText, id });
    }
  }

  return (
    <main className="relative z-[1] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold">
            SwarmID Protocol Specification
          </h1>
          <p className="text-gray-400 mt-2">v1.0 — Open Standard</p>
        </div>

        <div className="flex gap-12">
          {/* Sidebar TOC */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-8">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-400 mb-4">
                Table of Contents
              </h3>
              <nav className="space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto">
                {tocEntries.map((entry, i) => (
                  <a
                    key={i}
                    href={`#${entry.id}`}
                    className={`block text-sm hover:text-cyan-400 transition-colors ${
                      entry.level === 2
                        ? "text-gray-300 font-medium py-1.5"
                        : "text-gray-500 pl-4 py-1"
                    }`}
                  >
                    {entry.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <article className="min-w-0 flex-1">
            <SpecContent content={content} />
          </article>
        </div>
      </div>
    </main>
  );
}
