"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SmartCsvImporter, TargetFieldDef } from "@/components/smart-csv-importer";
import { 
  Trash2, 
  Edit2, 
  Plus, 
  Upload, 
  Download, 
  Search, 
  HelpCircle, 
  CheckSquare, 
  Square, 
  MinusSquare,
  FileSpreadsheet,
  X,
  Tag,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const FAQ_TARGET_FIELDS: TargetFieldDef[] = [
  {
    key: "title",
    label: "Question / Topic",
    required: true,
    synonyms: ["question", "title", "faq", "q", "prompt", "topic", "faq_question", "question_title", "query", "issue", "faqtitle", "faqquestion", "heading"]
  },
  {
    key: "description",
    label: "Answer / Explanation",
    required: true,
    synonyms: ["answer", "description", "details", "ans", "response", "solution", "content", "faq_answer", "answer_details", "faqanswer", "explanation", "body", "text"]
  },
  {
    key: "category",
    label: "Category / Tag (Optional)",
    required: false,
    defaultValue: "General",
    synonyms: ["category", "tag", "topic", "section", "group", "type", "department", "faqcategory"]
  }
];

interface FAQItem {
  id: string;
  title: string;
  description: string;
  category?: string;
  createdAt?: number;
}

export default function FAQPage() {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvImporterOpen, setIsCsvImporterOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  
  const [formData, setFormData] = useState({ 
    title: "", 
    description: "",
    category: "General"
  });

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "faqs"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as FAQItem));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setItems(list);
    } catch (err) {
      console.error("Error fetching FAQs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.category && i.category.trim()) set.add(i.category.trim());
    });
    return Array.from(set).sort();
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = 
        selectedCategory === "all" || 
        (item.category || "General").toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, "faqs", editingId), {
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category.trim() || "General",
          updatedAt: Date.now()
        });
      } else {
        await addDoc(collection(db, "faqs"), {
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category.trim() || "General",
          createdAt: Date.now()
        });
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err: any) {
      alert("Error saving FAQ: " + err.message);
    }
  };

  // Smart CSV Bulk Import Handler
  const handleSmartCsvImport = async (rows: Record<string, any>[]) => {
    let count = 0;
    const chunkSize = 450;

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      chunk.forEach((row) => {
        const docRef = doc(collection(db, "faqs"));
        batch.set(docRef, {
          title: row.title || "Frequently Asked Question",
          description: row.description || "",
          category: row.category || "General",
          createdAt: Date.now(),
          ...(row._extraRawFields ? { extraFields: row._extraRawFields } : {})
        });
        count++;
      });

      await batch.commit();
    }

    await fetchItems();
    return { count };
  };

  // Delete Single FAQ
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ item?")) return;
    try {
      await deleteDoc(doc(db, "faqs", id));
      setSelectedIds(prev => prev.filter(item => item !== id));
      fetchItems();
    } catch (err: any) {
      alert("Error deleting FAQ: " + err.message);
    }
  };

  // Batch Delete
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected FAQs?`)) return;

    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, "faqs", id));
      });
      await batch.commit();
      setSelectedIds([]);
      fetchItems();
    } catch (err: any) {
      alert("Error deleting FAQs: " + err.message);
    }
  };

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(item => item.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const csvContent = "Question,Answer,Category\n" +
      '"What is CECHSTU?","Civil Engineering Club of HSTU is the official departmental club of Civil Engineering at Hajee Mohammad Danesh Science and Technology University.","General"\n' +
      '"How can I become an active member?","Students of the Civil Engineering department can register for membership during our annual recruitment drive or through the online membership portal.","Membership"\n' +
      '"How can I verify my workshop certificate?","You can navigate to the Verification tab on our website and input your Certificate ID to verify credentials.","Certificates"';

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "faq_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full font-inter space-y-6 pb-12">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-montserrat font-bold text-[#0F172A] tracking-tight">
                Frequently Asked Questions (FAQ)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage questions & answers displayed on the public portal and support pages.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Download CSV Template */}
          <button
            onClick={handleDownloadTemplate}
            className="bg-white/80 border border-slate-200 text-slate-700 px-4 h-12 rounded-[16px] font-semibold text-xs flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all"
            title="Download CSV sample file"
          >
            <Download className="h-4 w-4 text-slate-500" />
            CSV Template
          </button>

          {/* Smart CSV Importer Trigger */}
          <button
            onClick={() => setIsCsvImporterOpen(true)}
            className="bg-emerald-600 text-white px-5 h-12 rounded-[16px] font-semibold text-sm flex items-center gap-2 hover:scale-[1.02] shadow-[0_10px_30px_rgba(16,185,129,0.25)] transition-all"
          >
            <Upload className="h-4 w-4" /> Bulk Import CSV
          </button>

          {/* Add FAQ Button */}
          <button 
            onClick={() => { 
              setFormData({ title: "", description: "", category: "General" }); 
              setEditingId(null); 
              setIsModalOpen(true); 
            }} 
            className="bg-[#F59E0B] text-white px-6 h-12 rounded-[16px] font-semibold text-sm flex items-center gap-2 hover:scale-[1.02] shadow-[0_10px_30px_rgba(245,158,11,0.25)] transition-all"
          >
            <Plus className="h-5 w-5" /> Add FAQ
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/70 backdrop-blur-[24px] border border-white/40 rounded-[24px] p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search question, answer, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/80 border border-slate-200/80 rounded-[14px] pl-11 pr-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            All ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              {cat} ({items.filter(i => (i.category || "General").toLowerCase() === cat.toLowerCase()).length})
            </button>
          ))}
        </div>
      </div>

      {/* Batch Actions Bar (when items selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-[16px] px-5 py-3 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
            <CheckSquare className="w-4 h-4 text-amber-600" />
            <span>{selectedIds.length} FAQ{selectedIds.length > 1 ? "s" : ""} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-amber-100/60 transition-all"
            >
              Deselect All
            </button>
            <button
              onClick={handleBatchDelete}
              className="bg-red-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm hover:bg-red-700 flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* FAQ Items List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Loading FAQs...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-[24px] border border-white/40 rounded-[24px] p-12 text-center shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No FAQ items found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              {searchQuery ? "No questions match your current search query." : "Get started by adding questions or importing your FAQ list from CSV."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsCsvImporterOpen(true)}
                className="bg-emerald-600 text-white px-4 py-2.5 rounded-[14px] font-semibold text-xs flex items-center gap-2 hover:bg-emerald-700 transition-all"
              >
                <Upload className="w-4 h-4" /> Bulk Import CSV
              </button>
              <button
                onClick={() => { setFormData({ title: "", description: "", category: "General" }); setEditingId(null); setIsModalOpen(true); }}
                className="bg-amber-500 text-white px-4 py-2.5 rounded-[14px] font-semibold text-xs flex items-center gap-2 hover:bg-amber-600 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Single FAQ
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Table / List Header Control */}
            <div className="flex items-center justify-between px-3 py-1 text-xs text-slate-500 font-medium">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 hover:text-slate-900 transition-colors"
              >
                {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-amber-600" />
                ) : selectedIds.length > 0 ? (
                  <MinusSquare className="w-4 h-4 text-amber-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Select all ({filteredItems.length})</span>
              </button>

              <span>Showing {filteredItems.length} questions</span>
            </div>

            {filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isExpanded = expandedIds[item.id] !== false; // default expanded

              return (
                <div
                  key={item.id}
                  className={`bg-white/70 backdrop-blur-[24px] border transition-all rounded-[20px] shadow-[0_6px_25px_rgba(15,23,42,0.05)] overflow-hidden ${
                    isSelected ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/30" : "border-white/50 hover:border-slate-200"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      {/* Selection Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelectOne(item.id)}
                        className="mt-1 flex-shrink-0 text-slate-400 hover:text-amber-600 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/80 text-amber-800 border border-amber-200/50">
                              <Tag className="w-3 h-3" />
                              {item.category || "General"}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setFormData({
                                  title: item.title,
                                  description: item.description,
                                  category: item.category || "General"
                                });
                                setEditingId(item.id);
                                setIsModalOpen(true);
                              }}
                              className="text-slate-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Edit FAQ"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-slate-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete FAQ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Question Title */}
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="w-full text-left font-montserrat font-bold text-slate-900 text-base flex items-center justify-between group"
                        >
                          <span className="group-hover:text-amber-600 transition-colors">
                            {item.title}
                          </span>
                          <span className="ml-2 text-slate-400 group-hover:text-slate-600">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                        </button>

                        {/* Answer Details */}
                        {isExpanded && (
                          <div className="mt-3 text-sm text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50/60 rounded-[14px] p-4 border border-slate-100">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit FAQ Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#020617]/40 backdrop-blur-sm p-4 pt-12">
          <form 
            onSubmit={handleSave} 
            className="bg-white/95 backdrop-blur-3xl border border-white/40 p-8 rounded-[32px] w-full max-w-lg shadow-[0_25px_60px_rgba(0,0,0,0.35)] animate-fadeIn"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold font-montserrat tracking-tight text-slate-900">
                  {editingId ? "Edit FAQ" : "Add FAQ Question"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {editingId ? "Update existing question details" : "Create a new question and answer entry"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Category / Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. General, Membership, Events, Verification"
                  className="w-full bg-slate-50 border border-slate-200 rounded-[18px] p-4 text-[#0F172A] outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Question <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  placeholder="e.g. What is CECHSTU?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-[18px] p-4 text-[#0F172A] outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Answer <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Provide comprehensive details and links if needed..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-[18px] p-4 text-[#0F172A] outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-14 rounded-[18px] bg-white border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-14 rounded-[18px] bg-[#F59E0B] font-bold text-white shadow-[0_10px_40px_rgba(245,158,11,0.3)] hover:scale-[1.02] transition-all"
              >
                {editingId ? "Update FAQ" : "Save FAQ"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Smart CSV Importer Modal */}
      <SmartCsvImporter
        isOpen={isCsvImporterOpen}
        onClose={() => setIsCsvImporterOpen(false)}
        title="Import FAQs (CSV)"
        description="Smart column mapping for Questions, Answers, and Categories from spreadsheets or Google Forms."
        targetFields={FAQ_TARGET_FIELDS}
        defaultValues={{
          category: "General"
        }}
        sampleTemplateData={{
          headers: ["Timestamp", "Question", "Answer", "Category"],
          sampleRows: [
            ["2024-01-15 10:20:30", "What is CECHSTU?", "Civil Engineering Club of HSTU is the premier student organization of the Department of Civil Engineering at HSTU.", "General"],
            ["2024-01-15 11:30:15", "How to get a Certificate of Completion?", "Certificates are issued digitally after successful attendance and verification in official club workshops.", "Certificates"],
            ["2024-01-15 12:45:00", "Who can join the club executive committee?", "Regular enrolled Civil Engineering undergraduate students can apply during our annual election and interview sessions.", "Membership"]
          ],
          filename: "faq_sample_template.csv"
        }}
        onImport={handleSmartCsvImport}
      />
    </div>
  );
}
