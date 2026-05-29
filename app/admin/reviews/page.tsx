"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  // سحب التقييمات من الداتا بيز
  const fetchReviews = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    if (data) setReviews(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // 🌟 زرار الموافقة / الرفض (On / Off)
  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "approved" ? "pending" : "approved";
    
    // تحديث الواجهة فوراً (Optimistic UI) عشان السرعة
    setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));

    // التحديث في قاعدة البيانات
    const { error } = await supabase.from("reviews").update({ status: newStatus }).eq("id", id);
    if (error) {
      alert("حصل خطأ أثناء التحديث!");
      // نرجع الحالة القديمة لو حصل خطأ
      setReviews(reviews.map(r => r.id === id ? { ...r, status: currentStatus } : r));
    }
  };

  // 🌟 زرار المسح
  const deleteReview = async (id: string) => {
    const confirmDelete = window.confirm("هل أنت متأكد أنك عايز تمسح التقييم ده نهائياً؟");
    if (!confirmDelete) return;

    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (!error) {
      setReviews(reviews.filter(r => r.id !== id));
    } else {
      alert("حصل خطأ في المسح!");
    }
  };

  // 🌟 زرار الترجمة الآلية المباشر (Google Translate API المجاني)
  const translateReview = async (review: any) => {
    setTranslatingId(review.id);
    try {
      const text = review.review_text;

      // 1. ترجمة للإنجليزي
      const resEn = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`);
      const dataEn = await resEn.json();
      const textEn = dataEn[0].map((item: any) => item[0]).join("");

      // 2. ترجمة للإيطالي
      const resIt = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=it&dt=t&q=${encodeURIComponent(text)}`);
      const dataIt = await resIt.json();
      const textIt = dataIt[0].map((item: any) => item[0]).join("");

      // 3. تحديث قاعدة البيانات بالترجمة الجديدة
      const { error } = await supabase.from("reviews").update({
        review_text_en: textEn,
        review_text_it: textIt,
      }).eq("id", review.id);

      if (error) throw error;

      // 4. تحديث الواجهة عشان تظهر الترجمة فوراً
      setReviews(reviews.map(r => r.id === review.id ? { ...r, review_text_en: textEn, review_text_it: textIt } : r));
      alert("✅ تمت الترجمة بنجاح!");

    } catch (err: any) {
      console.error(err);
      alert("⚠️ خطأ في الترجمة! تأكد من اتصالك بالإنترنت.");
    } finally {
      setTranslatingId(null);
    }
  };

  // شاشة التحميل
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white" dir="rtl">
        <div className="relative flex justify-center items-center">
          <div className="absolute animate-ping w-20 h-20 rounded-full bg-purple-500 opacity-20"></div>
          <p className="text-xl animate-pulse font-bold text-purple-400 z-10">⏳ جاري تحميل التقييمات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 md:p-12 text-white font-sans relative overflow-hidden" dir="rtl">
      
      {/* تأثيرات إضاءة الخلفية */}
      <div className="absolute top-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* زرار الرجوع والعنوان */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-gray-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">⭐ إدارة التقييمات (Social Proof)</h1>
            <p className="text-gray-400 text-sm">راجع تقييمات العملاء، ترجمها، واعرضها على الموقع.</p>
          </div>
          <Link href="/admin/dashboard" className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-all font-bold text-sm flex items-center gap-2 border border-gray-700">
            <span>←</span> العودة للوحة التحكم
          </Link>
        </div>
        
        {/* كروت التقييمات */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <div key={review.id} className="bg-gray-800/80 backdrop-blur-md border border-gray-700 p-8 rounded-3xl relative hover:border-purple-500/50 transition-all shadow-xl flex flex-col">
              
              {/* حالة التقييم (Toggle Switch) */}
              <div className="absolute top-6 left-6 flex flex-col items-center gap-1">
                <button 
                  onClick={() => toggleStatus(review.id, review.status)}
                  className={`w-14 h-7 rounded-full flex items-center transition-all duration-300 px-1 ${review.status === "approved" ? "bg-emerald-500 justify-start" : "bg-gray-600 justify-end"}`}
                  title={review.status === "approved" ? "إخفاء التقييم" : "عرض التقييم"}
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform"></div>
                </button>
                <span className={`text-[10px] font-bold ${review.status === "approved" ? "text-emerald-400" : "text-gray-500"}`}>
                  {review.status === "approved" ? "يُعرض بالموقع" : "مخفي"}
                </span>
              </div>

              {/* بيانات صاحب التقييم */}
              <div className="mb-6 pr-14">
                <h3 className="text-2xl font-bold text-white mb-1">{review.name}</h3>
                <p className="text-sm text-gray-400 font-mono flex items-center gap-1">📍 {review.location}</p>
              </div>
              
              {/* النجوم */}
              <div className="flex text-amber-500 mb-6 text-xl">
                {Array.from({ length: review.rating }).map((_, i) => <span key={i}>★</span>)}
              </div>

              {/* نص التقييم */}
              <div className="bg-[#0a0f16] p-4 rounded-xl border border-gray-800 mb-6 flex-1">
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  <span className="text-gray-500 block text-xs mb-1">AR (الأساسي):</span>
                  "{review.review_text}"
                </p>
                
                {/* إظهار الترجمات لو موجودة */}
                {(review.review_text_en || review.review_text_it) && (
                  <div className="border-t border-gray-800 pt-4 space-y-3">
                    {review.review_text_it && (
                      <p className="text-gray-400 text-xs italic">
                        <span className="text-purple-400 not-italic block mb-1">IT:</span> "{review.review_text_it}"
                      </p>
                    )}
                    {review.review_text_en && (
                      <p className="text-gray-400 text-xs italic">
                        <span className="text-blue-400 not-italic block mb-1">EN:</span> "{review.review_text_en}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* أزرار التحكم (ترجمة / مسح) */}
              <div className="flex gap-3 mt-auto">
                <button 
                  onClick={() => translateReview(review)} 
                  disabled={translatingId === review.id}
                  className="flex-1 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 text-purple-400 py-3 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {translatingId === review.id ? (
                    <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></span>
                  ) : "🌐 ترجمة آلية"}
                </button>
                <button 
                  onClick={() => deleteReview(review.id)} 
                  className="w-12 h-12 shrink-0 bg-red-600/10 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all"
                  title="مسح التقييم"
                >
                  🗑️
                </button>
              </div>

            </div>
          ))}
        </div>
        
        {/* رسالة في حالة عدم وجود تقييمات */}
        {reviews.length === 0 && !isLoading && (
          <div className="text-center bg-gray-800/50 border border-gray-700 rounded-3xl p-16 mt-8">
            <span className="text-6xl block mb-4 opacity-50">📭</span>
            <h3 className="text-2xl font-bold text-gray-300 mb-2">لا توجد تقييمات حتى الآن</h3>
            <p className="text-gray-500">بمجرد إضافة العملاء لتقييماتهم من الموقع، ستظهر هنا لمراجعتها.</p>
          </div>
        )}
      </div>
    </div>
  );
}