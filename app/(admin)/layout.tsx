"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Sidebar } from "@/components/sidebar";
import {
  Menu,
  Home,
  Users,
  LayoutTemplate,
  Image as ImageIcon,
  MoreHorizontal,
  UserCheck,
  Award
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const rawPathname = usePathname();
  const pathname = rawPathname || "";

  if (loading) return null; // handled by AuthProvider
  if (!user) return null; // handled by AuthProvider redirect

  // Derive simple section title for mobile header
  const getPageTitle = () => {
    const path = pathname || "";
    if (path === "/") return "Dashboard";
    if (path.includes("/leadership")) return "Leadership";
    if (path.includes("/constitution")) return "Constitution";
    if (path.includes("/history")) return "History";
    if (path.includes("/blog")) return "Blog";
    if (path.includes("/gallery")) return "Gallery";
    if (path.includes("/magazine")) return "Magazine";
    if (path.includes("/resources")) return "Resources";
    if (path.includes("/log")) return "Events Log";
    if (path.includes("/notice")) return "Notices";
    if (path.includes("/certificate")) return "Certificates";
    if (path.includes("/membership")) return "Membership";
    if (path.includes("/location")) return "Location";
    if (path.includes("/faq")) return "FAQ";
    if (path.includes("/footer")) return "Footer Settings";
    return "Admin Portal";
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0F172A] overflow-hidden font-inter selection:bg-amber-500/30">
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent"></div>

      {/* Responsive Sidebar (Desktop persistent + Mobile Drawer) */}
      <Sidebar
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 w-full">
        {/* Mobile Top Header (Visible only < lg) */}
        <header className="lg:hidden shrink-0 flex items-center justify-between px-4 py-3 bg-white/85 backdrop-blur-[20px] border-b border-slate-200/80 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="Open Navigation Menu"
              className="p-2 -ml-1 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-2xs">
                C
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  {getPageTitle()}
                </h2>
                <p className="text-[10px] text-slate-400 font-medium">Club Admin</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 flex flex-col overflow-hidden p-2 sm:p-4 lg:p-6 pb-20 lg:pb-6">
          <div className="flex-1 overflow-auto bg-white/70 backdrop-blur-[24px] border border-white/40 shadow-[0_10px_35px_rgba(15,23,42,0.06)] rounded-2xl sm:rounded-[24px] lg:rounded-[28px]">
            <div className="p-3 sm:p-5 lg:p-6 min-h-full">
              {children}
            </div>
          </div>
        </main>

        {/* Mobile Quick Bottom Navigation Bar (Visible only < lg for fast thumb access) */}
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-slate-200/80 z-40 px-2 py-1 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
        >
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl min-h-[48px] min-w-[56px] transition-colors ${
              pathname === "/" ? "text-amber-600 font-bold" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Home</span>
          </Link>

          <Link
            href="/about/leadership"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl min-h-[48px] min-w-[56px] transition-colors ${
              pathname.includes("/about/leadership") ? "text-amber-600 font-bold" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Leaders</span>
          </Link>

          <Link
            href="/content/blog"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl min-h-[48px] min-w-[56px] transition-colors ${
              pathname.includes("/content/blog") ? "text-amber-600 font-bold" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <LayoutTemplate className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Blog</span>
          </Link>

          <Link
            href="/content/gallery"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl min-h-[48px] min-w-[56px] transition-colors ${
              pathname.includes("/content/gallery") ? "text-amber-600 font-bold" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <ImageIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Gallery</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl min-h-[48px] min-w-[56px] text-slate-500 hover:text-slate-900 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
