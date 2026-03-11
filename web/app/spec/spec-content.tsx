"use client";

import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function slugifyHeading(text: string): string {
  return text
    .replace(/[🤖🔐📧✅🏦💬🕸️📊🔑🌐🔓]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Code
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Link
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    const matches = [
      boldMatch ? { type: "bold", index: boldMatch.index!, match: boldMatch } : null,
      codeMatch ? { type: "code", index: codeMatch.index!, match: codeMatch } : null,
      linkMatch ? { type: "link", index: linkMatch.index!, match: linkMatch } : null,
    ]
      .filter(Boolean)
      .sort((a, b) => a!.index - b!.index);

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const first = matches[0]!;
    if (first.index > 0) {
      parts.push(remaining.slice(0, first.index));
    }

    if (first.type === "bold") {
      parts.push(
        <strong key={keyIdx++} className="font-semibold text-white">
          {first.match[1]}
        </strong>
      );
      remaining = remaining.slice(first.index + first.match[0].length);
    } else if (first.type === "code") {
      parts.push(
        <code
          key={keyIdx++}
          className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-cyan-400 text-sm font-mono"
        >
          {first.match[1]}
        </code>
      );
      remaining = remaining.slice(first.index + first.match[0].length);
    } else if (first.type === "link") {
      parts.push(
        <a
          key={keyIdx++}
          href={first.match[2]}
          className="text-cyan-400 hover:underline"
        >
          {first.match[1]}
        </a>
      );
      remaining = remaining.slice(first.index + first.match[0].length);
    }
  }

  return <>{parts}</>;
}

export function SpecContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let keyIdx = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip the title line (# heading)
    if (i === 0 && line.startsWith("# ")) {
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const text = line.replace(/^>\s*/, "").replace(/\*/g, "");
      elements.push(
        <blockquote
          key={keyIdx++}
          className="border-l-2 border-cyan-400/30 pl-4 py-2 my-6 text-gray-400 italic"
        >
          {text}
        </blockquote>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      elements.push(
        <hr key={keyIdx++} className="border-white/5 my-10" />
      );
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].replace(/[🤖🔐📧✅🏦💬🕸️📊🔑🌐🔓]/g, "").trim();
      const id = slugifyHeading(headingMatch[2]);

      const classes: Record<number, string> = {
        1: "text-3xl font-bold mt-12 mb-6",
        2: "text-2xl font-bold mt-12 mb-4",
        3: "text-xl font-semibold mt-8 mb-3",
        4: "text-lg font-semibold mt-6 mb-2",
      };
      const cls = classes[level] || "";
      if (level === 1) {
        elements.push(<h1 key={keyIdx++} id={id} className={cls}>{parseInline(text)}</h1>);
      } else if (level === 2) {
        elements.push(<h2 key={keyIdx++} id={id} className={cls}>{parseInline(text)}</h2>);
      } else if (level === 3) {
        elements.push(<h3 key={keyIdx++} id={id} className={cls}>{parseInline(text)}</h3>);
      } else {
        elements.push(<h4 key={keyIdx++} id={id} className={cls}>{parseInline(text)}</h4>);
      }
      i++;
      continue;
    }

    // Code block
    if (line.startsWith("```")) {
      const lang = line.replace("```", "").trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```

      elements.push(
        <div key={keyIdx++} className="my-6 rounded-2xl overflow-hidden border border-white/5">
          <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/5">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
            </div>
            <span className="text-xs text-gray-500 font-mono">{lang}</span>
          </div>
          <SyntaxHighlighter
            language={lang === "bash" ? "bash" : lang === "http" ? "http" : lang}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: "1.5rem",
              background: "#080c20",
              fontSize: "0.85rem",
              lineHeight: 1.8,
              borderRadius: 0,
            }}
          >
            {codeLines.join("\n")}
          </SyntaxHighlighter>
        </div>
      );
      continue;
    }

    // Table
    if (line.includes("|") && line.trim().startsWith("|")) {
      const tableRows: string[] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim().startsWith("|")) {
        tableRows.push(lines[i]);
        i++;
      }

      // Parse header
      const parseRow = (row: string) =>
        row
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim());

      const header = parseRow(tableRows[0]);
      // Skip separator row (index 1)
      const bodyRows = tableRows.slice(2).map(parseRow);

      elements.push(
        <div key={keyIdx++} className="my-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {header.map((cell, j) => (
                  <th
                    key={j}
                    className="text-left py-3 px-4 text-gray-300 font-semibold"
                  >
                    {parseInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, j) => (
                <tr key={j} className="border-b border-white/5">
                  {row.map((cell, k) => (
                    <td key={k} className="py-3 px-4 text-gray-400">
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Unordered list
    if (line.match(/^[-*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={keyIdx++} className="my-4 space-y-2">
          {items.map((item, j) => (
            <li
              key={j}
              className="flex items-start gap-2 text-gray-400 text-sm"
            >
              <span className="text-cyan-400 mt-1.5 shrink-0">&#x2022;</span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={keyIdx++} className="my-4 space-y-2">
          {items.map((item, j) => (
            <li
              key={j}
              className="flex items-start gap-3 text-gray-400 text-sm"
            >
              <span className="text-cyan-400 font-mono text-xs mt-0.5 shrink-0">
                {j + 1}.
              </span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={keyIdx++} className="text-gray-400 leading-relaxed my-3 text-sm">
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return <div>{elements}</div>;
}
