"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    leads: 0,
    projects: 0,
    services: 0,
    reviews: 0, // 🌟 ضفنا التقييمات للعداد
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // بنجيب عدد العملاء (الطلبات)
        const { count: leadsCount } = await supabase.from("leads").select("*", { count: "exact", head: true });
        
        // بنجيب عدد المشاريع
        const { count: projectsCount } = await supabase.from("projects").select("*", { count: "exact", head: true });
        
        // بنجيب عدد الخدمات
        const { count: servicesCount } = await supabase.from("services").select("*", { count: "exact", head: true });

        // 🌟 بنجيب عدد التقييمات
        const { count: reviewsCount } = await supabase.from("reviews").select("*", { count: "exact", head: true });

        setStats({
          leads: leadsCount || 0,
          projects: projectsCount || 0,
          services: servicesCount || 0,
          reviews: reviewsCount || 0, // 🌟 تحديث العداد
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  // شاشة التحميل مع أنيميشن احترافي
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="relative flex justify-center items-center">
          <div className="absolute animate-ping w-20 h-20 rounded-full bg-emerald-500 opacity-20"></div>
          <p className="text-xl animate-pulse font-bold text-emerald-400 z-10 flex items-center gap-2">
            <span>⏳</span> جاري تحميل إحصائيات النظام...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white relative overflow-hidden" dir="rtl">
      
      {/* خلفية جمالية (إضاءات مخفية في الزوايا) */}
      <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* الترحيب والاسم الفخم */}
        <div className="mb-12 border-b border-gray-800 pb-6 animate-fade-in-down">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent leading-snug">
            مرحباً بك في لوحة تحكم <br />
            <span className="text-2xl md:text-3xl text-amber-400 mt-2 block font-mono drop-shadow-md">
              GRUPPO DI RAWDA DI NASEFRABIE ABDRABOU AHMED
            </span>
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            نظرة عامة على نشاط الشركة وإحصائيات النظام
          </p>
        </div>

        {/* 🌟 كروت الإحصائيات (الأرقام) تم تعديل الـ Grid ليصبح 4 أعمدة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          
          {/* كارت العملاء */}
          <div className="group bg-gray-800/80 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] hover:border-orange-500/50 transition-all duration-500 transform hover:-translate-y-2 flex items-center justify-between cursor-default relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-medium mb-1 group-hover:text-orange-300 transition-colors">طلبات العملاء (الجديدة والسابقة)</p>
              <h3 className="text-5xl font-bold text-white group-hover:scale-110 origin-right transition-transform duration-300 drop-shadow-lg">{stats.leads}</h3>
            </div>
            <div className="relative z-10 w-16 h-16 bg-orange-500/10 text-orange-400 rounded-2xl flex items-center justify-center text-4xl group-hover:bg-orange-500/20 group-hover:rotate-12 transition-all duration-300 shadow-inner">
              👥
            </div>
          </div>

          {/* كارت المشاريع */}
          <div className="group bg-gray-800/80 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:border-emerald-500/50 transition-all duration-500 transform hover:-translate-y-2 flex items-center justify-between cursor-default relative overflow-hidden" style={{ animationDelay: '100ms' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-medium mb-1 group-hover:text-emerald-300 transition-colors">المشاريع في سجل الأعمال</p>
              <h3 className="text-5xl font-bold text-white group-hover:scale-110 origin-right transition-transform duration-300 drop-shadow-lg">{stats.projects}</h3>
            </div>
            <div className="relative z-10 w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center text-4xl group-hover:bg-emerald-500/20 group-hover:-rotate-12 transition-all duration-300 shadow-inner">
              🏗️
            </div>
          </div>

          {/* كارت الخدمات */}
          <div className="group bg-gray-800/80 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:border-blue-500/50 transition-all duration-500 transform hover:-translate-y-2 flex items-center justify-between cursor-default relative overflow-hidden" style={{ animationDelay: '200ms' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-medium mb-1 group-hover:text-blue-300 transition-colors">الخدمات المتاحة بالموقع</p>
              <h3 className="text-5xl font-bold text-white group-hover:scale-110 origin-right transition-transform duration-300 drop-shadow-lg">{stats.services}</h3>
            </div>
            <div className="relative z-10 w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center text-4xl group-hover:bg-blue-500/20 group-hover:rotate-12 transition-all duration-300 shadow-inner">
              🛠️
            </div>
          </div>

          {/* 🌟 كارت التقييمات الجديد */}
          <div className="group bg-gray-800/80 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:border-purple-500/50 transition-all duration-500 transform hover:-translate-y-2 flex items-center justify-between cursor-default relative overflow-hidden" style={{ animationDelay: '300ms' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-medium mb-1 group-hover:text-purple-300 transition-colors">آراء العملاء والتقييمات</p>
              <h3 className="text-5xl font-bold text-white group-hover:scale-110 origin-right transition-transform duration-300 drop-shadow-lg">{stats.reviews}</h3>
            </div>
            <div className="relative z-10 w-16 h-16 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center text-4xl group-hover:bg-purple-500/20 group-hover:-rotate-12 transition-all duration-300 shadow-inner">
              ⭐
            </div>
          </div>

        </div>

        {/* روابط الانتقال السريع */}
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-4">
          <span className="text-emerald-400">⚡</span> الوصول السريع
          <span className="h-px bg-gradient-to-l from-gray-700 to-transparent flex-1"></span>
        </h2>
        
        {/* 🌟 تم تعديل الـ Grid ليحتوي على 5 عناصر */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          
          <Link href="/admin/leads" className="group relative bg-gray-800/50 border border-gray-700 overflow-hidden rounded-2xl hover:bg-gray-800 transition-all duration-300 flex flex-col items-center text-center p-8 hover:border-orange-500/50 hover:shadow-[0_10px_30px_rgba(249,115,22,0.15)] hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="text-5xl mb-4 transform group-hover:-translate-y-3 group-hover:scale-110 transition-all duration-300 drop-shadow-lg">📩</span>
            <span className="font-bold text-lg text-gray-300 group-hover:text-orange-400 transition-colors relative z-10">صندوق الطلبات</span>
          </Link>

          <Link href="/admin/projects" className="group relative bg-gray-800/50 border border-gray-700 overflow-hidden rounded-2xl hover:bg-gray-800 transition-all duration-300 flex flex-col items-center text-center p-8 hover:border-emerald-500/50 hover:shadow-[0_10px_30px_rgba(16,185,129,0.15)] hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="text-5xl mb-4 transform group-hover:-translate-y-3 group-hover:scale-110 transition-all duration-300 drop-shadow-lg">📸</span>
            <span className="font-bold text-lg text-gray-300 group-hover:text-emerald-400 transition-colors relative z-10">إدارة المشاريع</span>
          </Link>

          <Link href="/admin/services" className="group relative bg-gray-800/50 border border-gray-700 overflow-hidden rounded-2xl hover:bg-gray-800 transition-all duration-300 flex flex-col items-center text-center p-8 hover:border-blue-500/50 hover:shadow-[0_10px_30px_rgba(59,130,246,0.15)] hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="text-5xl mb-4 transform group-hover:-translate-y-3 group-hover:scale-110 transition-all duration-300 drop-shadow-lg">⚙️</span>
            <span className="font-bold text-lg text-gray-300 group-hover:text-blue-400 transition-colors relative z-10">إدارة الخدمات</span>
          </Link>

          {/* 🌟 الزر الجديد الخاص بإدارة التقييمات */}
          <Link href="/admin/reviews" className="group relative bg-gray-800/50 border border-gray-700 overflow-hidden rounded-2xl hover:bg-gray-800 transition-all duration-300 flex flex-col items-center text-center p-8 hover:border-purple-500/50 hover:shadow-[0_10px_30px_rgba(168,85,247,0.15)] hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="text-5xl mb-4 transform group-hover:-translate-y-3 group-hover:scale-110 transition-all duration-300 drop-shadow-lg">⭐</span>
            <span className="font-bold text-lg text-gray-300 group-hover:text-purple-400 transition-colors relative z-10">إدارة التقييمات</span>
          </Link>

          <Link href="/admin/settings" className="group relative bg-gray-800/50 border border-gray-700 overflow-hidden rounded-2xl hover:bg-gray-800 transition-all duration-300 flex flex-col items-center text-center p-8 hover:border-amber-500/50 hover:shadow-[0_10px_30px_rgba(251,191,36,0.15)] hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="text-5xl mb-4 transform group-hover:-translate-y-3 group-hover:scale-110 transition-all duration-300 drop-shadow-lg">🔧</span>
            <span className="font-bold text-lg text-gray-300 group-hover:text-amber-400 transition-colors relative z-10">إعدادات الموقع</span>
          </Link>

        </div>
      </div>
    </div>
  );
}