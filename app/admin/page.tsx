"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [formData, setFormData] = useState({
    id: "",
    company_name: "",
    phone_number: "",
    email: "",
    address: "",
    facebook_url: "",
    instagram_url: "",
    about_text: "",
  });

  // جلب البيانات أول ما الصفحة تفتح
  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .schema("public")
          .from("site_settings")
          .select("*")
          .limit(1)
          .single(); // بنجيب صف واحد بس

        if (error) throw error;
        if (data) {
          setFormData(data);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  // حفظ التعديلات
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");

    try {
      const { error } = await supabase
        .schema("public")
        .from("site_settings")
        .update({
          company_name: formData.company_name,
          phone_number: formData.phone_number,
          email: formData.email,
          address: formData.address,
          facebook_url: formData.facebook_url,
          instagram_url: formData.instagram_url,
          about_text: formData.about_text,
          updated_at: new Date().toISOString(),
        })
        .eq("id", formData.id);

      if (error) throw error;
      
      setSaveMessage("تم حفظ الإعدادات بنجاح! ✅");
      setTimeout(() => setSaveMessage(""), 3000); // الرسالة تختفي بعد 3 ثواني
    } catch (err: any) {
      console.error(err);
      alert("حصل خطأ أثناء الحفظ: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-xl animate-pulse">جاري تحميل الإعدادات...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            إعدادات الموقع (Settings)
          </h1>
          <p className="text-gray-400 mt-1">
            عدل بيانات الاتصال وروابط السوشيال ميديا لتظهر للعملاء في الموقع الرئيسي.
          </p>
        </div>

        <form onSubmit={handleSave} className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* اسم الشركة */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-gray-300 mb-2 text-sm font-medium">اسم الشركة / البراند</label>
              <input 
                type="text" 
                value={formData.company_name || ""}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* رقم التليفون */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-medium">رقم الهاتف (WhatsApp)</label>
              <input 
                type="text" 
                dir="ltr"
                value={formData.phone_number || ""}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors text-right md:text-left"
              />
            </div>

            {/* البريد الإلكتروني */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-medium">البريد الإلكتروني</label>
              <input 
                type="email" 
                dir="ltr"
                value={formData.email || ""}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors text-right md:text-left"
              />
            </div>

            {/* العنوان */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-gray-300 mb-2 text-sm font-medium">العنوان ومقر الشركة</label>
              <input 
                type="text" 
                value={formData.address || ""}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* فيسبوك */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-medium">رابط صفحة الفيسبوك</label>
              <input 
                type="url" 
                dir="ltr"
                value={formData.facebook_url || ""}
                onChange={(e) => setFormData({...formData, facebook_url: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors text-right md:text-left"
                placeholder="https://facebook.com/..."
              />
            </div>

            {/* انستجرام */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-medium">رابط حساب انستجرام</label>
              <input 
                type="url" 
                dir="ltr"
                value={formData.instagram_url || ""}
                onChange={(e) => setFormData({...formData, instagram_url: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors text-right md:text-left"
                placeholder="https://instagram.com/..."
              />
            </div>

            {/* نبذة عن الشركة */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-gray-300 mb-2 text-sm font-medium">نبذة عن الشركة (About Us)</label>
              <textarea 
                rows={4}
                value={formData.about_text || ""}
                onChange={(e) => setFormData({...formData, about_text: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-gray-700 pt-6">
            <div className="text-emerald-400 font-medium">
              {saveMessage && <span className="animate-pulse">{saveMessage}</span>}
            </div>
            
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white px-10 py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
            >
              {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}