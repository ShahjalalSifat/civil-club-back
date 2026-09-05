"use client";

import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "./mermaid-diagram";
import { Copy, Check, FileText, Download, ExternalLink, Image as ImageIcon, Maximize2 } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const [copiedCodeId, setCopiedCodeId] = React.useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className={`prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1].toLowerCase() : "";
            const rawCode = String(children).replace(/\n$/, "");

            // Mermaid diagram rendering
            if (
              !inline &&
              (language === "mermaid" ||
                language === "diagram" ||
                language === "flowchart" ||
                rawCode.startsWith("graph ") ||
                rawCode.startsWith("flowchart ") ||
                rawCode.startsWith("sequenceDiagram") ||
                rawCode.startsWith("classDiagram") ||
                rawCode.startsWith("stateDiagram") ||
                rawCode.startsWith("erDiagram") ||
                rawCode.startsWith("gantt") ||
                rawCode.startsWith("pie ") ||
                rawCode.startsWith("mindmap"))
            ) {
              return <MermaidDiagram chart={rawCode} />;
            }

            // Standard code block
            if (!inline) {
              const codeId = `code-${Math.random().toString(36).substring(2, 7)}`;
              return (
                <div className="relative my-4 rounded-2xl bg-slate-900 text-slate-100 overflow-hidden border border-slate-800 shadow-sm not-prose">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800/80 text-xs text-slate-400">
                    <span className="font-mono font-semibold uppercase tracking-wider text-[11px] text-blue-400">
                      {language || "code"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(rawCode, codeId)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] font-semibold"
                    >
                      {copiedCodeId === codeId ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-slate-200">
                    <code>{children}</code>
                  </pre>
                </div>
              );
            }

            // Inline code
            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[12px] font-semibold"
                {...props}
              >
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="my-5 overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs not-prose">
                <table className="w-full text-left text-xs sm:text-sm border-collapse bg-white">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                {children}
              </thead>
            );
          },
          th({ children }) {
            return <th className="p-3.5 sm:p-4 border-r border-slate-200/60 last:border-r-0">{children}</th>;
          },
          td({ children }) {
            return <td className="p-3.5 sm:p-4 border-t border-slate-100 border-r border-slate-100/60 last:border-r-0 text-slate-700 font-medium">{children}</td>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-4 pl-4 sm:pl-5 py-2 border-l-4 border-blue-500 bg-blue-50/30 rounded-r-2xl italic text-slate-700 font-serif text-sm sm:text-base">
                {children}
              </blockquote>
            );
          },
          h1({ children }) {
            return (
              <h1 className="text-xl sm:text-2xl font-bold font-montserrat text-slate-900 mt-6 mb-3 pb-2 border-b border-slate-200/70 tracking-tight">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-lg sm:text-xl font-bold font-montserrat text-slate-900 mt-5 mb-2.5 tracking-tight flex items-center gap-2">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-base sm:text-lg font-bold font-montserrat text-slate-800 mt-4 mb-2">
                {children}
              </h3>
            );
          },
          ul({ children }) {
            return <ul className="my-3 space-y-1.5 list-disc pl-5 text-slate-700">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-3 space-y-1.5 list-decimal pl-5 text-slate-700 font-medium">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },
          a({ href, children }) {
            const isPdf = href?.toLowerCase().endsWith(".pdf");
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors ${
                  isPdf ? "bg-red-50 text-red-700 px-2 py-0.5 rounded-lg border border-red-200" : ""
                }`}
              >
                {isPdf && <FileText className="w-3.5 h-3.5 text-red-600 inline shrink-0" />}
                <span>{children}</span>
                <ExternalLink className="w-3 h-3 opacity-60 inline shrink-0" />
              </a>
            );
          },
          img({ src, alt }) {
            return (
              <figure className="my-6 not-prose">
                <div className="group relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-slate-50/80 hover:border-blue-300 transition-all flex items-center justify-center p-2 sm:p-4">
                  <img
                    src={src}
                    alt={alt || "Article diagram / image"}
                    className="max-h-[650px] w-auto max-w-full object-contain mx-auto rounded-xl transition-transform duration-200"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  {typeof src === "string" && src && (
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open full resolution diagram in new tab"
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-semibold flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs shadow-xs"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Full View</span>
                    </a>
                  )}
                </div>
                {alt && (
                  <figcaption className="text-center text-xs text-slate-500 mt-2 font-medium italic flex items-center justify-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{alt}</span>
                  </figcaption>
                )}
              </figure>
            );
          },
          hr() {
            return <hr className="my-6 border-t border-slate-200" />;
          }
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
