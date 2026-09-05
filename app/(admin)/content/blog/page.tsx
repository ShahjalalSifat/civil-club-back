"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  query, 
  writeBatch 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CloudinaryUploader } from "@/components/cloudinary-upload";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { MarkdownToolbar } from "@/components/markdown-toolbar";
import { BlogFileImporter } from "@/components/blog-file-importer";
import { 
  Trash2, 
  Edit2, 
  Plus, 
  Search, 
  CheckSquare, 
  Square, 
  MinusSquare, 
  Eye, 
  EyeOff, 
  Globe, 
  X, 
  FileText,
  AlertCircle,
  User,
  Tag,
  Clock,
  BookOpen,
  Sparkles,
  Layers,
  Image as ImageIcon,
  FileCode,
  Columns,
  Maximize2,
  Download,
  ExternalLink,
  GitFork,
  Paperclip
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug?: string;
  author?: string;
  authorName?: string;
  authorRole?: string;
  authorImageUrl?: string;
  category?: string;
  tags?: string[];
  readTime?: string;
  excerpt?: string;
  descriptionMarkdown: string;
  content?: string;
  coverImageUrl: string;
  pdfAttachmentUrl?: string;
  pdfAttachmentName?: string;
  displayInFrontend?: boolean;
  status?: "published" | "draft";
  createdAt: number;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "visible" | "hidden">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // Editor view tab: "write" | "split" | "preview"
  const [editorTab, setEditorTab] = useState<"write" | "split" | "preview">("write");

  // Full Article Reader Preview Modal
  const [readingPost, setReadingPost] = useState<BlogPost | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Tracks whether the user has manually typed into the Excerpt box
  const [excerptTouched, setExcerptTouched] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    authorName: "",
    authorRole: "",
    authorImageUrl: "",
    category: "General",
    tags: "",
    readTime: "",
    excerpt: "",
    coverImageUrl: "",
    pdfAttachmentUrl: "",
    pdfAttachmentName: "",
    descriptionMarkdown: "",
    displayInFrontend: true,
  });

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "blogs"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => {
        const docData = d.data();
        const authorStr = docData.authorName || docData.author || "CE Club HSTU";
        return {
          id: d.id,
          title: docData.title || "",
          slug: docData.slug || "",
          author: authorStr,
          authorName: authorStr,
          authorRole: docData.authorRole || "",
          authorImageUrl: docData.authorImageUrl || "",
          category: docData.category || "General",
          tags: Array.isArray(docData.tags) ? docData.tags : (docData.tags ? [docData.tags] : []),
          readTime: docData.readTime || "",
          excerpt: docData.excerpt || docData.summary || "",
          descriptionMarkdown: docData.descriptionMarkdown || docData.content || "",
          content: docData.content || docData.descriptionMarkdown || "",
          coverImageUrl: docData.coverImageUrl || docData.imageUrl || "",
          pdfAttachmentUrl: docData.pdfAttachmentUrl || "",
          pdfAttachmentName: docData.pdfAttachmentName || "",
          displayInFrontend: docData.displayInFrontend !== undefined ? Boolean(docData.displayInFrontend) : true,
          status: docData.status || (docData.displayInFrontend === false ? "draft" : "published"),
          createdAt: docData.createdAt || 0,
        } as BlogPost;
      });

      // Sort by createdAt descending (newest first)
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setPosts(data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching blogs:", err);
      setError(err.message || "Failed to load blogs. Check database permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Unique categories list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  }, [posts]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        post.title.toLowerCase().includes(q) || 
        (post.authorName || post.author || "").toLowerCase().includes(q) ||
        (post.category || "").toLowerCase().includes(q) ||
        (post.descriptionMarkdown || "").toLowerCase().includes(q);
      
      const isVisible = post.displayInFrontend !== false;
      const matchStatus = 
        statusFilter === "all" || 
        (statusFilter === "visible" && isVisible) || 
        (statusFilter === "hidden" && !isVisible);

      const matchCategory = categoryFilter === "all" || post.category === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [posts, searchQuery, statusFilter, categoryFilter]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const visibleIds = useMemo(() => filteredPosts.map(p => p.id), [filteredPosts]);
  const isAllVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
  const isSomeVisibleSelected = visibleIds.some(id => selectedIds.includes(id)) && !isAllVisibleSelected;

  const handleSelectAllToggle = () => {
    if (isAllVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Toggle single item frontend display status
  const handleToggleDisplay = async (post: BlogPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newDisplayState = !post.displayInFrontend;
    const newStatus = newDisplayState ? "published" : "draft";

    // Optimistic update
    setPosts(prev => prev.map(p => p.id === post.id ? { 
      ...p, 
      displayInFrontend: newDisplayState,
      status: newStatus
    } : p));

    try {
      await updateDoc(doc(db, "blogs", post.id), {
        displayInFrontend: newDisplayState,
        status: newStatus
      });
    } catch (err: any) {
      console.error("Error toggling display status:", err);
      alert("Failed to update frontend display status: " + err.message);
      fetchPosts(); // Rollback
    }
  };

  // Bulk Display in Frontend toggle
  const handleBulkToggleDisplay = async (display: boolean) => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    const newStatus = display ? "published" : "draft";

    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.update(doc(db, "blogs", id), {
          displayInFrontend: display,
          status: newStatus
        });
      });
      await batch.commit();

      setPosts(prev => prev.map(p => selectedIds.includes(p.id) ? {
        ...p,
        displayInFrontend: display,
        status: newStatus
      } : p));

      alert(`${selectedIds.length} blog post(s) set to ${display ? "Display in Frontend" : "Hidden from Frontend"}.`);
    } catch (err: any) {
      console.error("Bulk toggle display error:", err);
      alert("Failed to update posts: " + err.message);
      fetchPosts();
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} blog post(s)?`)) return;

    setBulkActionLoading(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, "blogs", id));
      });
      await batch.commit();

      setPosts(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      alert(`Successfully deleted ${selectedIds.length} blog post(s).`);
    } catch (err: any) {
      console.error("Bulk delete error:", err);
      alert("Failed to delete blog posts: " + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rawTitle = formData.title.trim();
      const slug = rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const words = formData.descriptionMarkdown.trim().split(/\s+/).filter(Boolean).length;
      const computedReadTime = formData.readTime.trim() || `${Math.max(1, Math.ceil(words / 200))} min read`;
      const authorVal = formData.authorName.trim() || "CE Club HSTU";
      const categoryVal = formData.category.trim() || "General";
      const tagsArray = formData.tags
        ? formData.tags.split(",").map(t => t.trim()).filter(Boolean)
        : [];
      const autoExcerpt = formData.descriptionMarkdown.replace(/[#*`_\[\]]/g, "").trim().slice(0, 160) + (formData.descriptionMarkdown.trim().length > 160 ? "..." : "");
      
      const excerptVal = (excerptTouched && formData.excerpt.trim())
        ? formData.excerpt.trim()
        : autoExcerpt;

      const payload: any = {
        title: rawTitle,
        slug: slug,
        author: authorVal,
        authorName: authorVal,
        authorRole: formData.authorRole.trim(),
        authorImageUrl: formData.authorImageUrl.trim(),
        category: categoryVal,
        tags: tagsArray,
        readTime: computedReadTime,
        excerpt: excerptVal,
        summary: excerptVal,
        descriptionMarkdown: formData.descriptionMarkdown.trim(),
        content: formData.descriptionMarkdown.trim(),
        bodyRichText: formData.descriptionMarkdown.trim(),
        coverImageUrl: formData.coverImageUrl.trim(),
        imageUrl: formData.coverImageUrl.trim(),
        pdfAttachmentUrl: formData.pdfAttachmentUrl.trim(),
        pdfAttachmentName: formData.pdfAttachmentName.trim(),
        displayInFrontend: formData.displayInFrontend,
        status: formData.displayInFrontend ? "published" : "draft",
        updatedAt: Date.now()
      };

      // Extract all embedded images / diagrams from markdown
      const embeddedImgMatches = Array.from(formData.descriptionMarkdown.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^\s\)]+|data:image\/[^\s\)]+)\)/g));
      const extractedImagesList = embeddedImgMatches.map((m, idx) => ({
        index: idx + 1,
        alt: m[1] || `Figure ${idx + 1}`,
        url: m[2]
      }));
      payload.embeddedImages = extractedImagesList.map(item => item.url);
      payload.visualDiagrams = extractedImagesList;
      payload.hasDiagrams = extractedImagesList.length > 0 || formData.descriptionMarkdown.includes("```mermaid");

      if (editingId) {
        await updateDoc(doc(db, "blogs", editingId), payload);
      } else {
        payload.createdAt = Date.now();
        payload.publishedAt = new Date().toISOString();
        await addDoc(collection(db, "blogs"), payload);
      }

      setIsModalOpen(false);
      resetForm();
      fetchPosts();
    } catch (err: any) {
      console.error("Error saving blog post:", err);
      alert(err.message || "Failed to save blog post. Check database permissions.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    try {
      await deleteDoc(doc(db, "blogs", id));
      setPosts(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => prev.filter(item => item !== id));
    } catch (err: any) {
      console.error("Error deleting blog post:", err);
      alert(err.message || "Failed to delete blog post. Check database permissions.");
    }
  };

  const openEditModal = (post: BlogPost) => {
    setFormData({
      title: post.title || "",
      authorName: post.authorName || post.author || "",
      authorRole: post.authorRole || "",
      authorImageUrl: post.authorImageUrl || "",
      category: post.category || "General",
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : (post.tags || ""),
      readTime: post.readTime || "",
      excerpt: post.excerpt || "",
      coverImageUrl: post.coverImageUrl || "",
      pdfAttachmentUrl: post.pdfAttachmentUrl || "",
      pdfAttachmentName: post.pdfAttachmentName || "",
      descriptionMarkdown: post.descriptionMarkdown || post.content || "",
      displayInFrontend: post.displayInFrontend !== false,
    });
    setEditingId(post.id);
    setExcerptTouched(false);
    setEditorTab("write");
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ 
      title: "", 
      authorName: "",
      authorRole: "",
      authorImageUrl: "",
      category: "General",
      tags: "",
      readTime: "",
      excerpt: "",
      coverImageUrl: "",
      pdfAttachmentUrl: "",
      pdfAttachmentName: "",
      descriptionMarkdown: "", 
      displayInFrontend: true,
    });
    setEditingId(null);
    setExcerptTouched(false);
    setEditorTab("write");
  };

  // Append or insert snippet at cursor / end
  const handleInsertSnippet = (snippet: string) => {
    setFormData(prev => ({
      ...prev,
      descriptionMarkdown: prev.descriptionMarkdown 
        ? `${prev.descriptionMarkdown.trim()}\n\n${snippet}` 
        : snippet
    }));
  };

  // Handle imported file (.md, .docx, .txt, .pdf)
  const handleImportMarkdown = (importedMarkdown: string, meta?: any) => {
    setFormData(prev => {
      const newTitle = (!prev.title && meta?.title) ? meta.title : prev.title;
      const newAuthor = (!prev.authorName && meta?.author) ? meta.author : prev.authorName;
      const newCategory = (!prev.category || prev.category === "General") && meta?.category ? meta.category : prev.category;
      const newTags = (!prev.tags && meta?.tags) ? meta.tags : prev.tags;
      const newExcerpt = (!prev.excerpt && meta?.excerpt) ? meta.excerpt : prev.excerpt;
      const newCover = (!prev.coverImageUrl && meta?.coverImageUrl) ? meta.coverImageUrl : prev.coverImageUrl;

      // If existing content exists, append with clear divider, else replace
      const combinedMarkdown = prev.descriptionMarkdown.trim()
        ? `${prev.descriptionMarkdown.trim()}\n\n---\n\n${importedMarkdown}`
        : importedMarkdown;

      return {
        ...prev,
        title: newTitle || prev.title,
        authorName: newAuthor || prev.authorName,
        category: newCategory || prev.category,
        tags: newTags || prev.tags,
        excerpt: newExcerpt || prev.excerpt,
        coverImageUrl: newCover || prev.coverImageUrl,
        descriptionMarkdown: combinedMarkdown
      };
    });
  };

  return (
    <div className="flex flex-col font-inter space-y-6 pb-28">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold font-montserrat text-[#0F172A] tracking-tight">
              Blog & Articles
            </h2>
            <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-100">
              {posts.length} Posts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create rich articles with interactive flowcharts, diagrams, direct .MD/.DOCX/.PDF upload, and live preview.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-[16px] text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Blog Post
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl shrink-0 flex items-center gap-2 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 p-3 sm:p-4 rounded-[20px] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Select All Toggle Checkbox */}
          <button
            onClick={handleSelectAllToggle}
            disabled={visibleIds.length === 0}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              isAllVisibleSelected
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : isSomeVisibleSelected
                ? "bg-blue-50/50 border-blue-200 text-blue-600"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
            title="Toggle Select All in Current View"
          >
            {isAllVisibleSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : isSomeVisibleSelected ? (
              <MinusSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Select All ({visibleIds.length})</span>
          </button>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[140px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, author, category, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "all" ? "bg-white text-blue-700 shadow-2xs" : "hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("visible")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                statusFilter === "visible" ? "bg-white text-emerald-700 shadow-2xs" : "hover:text-slate-900"
              }`}
            >
              <Eye className="w-3 h-3" /> Visible
            </button>
            <button
              onClick={() => setStatusFilter("hidden")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                statusFilter === "hidden" ? "bg-white text-slate-700 shadow-2xs" : "hover:text-slate-900"
              }`}
            >
              <EyeOff className="w-3 h-3" /> Hidden
            </button>
          </div>

          {/* Category Filter */}
          {availableCategories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter blog posts by category"
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Categories ({posts.length})</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Bulk Action Bar (Visible when items selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-600 text-white p-3 sm:p-4 rounded-[20px] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-extrabold">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold">Selected Blog Posts</span>
            <button
              onClick={handleClearSelection}
              className="ml-2 text-xs text-blue-200 hover:text-white underline"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={bulkActionLoading}
              onClick={() => handleBulkToggleDisplay(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/20 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-300" />
              <span>Show in Frontend</span>
            </button>

            <button
              disabled={bulkActionLoading}
              onClick={() => handleBulkToggleDisplay(false)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/20 cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5 text-amber-300" />
              <span>Hide from Frontend</span>
            </button>

            <button
              disabled={bulkActionLoading}
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Blog Post Cards Grid */}
      <div className="w-full">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-96 rounded-[24px] bg-slate-100/80 animate-pulse border border-slate-200/50" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-white/60 backdrop-blur-md rounded-[24px] border border-slate-200">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700">No blog posts found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your search query or filters to find what you're looking for."
                : "Get started by creating your first technical article or importing a Markdown/Word file!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPosts.map((post) => {
              const isSelected = selectedIds.includes(post.id);
              const isLive = post.displayInFrontend !== false;
              const authorDisplayName = post.authorName || post.author || "CE Club HSTU";
              const hasDiagrams = post.descriptionMarkdown?.includes("mermaid") || post.descriptionMarkdown?.includes("graph TD") || post.descriptionMarkdown?.includes("flowchart");
              const hasPdf = Boolean(post.pdfAttachmentUrl);

              return (
                <div
                  key={post.id}
                  className={`group relative bg-white rounded-[24px] border transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md ${
                    isSelected 
                      ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10" 
                      : isLive 
                      ? "border-slate-200 hover:border-slate-300" 
                      : "border-slate-200/60 bg-slate-50/40 opacity-80"
                  }`}
                >
                  {/* Select Checkbox & Badges Overlay */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleToggleSelect(post.id); }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-md transition-all shadow-xs ${
                        isSelected 
                          ? "bg-blue-600 text-white" 
                          : "bg-white/80 text-slate-400 hover:text-slate-600 border border-slate-200"
                      }`}
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase backdrop-blur-md bg-white/90 text-slate-800 border border-slate-200 shadow-2xs">
                      {post.category || "General"}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                    {hasDiagrams && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/90 text-white backdrop-blur-md flex items-center gap-1 shadow-2xs" title="Contains Flowchart / Diagram">
                        <GitFork className="w-3 h-3" />
                        <span className="hidden sm:inline">Flowchart</span>
                      </span>
                    )}

                    {hasPdf && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600/90 text-white backdrop-blur-md flex items-center gap-1 shadow-2xs" title="PDF Document Attached">
                        <Paperclip className="w-3 h-3" />
                        <span className="hidden sm:inline">PDF</span>
                      </span>
                    )}

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase backdrop-blur-md shadow-2xs ${
                      isLive 
                        ? "bg-emerald-500/90 text-white border border-emerald-400/30" 
                        : "bg-slate-800/80 text-white border border-slate-700/50"
                    }`}>
                      {isLive ? "Live" : "Draft"}
                    </span>
                  </div>

                  {/* Cover Image */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    {post.coverImageUrl ? (
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2 bg-gradient-to-br from-slate-50 to-slate-100">
                        <FileText className="w-10 h-10" />
                        <span className="text-[11px] font-medium text-slate-400">Article Cover</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Meta info: Read Time & Date */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {post.readTime || "5 min read"}
                        </span>
                        <span>•</span>
                        <span>{new Date(post.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>

                      {/* Title */}
                      <h3 className="font-montserrat font-bold text-base text-[#0F172A] line-clamp-2 mb-2 leading-snug group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h3>

                      {/* Author Details */}
                      <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-slate-100">
                        {post.authorImageUrl ? (
                          <img
                            src={post.authorImageUrl}
                            alt={authorDisplayName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[11px] font-bold">
                            {authorDisplayName[0]}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {authorDisplayName}
                          </p>
                          {post.authorRole && (
                            <p className="text-[10px] text-slate-500 truncate">
                              {post.authorRole}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Excerpt / Summary */}
                      <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                        {post.excerpt || post.descriptionMarkdown || "No preview snippet available."}
                      </p>
                    </div>

                    {/* Display Toggle & Actions */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
                      {/* Display in Frontend Toggle Switch */}
                      <div className="flex items-center justify-between bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <Globe className={`w-4 h-4 ${isLive ? "text-emerald-600" : "text-slate-400"}`} />
                          <span className="text-xs font-bold text-slate-700">Display in Frontend</span>
                        </div>

                        {/* Interactive Toggle Switch */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isLive}
                          onClick={(e) => handleToggleDisplay(post, e)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            isLive ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                          title={isLive ? "Currently visible in frontend (click to hide)" : "Currently hidden from frontend (click to display)"}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              isLive ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => setReadingPost(post)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-100 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Preview full article with diagrams and attachments"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" /> Preview
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(post)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Blog Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-[28px] p-5 sm:p-7 w-full max-w-5xl shadow-2xl my-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold font-montserrat text-[#0F172A] flex items-center gap-2">
                  <span>{editingId ? "Edit Blog Article" : "Create New Blog Article"}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                    Flowcharts & MD/Docx Supported
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload Markdown/Word/PDF files or craft rich articles with interactive diagrams and live preview.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct File Importer (.md, .docx, .txt, .pdf) */}
            <div className="mb-5">
              <BlogFileImporter
                onImportMarkdown={handleImportMarkdown}
                onAttachPdf={(url, name) => {
                  setFormData(prev => ({
                    ...prev,
                    pdfAttachmentUrl: url,
                    pdfAttachmentName: name
                  }));
                }}
              />
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Article Title *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Advancements in High-Performance Sustainable Concrete & Structural Modeling"
                  className="w-full rounded-[16px] border border-slate-200 bg-slate-50 p-3.5 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              {/* Author Information Section */}
              <div className="p-4 rounded-[20px] bg-blue-50/50 border border-blue-100/80 space-y-3.5">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                    Author Details
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Author Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Md. Shahjalal Ahmed / Dr. Tanvir"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                      value={formData.authorName}
                      onChange={e => setFormData({...formData, authorName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Author Role / Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Research Lead, Batch '19 / Faculty"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={formData.authorRole}
                      onChange={e => setFormData({...formData, authorRole: e.target.value})}
                    />
                  </div>
                </div>

                {/* Author Avatar / Image Section with Cloudinary Upload */}
                <div className="space-y-2 pt-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Author Photo / Avatar (Upload or URL)
                  </label>

                  <div className="flex flex-col sm:flex-row gap-3 items-start">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                      {formData.authorImageUrl ? (
                        <img
                          src={formData.authorImageUrl}
                          alt="Author Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <input
                        type="url"
                        placeholder="https://example.com/author-avatar.jpg"
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={formData.authorImageUrl}
                        onChange={e => setFormData({...formData, authorImageUrl: e.target.value})}
                      />

                      <CloudinaryUploader
                        folder="cechstu_authors"
                        multiple={false}
                        label="Or upload author photo"
                        description="Uploads to Cloudinary and populates author photo URL"
                        buttonText="Choose Author Photo"
                        onUploadComplete={(results) => {
                          if (results.length > 0) {
                            setFormData(prev => ({ ...prev, authorImageUrl: results[0].secureUrl }));
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Category, Tags, Read Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Structural, Geotech, Events, Research"
                    className="w-full rounded-[16px] border border-slate-200 bg-slate-50 p-3 text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="AutoCAD, Concrete, BIM, Thesis, Flowchart"
                    className="w-full rounded-[16px] border border-slate-200 bg-slate-50 p-3 text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={formData.tags}
                    onChange={e => setFormData({...formData, tags: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Read Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 min read (Auto if empty)"
                    className="w-full rounded-[16px] border border-slate-200 bg-slate-50 p-3 text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={formData.readTime}
                    onChange={e => setFormData({...formData, readTime: e.target.value})}
                  />
                </div>
              </div>

              {/* Cover Image URL & Cloudinary Uploader */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Cover Image (Upload or Manual URL)
                </label>

                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                    {formData.coverImageUrl ? (
                      <img
                        src={formData.coverImageUrl}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="url"
                      placeholder="https://example.com/cover.jpg"
                      className="w-full rounded-[14px] border border-slate-200 bg-slate-50 p-3 text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={formData.coverImageUrl}
                      onChange={e => setFormData({...formData, coverImageUrl: e.target.value})}
                    />

                    <CloudinaryUploader
                      folder="cechstu_blog"
                      multiple={false}
                      label="Or upload cover photo from computer"
                      description="Uploads to Cloudinary and sets the Cover Image URL automatically"
                      buttonText="Choose Cover Image"
                      onUploadComplete={(results) => {
                        if (results.length > 0) {
                          setFormData(prev => ({ ...prev, coverImageUrl: results[0].secureUrl }));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* PDF Document Attachment Section */}
              <div className="p-4 rounded-[20px] bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Attached PDF / Document (Optional)
                    </h4>
                  </div>
                  {formData.pdfAttachmentUrl && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      PDF Attached
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      PDF File URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://res.cloudinary.com/.../report.pdf"
                      value={formData.pdfAttachmentUrl}
                      onChange={e => setFormData({ ...formData, pdfAttachmentUrl: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Document Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Research_Paper_Final.pdf"
                      value={formData.pdfAttachmentName}
                      onChange={e => setFormData({ ...formData, pdfAttachmentName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <CloudinaryUploader
                  folder="cechstu_blog_documents"
                  multiple={false}
                  label="Or upload PDF document to Cloudinary"
                  description="Uploads PDF and sets the download link for this article"
                  buttonText="Upload PDF Attachment"
                  onUploadComplete={(results) => {
                    if (results.length > 0) {
                      setFormData(prev => ({
                        ...prev,
                        pdfAttachmentUrl: results[0].secureUrl,
                        pdfAttachmentName: results[0].originalFilename || "Attached_Document.pdf"
                      }));
                    }
                  }}
                />
              </div>

              {/* Short Excerpt */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Short Excerpt / Summary (Optional)
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5 -mt-1">
                  Leave blank to auto-generate from Content Body on every save.
                </p>
                <input
                  type="text"
                  placeholder="Brief preview sentence for the card..."
                  className="w-full rounded-[16px] border border-slate-200 bg-slate-50 p-3 text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={formData.excerpt}
                  onChange={e => {
                    setExcerptTouched(true);
                    setFormData({...formData, excerpt: e.target.value});
                  }}
                />
              </div>

              {/* Markdown Content Section with Toolbar & Live Tab Switch */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-600" />
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                      Content Body (Markdown & Mermaid Flowcharts) *
                    </label>
                  </div>

                  {/* View Mode Switcher */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                    <button
                      type="button"
                      onClick={() => setEditorTab("write")}
                      className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        editorTab === "write" ? "bg-white text-blue-700 shadow-2xs" : "hover:text-slate-900"
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Write</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditorTab("split")}
                      className={`hidden sm:flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        editorTab === "split" ? "bg-white text-indigo-700 shadow-2xs" : "hover:text-slate-900"
                      }`}
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span>Split</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditorTab("preview")}
                      className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        editorTab === "preview" ? "bg-white text-emerald-700 shadow-2xs" : "hover:text-slate-900"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Preview</span>
                    </button>
                  </div>
                </div>

                {/* Diagrams & Markdown Quick Inserter Toolbar */}
                <MarkdownToolbar onInsertSnippet={handleInsertSnippet} />

                {/* Content Area according to active Tab */}
                {editorTab === "write" && (
                  <div className="relative">
                    <textarea
                      required
                      rows={14}
                      className="w-full rounded-[16px] border border-slate-200 bg-slate-50 p-4 text-sm font-mono text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed"
                      value={formData.descriptionMarkdown}
                      onChange={e => setFormData({...formData, descriptionMarkdown: e.target.value})}
                      placeholder="# Introduction&#10;&#10;Write the full article content here in markdown...&#10;&#10;```mermaid&#10;flowchart TD&#10;    A[Planning] --> B[Design]&#10;    B --> C[Construction]&#10;```&#10;&#10;## Key Findings&#10;- Point 1&#10;- Point 2"
                    />
                  </div>
                )}

                {editorTab === "split" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Markdown & Flowchart Code
                      </div>
                      <textarea
                        required
                        rows={16}
                        className="w-full rounded-[16px] border border-slate-200 bg-slate-50 p-3.5 text-xs font-mono text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed h-[420px]"
                        value={formData.descriptionMarkdown}
                        onChange={e => setFormData({...formData, descriptionMarkdown: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Live Rendered Output
                      </div>
                      <div className="h-[420px] overflow-y-auto rounded-[16px] border border-slate-200 bg-white p-4 shadow-2xs">
                        {formData.descriptionMarkdown ? (
                          <MarkdownRenderer content={formData.descriptionMarkdown} />
                        ) : (
                          <div className="text-center py-12 text-slate-400 text-xs">
                            Start typing markdown on the left to see live rendering.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {editorTab === "preview" && (
                  <div className="min-h-[300px] max-h-[550px] overflow-y-auto rounded-[16px] border border-slate-200 bg-white p-6 shadow-2xs">
                    {formData.descriptionMarkdown ? (
                      <div>
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 text-xs text-slate-500 font-medium">
                          <Eye className="w-4 h-4 text-emerald-600" />
                          <span>Full Article Visual Preview (Includes Diagrams & Tables)</span>
                        </div>
                        <MarkdownRenderer content={formData.descriptionMarkdown} />
                      </div>
                    ) : (
                      <div className="text-center py-16 text-slate-400 text-xs">
                        No content written yet. Switch to &quot;Write&quot; tab or choose a file above to add content!
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Live Switch in Form */}
              <div className="bg-slate-50 p-4 rounded-[20px] border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-600" />
                    Display in Frontend
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Toggle public visibility on the live site.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.displayInFrontend}
                  onClick={() => setFormData({ ...formData, displayInFrontend: !formData.displayInFrontend })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    formData.displayInFrontend ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formData.displayInFrontend ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-[16px] border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-[16px] bg-blue-600 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  {editingId ? "Save Article Changes" : "Publish Article to Frontend"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Article Reader Preview Modal */}
      {readingPost && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/70 backdrop-blur-md p-3 sm:p-6">
          <div className="bg-white rounded-[32px] p-6 sm:p-10 w-full max-w-4xl shadow-2xl my-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  {readingPost.category || "Article"}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {readingPost.readTime || "5 min read"}
                </span>
              </div>

              <button
                onClick={() => setReadingPost(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Article Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold font-montserrat text-slate-900 mb-4 tracking-tight leading-tight">
              {readingPost.title}
            </h1>

            {/* Author Badge */}
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
              {readingPost.authorImageUrl ? (
                <img
                  src={readingPost.authorImageUrl}
                  alt={readingPost.authorName || "Author"}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {(readingPost.authorName || readingPost.author || "C")[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {readingPost.authorName || readingPost.author || "CE Club HSTU"}
                </p>
                {readingPost.authorRole && (
                  <p className="text-xs text-slate-500">{readingPost.authorRole}</p>
                )}
              </div>
            </div>

            {/* Cover Image if present */}
            {readingPost.coverImageUrl && (
              <div className="my-6 rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-h-[420px] bg-slate-100">
                <img
                  src={readingPost.coverImageUrl}
                  alt={readingPost.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* PDF Attachment Download Pill if available */}
            {readingPost.pdfAttachmentUrl && (
              <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-red-950">
                      Attached Document / Research Paper
                    </h4>
                    <p className="text-[11px] text-red-700">
                      {readingPost.pdfAttachmentName || "Document.pdf"}
                    </p>
                  </div>
                </div>

                <a
                  href={readingPost.pdfAttachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:scale-[1.02] transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download / View PDF</span>
                </a>
              </div>
            )}

            {/* Formatted Markdown Body with Flowcharts */}
            <div className="mt-6">
              <MarkdownRenderer
                content={readingPost.descriptionMarkdown || readingPost.content || "No content available."}
              />
            </div>

            {/* Footer tags */}
            {readingPost.tags && readingPost.tags.length > 0 && (
              <div className="mt-8 pt-5 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {readingPost.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
