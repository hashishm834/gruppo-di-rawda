"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";

interface Service {
  id: string;
  title: string;
  title_en?: string;
  title_it?: string;
  description: string;
  description_en?: string;
  description_it?: string;
  image_url?: string; 
  image_urls: string[]; 
  is_active: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]); 
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [activeImageIndex, setActiveImageIndex] = useState<{ [key: string]: number }>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    is_active: true,
    image_urls: [] as string[],
  });

  async function fetchServices() {
    try {
      const { data, error } = await supabase
        .schema("public")
        .from("services")
        .select("*")
        .order("created_at", { ascending: false }); // خليناها تنازلي عشان الجديد يظهر الأول

      if (!error && data) {
        setServices(data);
        const initialIndexes: any = {};
        data.forEach(s => { initialIndexes[s.id] = 0; });
        setActiveImageIndex(initialIndexes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      loading && setLoading(false);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmDelete = window.confirm("هل أنت متأكد من حذف هذه الخدمة نهائياً؟");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.schema("public").from("services").delete().eq("id", id);
      if (error) throw error;
      fetchServices();
    } catch (err: any) {
      alert("فشل الحذف: " + err.message);
    }
  };

  const openNewServiceModal = () => {
    setEditingId(null);
    setFormData({ title: "", description: "", is_active: true, image_urls: [] });
    setMediaFiles([]);
    setIsModalOpen(true);
  };

  const openEditServiceModal = (service: Service) => {
    setEditingId(service.id);
    const validImageUrls = service.image_urls && service.image_urls.length > 0 
      ? service.image_urls 
      : (service.image_url ? [service.image_url] : []);

    setFormData({
      title: service.title,
      description: service.description || "",
      is_active: service.is_active,
      image_urls: validImageUrls,
    });
    setMediaFiles([]);
    setIsModalOpen(true);
  };

  const handleRemoveExistingImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // 💡 دالة المترجم الآلي السحري
  const translateText = async (text: string, targetLang: string) => {
    if (!text) return "";
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      return data[0].map((item: any) => item[0]).join('');
    } catch (err) {
      console.error("Translation error:", err);
      return text; 
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalUrls = [...(formData.image_urls || [])];

      // 1. معالجة ورفع الصور
      if (mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true };
          const compressedFile = await imageCompression(file, options);
          
          const fileExt = file.name.split('.').pop();
          const fileName = `service-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('project-media')
            .upload(fileName, compressedFile);

          if (uploadError) throw new Error("فشل رفع الصورة: " + uploadError.message);

          const { data } = supabase.storage.from('project-media').getPublicUrl(fileName);
          finalUrls.push(data.publicUrl);
        }
      }

      // 2. الترجمة الآلية
      const title_en = await translateText(formData.title, "en");
      const title_it = await translateText(formData.title, "it");
      const description_en = await translateText(formData.description, "en");
      const description_it = await translateText(formData.description, "it");

      // 3. تجهيز الداتا للحفظ
      const serviceData = {
        title: formData.title,
        title_en: title_en,
        title_it: title_it,
        description: formData.description,
        description_en: description_en,
        description_it: description_it,
        image_urls: finalUrls,
        is_active: formData.is_active
      };

      if (editingId) {
        const { error } = await supabase.schema("public").from("services").update(serviceData).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.schema("public").from("services").insert([serviceData]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchServices();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "حصل خطأ أثناء حفظ الخدمة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextImage = (e: React.MouseEvent, id: string, maxLen: number) => {
    e.stopPropagation();
    setActiveImageIndex(prev => ({ ...prev, [id]: (prev[id] + 1) % maxLen }));
  };

  const prevImage = (e: React.MouseEvent, id: string, maxLen: number) => {
    e.stopPropagation();
    setActiveImageIndex(prev => ({ ...prev, [id]: (prev[id] - 1 + maxLen) % maxLen }));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-xl animate-pulse">جاري تحميل الخدمات...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white relative" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
              إدارة الخدمات (مربوطة بالمترجم الآلي 🤖)
            </h1>
            <p className="text-gray-400 mt-1">أضف، عدل، واحذف الخدمات التي تقدمها شركتك</p>
          </div>
          <button 
            onClick={openNewServiceModal}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-lg hover:shadow-blue-500/25"
          >
            + إضافة خدمة جديدة
          </button>
        </div>

        {!services || services.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-400">
            لا توجد أي خدمات مضافة.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const allImages = service.image_urls && service.image_urls.length > 0 
                ? service.image_urls 
                : (service.image_url ? [service.image_url] : []);
              
              const currentImgIdx = activeImageIndex[service.id] || 0;

              return (
                <div 
                  key={service.id} 
                  onClick={() => openEditServiceModal(service)}
                  className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg hover:border-blue-500/50 hover:shadow-blue-500/10 transition-all flex flex-col cursor-pointer group"
                >
                  <div className="h-56 bg-gray-700 w-full relative overflow-hidden group/gallery">
                    {allImages.length > 0 ? (
                      <>
                        <img 
                          src={allImages[currentImgIdx]} 
                          alt={service.title} 
                          className="w-full h-full object-cover transition-all duration-700 ease-in-out group-hover/gallery:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 via-transparent to-transparent opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-500" />
                        
                        {allImages.length > 1 && (
                          <>
                            <button onClick={(e) => prevImage(e, service.id, allImages.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover/gallery:opacity-100 hover:bg-black/80 transition-all">❯</button>
                            <button onClick={(e) => nextImage(e, service.id, allImages.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover/gallery:opacity-100 hover:bg-black/80 transition-all">❮</button>
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                              {allImages.map((_, idx) => (
                                <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === currentImgIdx ? 'w-4 bg-blue-500' : 'w-1.5 bg-white/50'}`} />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="flex h-full items-center justify-center text-5xl transform group-hover:scale-110 transition-transform duration-300">🛠️</span>
                    )}

                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-gray-700">
                      <div className={`w-2 h-2 rounded-full ${service.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-[10px] font-medium text-gray-300">
                        {service.is_active ? "متاحة" : "متوقفة"}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-blue-100 mb-1">
                      {service.title} 🇪🇬
                    </h3>
                    <p className="text-xs text-gray-400 mb-1">{service.title_en} 🇬🇧</p>
                    <p className="text-xs text-gray-400 mb-3">{service.title_it} 🇮🇹</p>
                    
                    <p className="text-gray-400 text-sm mb-5 flex-1 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                    
                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-700/50">
                      <span className="text-xs text-blue-400 group-hover:translate-x-[-4px] transition-transform flex items-center gap-1">
                        ✏️ تعديل
                      </span>
                      <span 
                        onClick={(e) => handleDelete(e, service.id)}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors bg-red-500/5 hover:bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/10"
                      >
                        🗑️ حذف
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-bold text-blue-400 mb-6">
              {editingId ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
            </h2>
            <p className="text-sm text-amber-400 mb-4">💡 سيتم ترجمة البيانات تلقائياً للإنجليزية والإيطالية عند الحفظ.</p>
            
            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1 text-sm font-medium">اسم الخدمة (بالعربي)</label>
                <input 
                  required type="text" value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1 text-sm font-medium">الوصف (بالعربي)</label>
                <textarea 
                  required rows={4} value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1 text-sm font-medium">إرفاق صور (يتم الضغط تلقائياً)</label>
                <input 
                  type="file" multiple accept="image/*"
                  onChange={(e) => setMediaFiles(e.target.files ? Array.from(e.target.files) : [])}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-400 cursor-pointer"
                />
                
                {editingId && formData.image_urls.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">الصور المرفوعة مسبقاً (اضغط على ❌ للحذف):</p>
                    <div className="flex flex-wrap gap-3">
                      {formData.image_urls.map((url, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-600 group/img">
                          <img src={url} className="w-full h-full object-cover opacity-80 group-hover/img:opacity-50 transition-opacity" alt="مصغر" />
                          <button 
                            type="button"
                            onClick={() => handleRemoveExistingImage(idx)}
                            className="absolute inset-0 m-auto w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg"
                            title="حذف هذه الصورة"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 bg-gray-900 p-3 rounded-lg border border-gray-700">
                <input 
                  type="checkbox" id="isActive"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-5 h-5 accent-blue-500 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-gray-300 text-sm font-medium cursor-pointer">
                  الخدمة متاحة للعملاء حالياً
                </label>
              </div>

              <div className="flex gap-3 mt-8 pt-4">
                <button 
                  type="submit" disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> جاري الرفع والترجمة...</>
                  ) : "حفظ التعديلات"}
                </button>
                <button 
                  type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}