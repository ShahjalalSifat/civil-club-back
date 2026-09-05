"use client";

import { useState, useRef } from "react";
import { 
  FileText, 
  UploadCloud, 
  FilePlus, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Image as ImageIcon, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  LayoutTemplate 
} from "lucide-react";
import { uploadSingleToCloudinary, getCloudinaryConfig, formatWebFriendlyCloudinaryUrl } from "@/lib/cloudinary";

export interface ExtractedDocVisual {
  index: number;
  url: string;
  alt: string;
  format: string;
}

interface BlogFileImporterProps {
  onImportMarkdown: (markdown: string, extractedMeta?: {
    title?: string;
    author?: string;
    category?: string;
    tags?: string;
    excerpt?: string;
    coverImageUrl?: string;
    extractedImages?: ExtractedDocVisual[];
  }) => void;
  onAttachPdf?: (pdfUrl: string, pdfName: string) => void;
}

/**
 * Converts rich HTML (from Mammoth Word conversion) into structured GitHub Flavored Markdown (GFM).
 * Preserves exact positions of pictures, diagrams, headings, lists, tables, quotes, and formatting.
 */
export function domToMarkdown(htmlString: string): string {
  if (!htmlString || typeof window === "undefined") {
    return htmlString || "";
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${htmlString}</div>`, "text/html");
  const container = doc.body.firstElementChild || doc.body;

  function traverse(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    // Embedded diagram / image
    if (tag === "img") {
      const src = el.getAttribute("src") || "";
      const alt = el.getAttribute("alt") || "Figure / Technical Diagram";
      if (!src) return "";
      return `\n\n![${alt}](${src})\n\n`;
    }

    // Line break
    if (tag === "br") return "  \n";

    // Horizontal rule
    if (tag === "hr") return "\n\n---\n\n";

    // Recursively process child nodes
    const childNodes = Array.from(el.childNodes);
    const childrenText = childNodes.map(child => traverse(child)).join("");

    // Headings
    if (tag === "h1") return `\n\n# ${childrenText.trim()}\n\n`;
    if (tag === "h2") return `\n\n## ${childrenText.trim()}\n\n`;
    if (tag === "h3") return `\n\n### ${childrenText.trim()}\n\n`;
    if (tag === "h4") return `\n\n#### ${childrenText.trim()}\n\n`;
    if (tag === "h5") return `\n\n##### ${childrenText.trim()}\n\n`;
    if (tag === "h6") return `\n\n###### ${childrenText.trim()}\n\n`;

    // Paragraphs
    if (tag === "p") {
      const trimmed = childrenText.trim();
      return trimmed ? `\n\n${trimmed}\n\n` : "";
    }

    // Blockquote
    if (tag === "blockquote") {
      const lines = childrenText.trim().split("\n");
      return `\n\n${lines.map(l => `> ${l}`).join("\n")}\n\n`;
    }

    // Bold
    if (tag === "strong" || tag === "b") {
      const t = childrenText.trim();
      return t ? `**${t}**` : "";
    }

    // Italic
    if (tag === "em" || tag === "i") {
      const t = childrenText.trim();
      return t ? `*${t}*` : "";
    }

    // Underline
    if (tag === "u" || tag === "ins") {
      const t = childrenText.trim();
      return t ? `<u>${t}</u>` : "";
    }

    // Strikethrough
    if (tag === "s" || tag === "strike" || tag === "del") {
      const t = childrenText.trim();
      return t ? `~~${t}~~` : "";
    }

    // Inline Code
    if (tag === "code") {
      return `\`${childrenText}\``;
    }

    // Preformatted Code block
    if (tag === "pre") {
      return `\n\n\`\`\`\n${childrenText.trim()}\n\`\`\`\n\n`;
    }

    // Links
    if (tag === "a") {
      const href = el.getAttribute("href") || "";
      const text = childrenText.trim() || href;
      return href ? `[${text}](${href})` : text;
    }

    // Unordered List
    if (tag === "ul") {
      const items = Array.from(el.children).filter(c => c.tagName.toLowerCase() === "li");
      const rendered = items.map(li => `- ${traverse(li).trim()}`).join("\n");
      return `\n\n${rendered}\n\n`;
    }

    // Ordered List
    if (tag === "ol") {
      const items = Array.from(el.children).filter(c => c.tagName.toLowerCase() === "li");
      const rendered = items.map((li, idx) => `${idx + 1}. ${traverse(li).trim()}`).join("\n");
      return `\n\n${rendered}\n\n`;
    }

    // List item (handled by parent ul/ol, but fallback here)
    if (tag === "li") {
      return childrenText;
    }

    // Tables (Word Tables -> GFM Markdown Tables)
    if (tag === "table") {
      const trs = Array.from(el.querySelectorAll("tr"));
      if (trs.length === 0) return "";

      const tableData: string[][] = [];
      for (const tr of trs) {
        const cells = Array.from(tr.querySelectorAll("th, td"));
        tableData.push(cells.map(c => (c.textContent || "").replace(/\|/g, "\\|").trim()));
      }

      if (tableData.length === 0) return "";
      const maxCols = Math.max(...tableData.map(r => r.length));
      if (maxCols === 0) return "";

      const padded = tableData.map(r => {
        const res = [...r];
        while (res.length < maxCols) res.push("");
        return res;
      });

      const header = padded[0];
      const headerStr = `| ${header.join(" | ")} |`;
      const dividerStr = `| ${Array(maxCols).fill("---").join(" | ")} |`;
      const bodyRows = padded.slice(1).map(r => `| ${r.join(" | ")} |`).join("\n");

      return `\n\n${headerStr}\n${dividerStr}\n${bodyRows}\n\n`;
    }

    return childrenText;
  }

  const rawMarkdown = traverse(container);
  return rawMarkdown
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function BlogFileImporter({ onImportMarkdown, onAttachPdf }: BlogFileImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [extractedVisuals, setExtractedVisuals] = useState<ExtractedDocVisual[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

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

  const handleFileSelected = async (file: File) => {
    if (!file) return;
    setProcessing(true);
    setExtractedVisuals([]);
    setStatusMessage({ type: "info", text: `Reading "${file.name}"...` });

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
      // 2. Word Document (.docx) with embedded pictures & diagrams
      else if (fileName.endsWith(".docx")) {
        const mammothModule: any = await import("mammoth/mammoth.browser").catch(() => import("mammoth"));
        const mammoth = mammothModule.default || mammothModule;
        const arrayBuffer = await file.arrayBuffer();
        let imageCounter = 0;
        const visuals: ExtractedDocVisual[] = [];

        setStatusMessage({
          type: "info",
          text: `Scanning Word document for text, diagrams, and figures...`
        });

        const options = {
          convertImage: mammoth.images?.imgElement ? mammoth.images.imgElement(async (element: any) => {
            imageCounter++;
            const currentNum = imageCounter;
            const contentType = element.contentType || "image/png";
            const rawExt = contentType.split("/")[1]?.replace("+xml", "") || "png";
            const ext = rawExt === "jpeg" ? "jpg" : rawExt;
            const altText = element.altText?.trim() || `Figure ${currentNum}: Document Diagram`;

            setStatusMessage({
              type: "info",
              text: `Extracting and uploading diagram/picture ${currentNum} to Cloudinary...`
            });

            try {
              const config = getCloudinaryConfig();
              if (config.isConfigured) {
                const arrayBuf = await element.readAsArrayBuffer();
                const blob = new Blob([arrayBuf], { type: contentType });
                const diagramFile = new File([blob], `diagram-${Date.now()}-${currentNum}.${ext}`, { type: contentType });

                const uploadRes = await uploadSingleToCloudinary(diagramFile, "cechstu_blog_media");
                const cleanUrl = formatWebFriendlyCloudinaryUrl(uploadRes.secureUrl, uploadRes.format);

                visuals.push({
                  index: currentNum,
                  url: cleanUrl,
                  alt: altText,
                  format: ext
                });

                return { src: cleanUrl, alt: altText };
              }
            } catch (upErr) {
              console.warn(`Cloudinary upload failed for embedded image ${currentNum}, using high-res data URL fallback:`, upErr);
            }

            // High-res data URI fallback so pictures/diagrams are NEVER lost
            const base64 = await element.readAsBase64String();
            const dataUri = `data:${contentType};base64,${base64}`;
            visuals.push({
              index: currentNum,
              url: dataUri,
              alt: altText,
              format: ext
            });

            return { src: dataUri, alt: altText };
          }) : undefined
        };

        const result = await mammoth.convertToHtml({ arrayBuffer }, options);
        const markdown = domToMarkdown(result.value);

        // Store extracted visuals in state for preview and quick actions
        setExtractedVisuals(visuals);

        // Try to infer title from first line
        const lines = markdown.split("\n").filter(Boolean);
        const inferredTitle = lines.length > 0 ? lines[0].replace(/^#+\s*/, "").slice(0, 100) : file.name.replace(/\.docx$/i, "");

        // Pass markdown and meta (including first image as suggested cover)
        onImportMarkdown(markdown, { 
          title: inferredTitle,
          coverImageUrl: visuals.length > 0 ? visuals[0].url : undefined,
          extractedImages: visuals
        });

        if (visuals.length > 0) {
          setStatusMessage({
            type: "success",
            text: `Word document "${file.name}" converted and imported! Extracted and hosted ${visuals.length} diagram(s)/picture(s) in their exact document locations.`
          });
        } else {
          setStatusMessage({
            type: "success",
            text: `Word document "${file.name}" converted and imported with headings, lists, and tables preserved!`
          });
        }
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

  const copyMarkdownSnippet = (visual: ExtractedDocVisual) => {
    const snippet = `![${visual.alt}](${visual.url})`;
    navigator.clipboard.writeText(snippet);
    setCopiedIdx(visual.index);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200/80 p-3.5 sm:p-4 rounded-2xl space-y-3 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Direct File Importer (.DOCX, .MD, .PDF, .TXT)</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-800 rounded font-semibold">
                Diagrams & Pictures Supported
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Upload Word docs (.docx) with embedded diagrams & pictures — all assets are extracted, hosted on Cloudinary, and placed in their exact positions.
            </p>
          </div>
        </div>

        <div className="shrink-0">
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
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            {processing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing Document...</span>
              </>
            ) : (
              <>
                <FilePlus className="w-3.5 h-3.5" />
                <span>Import .DOCX / .MD / .PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real-time Status Notification */}
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

      {/* Extracted Visuals Gallery / Inspector */}
      {extractedVisuals.length > 0 && (
        <div className="pt-2 border-t border-blue-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Extracted Document Visuals ({extractedVisuals.length})</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Already embedded in article markdown at exact positions
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {extractedVisuals.map((visual) => (
              <div
                key={visual.index}
                className="group relative bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs hover:border-blue-400 transition-all"
              >
                <div className="h-24 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100">
                  <img
                    src={visual.url}
                    alt={visual.alt}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px]">
                  <span className="truncate font-semibold text-slate-700" title={visual.alt}>
                    Fig {visual.index}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => copyMarkdownSnippet(visual)}
                      title="Copy Markdown code"
                      className="p-1 text-slate-500 hover:text-blue-600 rounded bg-slate-50 hover:bg-blue-50 transition-colors"
                    >
                      {copiedIdx === visual.index ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <a
                      href={visual.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open full image"
                      className="p-1 text-slate-500 hover:text-blue-600 rounded bg-slate-50 hover:bg-blue-50 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
