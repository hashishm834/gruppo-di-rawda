"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Lead {
  id: string;
  name: string;
  phone: string;
  service_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🌟 حالة النافذة المنبثقة (الطلب النشط)
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  async function fetchLeads() {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeads();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await supabase.from("leads").update({ is_read: true }).eq("id", id);
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟")) return;
    try {
      await supabase.from("leads").delete().eq("id", id);
      fetchLeads();
      if (activeLead?.id === id) closeModal(); // لو حذفه من جوه النافذة، اقفلها
    } catch (err) {
      alert("فشل الحذف");
    }
  };

  // 🌟 دوال فتح وقفل النافذة المنبثقة
  const openModal = (lead: Lead) => {
    setActiveLead(lead);
    document.body.style.overflow = "hidden"; // منع السكرول للصفحة
    
    // حركة بروفيشنال: لو الطلب مش مقروء، خليه مقروء أوتوماتيك أول ما يفتحه
    if (!lead.is_read) {
      markAsRead(lead.id);
    }
  };

  const closeModal = () => {
    setActiveLead(null);
    document.body.style.overflow = "auto";
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-xl animate-pulse">جاري تحميل رسائل العملاء...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            صندوق طلبات العملاء (Leads)
          </h1>
          <p className="text-gray-400 mt-1">
            هنا تظهر جميع الطلبات والرسائل المرسلة من الموقع الرئيسي
          </p>
        </div>

        {!leads || leads.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-400">
            لا توجد أي رسائل أو طلبات جديدة حتى الآن.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {leads.map((lead) => (
              <div 
                key={lead.id} 
                onClick={() => openModal(lead)}
                className={`border rounded-2xl p-6 relative cursor-pointer hover:scale-[1.02] transition-all duration-300 ${
                  lead.is_read 
                    ? "bg-gray-800/50 border-gray-700 hover:border-gray-500" 
                    : "bg-gray-800 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:border-orange-400"
                }`}
              >
                {!lead.is_read && (
                  <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md animate-pulse">
                    جديد
                  </span>
                )}

                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white line-clamp-1">{lead.name}</h3>
                    <p className="text-emerald-400 font-mono text-sm mt-1" dir="ltr">{lead.phone}</p>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-xl p-4 mb-4 border border-gray-700">
                  <div className="text-xs text-orange-400 mb-2 font-bold flex items-center gap-1">
                    <span>الخدمة المطلوبة:</span>
                    <span className="text-gray-300">{lead.service_type || "غير محدد"}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                    {lead.message || "لا توجد تفاصيل إضافية."}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700/50">
                  <span className="text-xs text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                  </span>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                      className="text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🌟 النافذة المنبثقة (Modal) لعرض تفاصيل الطلب بالكامل */}
      {activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* الهيدر بتاع النافذة */}
            <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-800/50">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>📄 تفاصيل الطلب</span>
              </h2>
              <button 
                onClick={closeModal} 
                className="text-gray-400 hover:text-white hover:bg-red-500/20 w-10 h-10 rounded-full flex items-center justify-center transition-colors text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* محتوى الرسالة */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-800">
                  <span className="text-gray-500 text-xs block mb-1">اسم العميل</span>
                  <span className="text-lg font-bold text-white">{activeLead.name}</span>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-800">
                  <span className="text-gray-500 text-xs block mb-1">رقم الهاتف</span>
                  <a href={`tel:${activeLead.phone}`} dir="ltr" className="text-lg font-mono font-bold text-emerald-400 hover:text-emerald-300 block">
                    {activeLead.phone}
                  </a>
                </div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-800 mb-8">
                <span className="text-gray-500 text-xs block mb-1">الخدمة المطلوبة</span>
                <span className="text-lg font-bold text-orange-400">{activeLead.service_type || "غير محدد"}</span>
              </div>

              <div>
                <span className="text-gray-500 text-sm block mb-3 font-bold">نص الرسالة / تفاصيل المشروع:</span>
                <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">
                  {activeLead.message || "لا توجد تفاصيل إضافية."}
                </div>
              </div>
            </div>

            {/* الفوتر بتاع النافذة (أزرار التحكم) */}
            <div className="p-6 border-t border-gray-800 bg-gray-800/50 flex flex-wrap justify-between items-center gap-4">
              <span className="text-sm text-gray-500 font-mono" dir="ltr">
                {new Date(activeLead.created_at).toLocaleString('en-US')}
              </span>
              <div className="flex gap-3">
                <a 
                  href={`https://wa.me/${activeLead.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold transition-colors flex items-center gap-2"
                >
                  💬 واتساب
                </a>
                <button 
                  onClick={() => handleDelete(activeLead.id)}
                  className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-6 py-2 rounded-xl font-bold transition-all"
                >
                  حذف الطلب
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}