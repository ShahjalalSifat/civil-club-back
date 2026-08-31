"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  Users,
  FileText,
  History,
  LayoutTemplate,
  Image as ImageIcon,
  Video,
  BookOpen,
  FolderOpen,
  Calendar,
  Bell,
  Award,
  UserCheck,
  Mail,
  MapPin,
  HelpCircle,
  LogOut,
  Home,
  X,
  ChevronRight
} from "lucide-react";

export const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  {
    name: "About",
    items: [
      { name: "Leadership", href: "/about/leadership", icon: Users },
      { name: "Constitution", href: "/about/constitution", icon: FileText },
      { name: "History", href: "/about/history", icon: History },
    ],
  },
  {
    name: "Content",
    items: [
      { name: "Blog", href: "/content/blog", icon: LayoutTemplate },
      { name: "Gallery", href: "/content/gallery", icon: ImageIcon },
      { name: "Magazine", href: "/content/magazine", icon: BookOpen },
      { name: "Resources", href: "/content/resources", icon: FolderOpen },
    ],
  },
  {
    name: "Event",
    items: [
      { name: "Log", href: "/event/log", icon: Calendar },
      { name: "Notice", href: "/event/notice", icon: Bell },
    ],
  },
  {
    name: "Verification",
    items: [
      { name: "Certificate", href: "/verification/certificate", icon: Award },
      { name: "Membership", href: "/verification/membership", icon: UserCheck },
    ],
  },
  {
    name: "Contact",
    items: [
      { name: "Location", href: "/contact/location", icon: MapPin },
      { name: "FAQ", href: "/contact/faq", icon: HelpCircle },
    ],
  },
  {
    name: "Settings",
    items: [
      { name: "Footer", href: "/settings/footer", icon: LayoutTemplate },
    ]
  }
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const navContent = (
    <div className="flex h-full w-full flex-col bg-white text-slate-700 font-inter">
      {/* Header with Logo and Close on Mobile */}
      <div className="p-5 sm:p-6 shrink-0 pt-6 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-[14px] flex items-center justify-center font-bold text-xl text-white shadow-[0_10px_30px_rgba(245,158,11,0.25)]">
            C
          </div>
          <div>
            <h1 className="font-montserrat font-bold text-xl sm:text-2xl tracking-tight text-[#0F172A]">
              Club Admin
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Control Portal</p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation drawer"
            className="lg:hidden p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex flex-1 flex-col overflow-y-auto pt-2 pb-6 px-3 sm:px-4">
        <nav className="flex-1 space-y-1">
          <Link
            href="/"
            onClick={handleLinkClick}
            className={`flex items-center justify-between px-3.5 py-3 rounded-[16px] text-sm sm:text-[15px] transition-all duration-200 min-h-[44px] ${
              pathname === "/"
                ? "bg-amber-50 text-amber-700 font-bold shadow-2xs border border-amber-200/50"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
            }`}
          >
            <div className="flex items-center gap-3">
              <Home className={`h-5 w-5 shrink-0 ${pathname === "/" ? "text-amber-600" : "text-slate-400"}`} />
              <span>Dashboard</span>
            </div>
            {pathname === "/" && <ChevronRight className="w-4 h-4 text-amber-500" />}
          </Link>

          {navigation.filter(item => item.items).map((section) => (
            <div key={section.name} className="space-y-1 pt-3">
              <h3 className="px-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                {section.name}
              </h3>
              {section.items?.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-[14px] text-sm sm:text-[15px] transition-all duration-200 min-h-[44px] ${
                      isActive
                        ? "bg-amber-50 text-amber-700 font-bold shadow-2xs border border-amber-200/50"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={`h-5 w-5 shrink-0 transition-transform ${
                          isActive ? "text-amber-600 scale-105" : "text-slate-400"
                        }`}
                        aria-hidden="true"
                      />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-amber-500" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer / Sign out */}
      <div className="p-4 shrink-0 bg-slate-50 border-t border-slate-200">
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            signOut(auth);
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-[16px] transition-all min-h-[44px]"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex h-full w-[260px] xl:w-[280px] shrink-0 flex-col border-r border-slate-200 relative z-20 shadow-sm">
        {navContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer Panel */}
        <div
          className={`absolute inset-y-0 left-0 max-w-[85%] w-[320px] bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {navContent}
        </div>
      </div>
    </>
  );
}
