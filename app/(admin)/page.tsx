"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Users,
  LayoutTemplate,
  Bell,
  Image as ImageIcon,
  Award,
  Calendar,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  HardDrive
} from "lucide-react";

export default function DashboardPage() {
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [blogCount, setBlogCount] = useState<number | null>(null);
  const [noticeCount, setNoticeCount] = useState<number | null>(null);
  const [galleryCount, setGalleryCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const leadersSnap = await getCountFromServer(collection(db, "leadership_members"));
        setMemberCount(leadersSnap.data().count);

        const blogsSnap = await getCountFromServer(collection(db, "blogs"));
        setBlogCount(blogsSnap.data().count);

        const noticesSnap = await getCountFromServer(collection(db, "notices"));
        setNoticeCount(noticesSnap.data().count);

        try {
          const gallerySnap = await getCountFromServer(collection(db, "gallery_albums"));
          setGalleryCount(gallerySnap.data().count);
        } catch {
          setGalleryCount(null);
        }
      } catch (err: any) {
        console.error("Error fetching stats:", err);
        setError(err.message || "Failed to load database stats. Check permissions.");
      }
    }
    fetchCounts();
  }, []);

  const quickActions = [
    {
      title: "Add Member / Leader",
      href: "/about/leadership",
      icon: Users,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      desc: "Manage executive committee & alumni"
    },
    {
      title: "Create Blog Post",
      href: "/content/blog",
      icon: LayoutTemplate,
      color: "bg-purple-50 text-purple-600 border-purple-100",
      desc: "Publish articles with rich media"
    },
    {
      title: "Upload Gallery Photos",
      href: "/content/gallery",
      icon: ImageIcon,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      desc: "Cloudinary bulk uploads & albums"
    },
    {
      title: "Issue Notice",
      href: "/event/notice",
      icon: Bell,
      color: "bg-amber-50 text-amber-600 border-amber-100",
      desc: "Post urgent club bulletins"
    },
  ];

  return (
    <div className="space-y-6 flex flex-col font-inter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-2xl sm:text-3xl font-montserrat font-bold text-[#0F172A] tracking-tight">
            Operational Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time management dashboard and quick controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full shadow-2xs">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            <span>Firestore Active</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs sm:text-sm shadow-2xs" role="alert">
          <strong className="font-bold">Database Error: </strong>
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 shrink-0">
        {/* Total Members */}
        <Link
          href="/about/leadership"
          className="bg-white/70 backdrop-blur-[20px] p-4 sm:p-5 rounded-2xl sm:rounded-[24px] border border-white/50 shadow-2xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Members</p>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#0F172A]">
            {memberCount === null ? "..." : memberCount}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">In Leadership</p>
        </Link>

        {/* Total Blogs */}
        <Link
          href="/content/blog"
          className="bg-white/70 backdrop-blur-[20px] p-4 sm:p-5 rounded-2xl sm:rounded-[24px] border border-white/50 shadow-2xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Posts</p>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <LayoutTemplate className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#0F172A]">
            {blogCount === null ? "..." : blogCount}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">Published Blogs</p>
        </Link>

        {/* Total Notices */}
        <Link
          href="/event/notice"
          className="bg-white/70 backdrop-blur-[20px] p-4 sm:p-5 rounded-2xl sm:rounded-[24px] border border-white/50 shadow-2xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notices</p>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bell className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#0F172A]">
            {noticeCount === null ? "..." : noticeCount}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">Active Notices</p>
        </Link>

        {/* Cloud Storage */}
        <div className="bg-[#0F172A] p-4 sm:p-5 rounded-2xl sm:rounded-[24px] border border-white/10 shadow-md text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cloud Storage</p>
            <div className="w-7 h-7 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center">
              <HardDrive className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white">Cloudinary</h3>
          <p className="text-[11px] text-slate-400 mt-1 font-medium truncate">Direct CDN Storage</p>
        </div>
      </div>

      {/* Quick Access Grid for Mobile & Desktop */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 font-montserrat flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Quick Actions & Mobile Shortcuts
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              href={action.href}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/80 hover:bg-white border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all group min-h-[56px]"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${action.color} group-hover:scale-105 transition-transform`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{action.desc}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
