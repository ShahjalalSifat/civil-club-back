"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check, Download, AlertCircle, RefreshCw } from "lucide-react";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

declare global {
  interface Window {
    mermaid?: any;
    __mermaidPromise?: Promise<any>;
  }
}

// Singleton loader for Mermaid JS
function loadMermaid(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject("Window is undefined");
  }

  if (window.mermaid) {
    return Promise.resolve(window.mermaid);
  }

  if (window.__mermaidPromise) {
    return window.__mermaidPromise;
  }

  window.__mermaidPromise = new Promise((resolve, reject) => {
    // Check if script is already injected
    const existingScript = document.getElementById("mermaid-cdn-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.mermaid) {
          window.mermaid.initialize({
            startOnLoad: false,
            theme: "default",
            securityLevel: "loose",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            flowchart: {
              htmlLabels: true,
              curve: "basis",
              padding: 16,
              useMaxWidth: true,
            },
            sequence: {
              useMaxWidth: true,
            },
            pie: {
              useWidth: 600,
            }
          });
          resolve(window.mermaid);
        }
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "mermaid-cdn-script";
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (window.mermaid) {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          flowchart: {
            htmlLabels: true,
            curve: "basis",
            padding: 16,
            useMaxWidth: true,
          },
          sequence: {
            useMaxWidth: true,
          },
          pie: {
            useWidth: 600,
          }
        });
        resolve(window.mermaid);
      } else {
        reject(new Error("Mermaid library failed to load"));
      }
    };
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });

  return window.__mermaidPromise;
}

export function MermaidDiagram({ chart, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const cleanChart = chart.trim();

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      if (!cleanChart) return;
      setLoading(true);
      setError(null);

      try {
        const mermaid = await loadMermaid();
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        
        // Render to SVG
        const { svg } = await mermaid.render(id, cleanChart);
        
        if (isMounted) {
          setSvgContent(svg);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        console.warn("Mermaid render error:", err);
        if (isMounted) {
          setError(err?.message || "Diagram syntax error. Please verify the Mermaid chart syntax.");
          setLoading(false);
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [cleanChart]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cleanChart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `diagram-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className={`my-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-slate-800 text-xs ${className}`}>
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-amber-200/60">
          <div className="flex items-center gap-1.5 font-bold text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Diagram / Flowchart Syntax Issue</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="px-2 py-1 bg-white hover:bg-amber-100 rounded-lg text-[11px] font-semibold border border-amber-200 transition-colors"
          >
            {copied ? "Copied" : "Copy Code"}
          </button>
        </div>
        <p className="text-[11px] text-amber-700 mb-2 font-mono">{error}</p>
        <pre className="p-2.5 bg-white rounded-xl border border-amber-200 text-[11px] font-mono overflow-x-auto whitespace-pre">
          {cleanChart}
        </pre>
      </div>
    );
  }

  return (
    <div className={`group relative my-6 rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm overflow-hidden ${className}`}>
      {/* Action bar overlay */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/90 backdrop-blur-xs p-1 rounded-xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={handleCopyCode}
          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
          title="Copy Diagram Code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        {svgContent && (
          <button
            type="button"
            onClick={handleDownloadSvg}
            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="Download SVG Diagram"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-slate-400 text-xs font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          <span>Rendering diagram...</span>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="w-full overflow-x-auto flex justify-center items-center py-2 [&>svg]:max-w-full [&>svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
}
