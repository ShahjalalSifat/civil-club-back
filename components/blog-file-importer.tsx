"use client";

import { useState, useRef } from "react";
import mammoth from "mammoth";
import { 
  FileText, 
  UploadCloud, 
  Sparkles, 
  FileCode, 
  FilePlus, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Layers,
  HelpCircle,
  FileCheck
} from "lucide-react";
import { uploadSingleToCloudinary } from "@/lib/cloudinary";

interface BlogFileImporterProps {
  onImportMarkdown: (markdown: string, extractedMeta?: {
    title?: string;
    author?: string;
    category?: string;
    tags?: string;
    excerpt?: string;
  }) => void;
  onAttachPdf?: (pdfUrl: string, pdfName: string) => void;
}

export function BlogFileImporter({ onImportMarkdown, onAttachPdf }: BlogFileImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const parseFrontmatter = (rawText: string) => {
    let content = rawText;
    const meta: { title?: string; author?: string; category?: string; tags?: string; excerpt?: string } = {};

    // Check for YAML Frontmatter (--- ... ---)
    const match = rawText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (match) {
      const frontmatter = match[1];
      content = match[2];

      const lines = frontmatter.split("\n");
      for (const line of lines) {
        const colonIdx = line.indexOf(":");
        if (colonIdx !== -1) {
          const key = line.slice(0, colonIdx).trim().toLowerCase();
          const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, "");
          if (key === "title") meta.title = val;
          if (key === "author" || key === "authorname") meta.author = val;
          if (key === "category") meta.category = val;
          if (key === "tags") meta.tags = val;
          if (key === "excerpt" || key === "description" || key === "summary") meta.excerpt = val;
        }
      }
    } else {
      // Look for H1 title (# Title) at the start
      const h1Match = content.match(/^#\s+([^\n]+)/);
      if (h1Match) {
        meta.title = h1Match[1].trim();
      }
    }

    return { content, meta };
  };

  const htmlToMarkdown = (html: string): string => {
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n")
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
      .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
      .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
      .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
      .replace(/<ul[^>]*>|<\/ul>/gi, "\n")
      .replace(/<ol[^>]*>|<\/ol>/gi, "\n")
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
      .replace(/<br\s*[\/]?>/gi, "\n")
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "> $1\n\n")
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const handleFileSelected = async (file: File) => {
    if (!file) return;
    setProcessing(true);
    setStatusMessage({ type: "info", text: `Processing ${file.name}...` });

    try {
      const fileName = file.name.toLowerCase();

      // 1. Markdown or Text file (.md, .markdown, .txt)
      if (fileName.endsWith(".md") || fileName.endsWith(".markdown") || fileName.endsWith(".txt")) {
        const text = await file.text();
        const { content, meta } = parseFrontmatter(text);
        onImportMarkdown(content, meta);
        setStatusMessage({
          type: "success",
          text: `Successfully imported "${file.name}"! ${meta.title ? `Title detected: "${meta.title}"` : ""}`
        });
      }
      // 2. Word Document (.docx)
      else if (fileName.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const markdown = htmlToMarkdown(result.value);

        // Try to infer title from first line
        const lines = markdown.split("\n").filter(Boolean);
        const inferredTitle = lines.length > 0 ? lines[0].replace(/^#+\s*/, "").slice(0, 100) : file.name.replace(/\.docx$/i, "");

        onImportMarkdown(markdown, { title: inferredTitle });
        setStatusMessage({
          type: "success",
          text: `Word document "${file.name}" converted and imported into editor with headings and lists preserved!`
        });
      }
      // 3. PDF Document (.pdf)
      else if (fileName.endsWith(".pdf")) {
        setStatusMessage({ type: "info", text: `Uploading PDF "${file.name}" to Cloudinary...` });
        const res = await uploadSingleToCloudinary(file, "cechstu_blog_documents");
        
        const pdfEmbedMarkdown = `\n\n### 📄 Attached Document / Research Report\n\n> **Document:** [${file.name}](${res.secureUrl})\n>\n> *Download or view this attached publication in high-resolution PDF format.*\n\n[![Download PDF](https://img.shields.io/badge/PDF-Download_Document-red?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](${res.secureUrl})\n\n`;
        
        onImportMarkdown(pdfEmbedMarkdown, {
          title: file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ")
        });

        if (onAttachPdf) {
          onAttachPdf(res.secureUrl, file.name);
        }

        setStatusMessage({
          type: "success",
          text: `PDF "${file.name}" uploaded to Cloudinary and attached to this article with download link!`
        });
      } else {
        throw new Error("Unsupported file format. Please choose a .md, .docx, .txt, or .pdf file.");
      }
    } catch (err: any) {
      console.error("Document import error:", err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to process the uploaded file."
      });
    } finally {
      setProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200/80 p-3.5 sm:p-4 rounded-2xl space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Direct File Importer (.MD, .DOCX, .TXT, .PDF)
            </h4>
            <p className="text-[11px] text-slate-500">
              Upload local markdown files, Word documents, or research PDFs to populate the article.
            </p>
          </div>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.docx,.txt,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />
          <button
            type="button"
            disabled={processing}
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            {processing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Importing File...</span>
              </>
            ) : (
              <>
                <FilePlus className="w-3.5 h-3.5" />
                <span>Choose .MD / .DOCX / .PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`flex items-start gap-2 p-2.5 rounded-xl text-xs font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : statusMessage.type === "error"
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : statusMessage.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          ) : (
            <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />
          )}
          <span className="flex-1 leading-snug">{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
