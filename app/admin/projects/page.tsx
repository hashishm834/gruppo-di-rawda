"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";

interface Project {
  id: string;
  title: string;
  title_en?: string;
  title_it?: string;
  description: string;
  description_en?: string;
  description_it?: string;
  image_url?: string; 
  image_urls: string[]; 
  status: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [activeImageIndex, setActiveImageIndex] = useState<{ [key: string]: number }>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "مكتمل",
    image_urls: [] as string[],
  });

  async function fetchProjects() {
    try {
      const { data, error } = await supabase
        .schema("public")
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProjects(data);
        const initialIndexes: any = {};
        data.forEach(p => { initialIndexes[p.id] = 0; });
        setActiveImageIndex(initialIndexes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      loading && setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    const confirmDelete = window.confirm("هل أنت متأكد من حذف هذا المشروع نهائياً؟");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.schema("public").from("projects").delete().eq("id", id);
      if (error) throw error;
      fetchProjects(); 
    } catch (err: any) {
      alert("فشل الحذف: " + err.message);
    }
  };

  const openNewProjectModal = () => {
    setEditingId(null);
    setFormData({ title: "", description: "", status: "مكتمل", image_urls: [] });
    setMediaFiles([]);
    setIsModalOpen(true);
  };

  const openEditProjectModal = (project: Project) => {
    setEditingId(project.id);
    const validImageUrls = project.image_urls && project.image_urls.length > 0 
      ? project.image_urls 
      : (project.image_url ? [project.image_url] : []);
      
    setFormData({
      title: project.title,
      description: project.description || "",
      status: project.status || "مكتمل",
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

  // 💡 المترجم الآلي
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

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalUrls = [...(formData.image_urls || [])];

      // 1. معالجة ورفع الصور
      if (mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true };
          const compressedFile = await imageCompression(file, options);
          
          const fileExt = file.name.split('.').pop();
          const fileName = `project-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
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

      // 3. تجميع الداتا للحفظ
      const projectData = {
        title: formData.title,
        title_en: title_en,
        title_it: title_it,
        description: formData.description,
        description_en: description_en,
        description_it: description_it,
        image_urls: finalUrls,
        status: formData.status
      };

      if (editingId) {
        const { error } = await supabase.schema("public").from("projects").update(projectData).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.schema("public").from("projects").insert([projectData]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchProjects();

    } catch (err: any) {
      console.error(err);
      alert(err.message || "حصل خطأ أثناء حفظ المشروع.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextImage = (e: React.MouseEvent, projectId: string, maxLen: number) => {
    e.stopPropagation();
    setActiveImageIndex(prev => ({
      ...prev,
      [projectId]: (prev[projectId] + 1) % maxLen
    }));
  };

  const prevImage = (e: React.MouseEvent, projectId: string, maxLen: number) => {
    e.stopPropagation();
    setActiveImageIndex(prev => ({
      ...prev,
      [projectId]: (prev[projectId] - 1 + maxLen) % maxLen
    }));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-xl animate-pulse text-emerald-400">جاري تحميل المشاريع...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white relative" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              إدارة المشاريع (مربوطة بالمترجم 🤖)
            </h1>
            <p className="text-gray-400 mt-1">أضف، عدل، واحذف مشاريع المقاولات والتشطيبات الخاصة بك</p>
          </div>
          <button 
            onClick={openNewProjectModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-lg hover:shadow-emerald-500/25"
          >
            + إضافة مشروع جديد
          </button>
        </div>

        {!projects || projects.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-400">
            لا توجد أي مشاريع مضافة.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const allImages = project.image_urls && project.image_urls.length > 0 
                ? project.image_urls 
                : (project.image_url ? [project.image_url] : []);
              
              const currentImgIdx = activeImageIndex[project.id] || 0;

              return (
                <div 
                  key={project.id} 
                  onClick={() => openEditProjectModal(project)}
                  className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl hover:border-emerald-500/50 hover:shadow-emerald-500/10 transition-all flex flex-col cursor-pointer group relative"
                >
                  <div className="h-56 bg-gray-700 w-full relative overflow-hidden group/gallery">
                    {allImages.length > 0 ? (
                      <>
                        <img 
                          src={allImages[currentImgIdx]} 
                          alt={project.title} 
                          className="w-full h-full object-cover transition-all duration-700 ease-in-out group-hover/gallery:scale-110" 
                        />
                        
                        {allImages.length > 1 && (
                          <>
                            <button onClick={(e) => prevImage(e, project.id, allImages.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover/gallery:opacity-100 hover:bg-black/80 transition-all">❯</button>
                            <button onClick={(e) => nextImage(e, project.id, allImages.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover/gallery:opacity-100 hover:bg-black/80 transition-all">❮</button>
                            
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                              {allImages.map((_, idx) => (
                                <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === currentImgIdx ? 'w-4 bg-emerald-500' : 'w-1.5 bg-white/50'}`} />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="flex h-full items-center justify-center text-gray-500">بدون ميديا</span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-emerald-100 mb-1">{project.title} 🇪🇬</h3>
                    <p className="text-xs text-gray-400 mb-1">{project.title_en} 🇬🇧</p>
                    <p className="text-xs text-gray-400 mb-3">{project.title_it} 🇮🇹</p>

                    <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-2 leading-relaxed">{project.description}</p>
                    
                    <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-700/50">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {project.status}
                      </span>
                      
                      <div className="flex gap-3">
                        <span className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors">✏️ تعديل</span>
                        <span 
                          onClick={(e) => handleDelete(e, project.id)}
                          className="text-sm text-red-500 hover:text-red-400 transition-colors"
                        >
                          🗑️ حذف
                        </span>
                      </div>
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
            <h2 className="text-2xl font-bold text-emerald-400 mb-6">
              {editingId ? "تعديل بيانات المشروع" : "إضافة مشروع جديد"}
            </h2>
            <p className="text-sm text-amber-400 mb-4">💡 سيتم ترجمة البيانات تلقائياً للإنجليزية والإيطالية عند الحفظ.</p>
            
            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1 text-sm font-medium">اسم المشروع (بالعربي)</label>
                <input 
                  required type="text" value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1 text-sm font-medium">الوصف والتفاصيل (بالعربي)</label>
                <textarea 
                  required rows={4} value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1 text-sm font-medium">
                  إرفاق صور جديدة (يمكن تحديد أكثر من صورة للضغط)
                </label>
                <input 
                  type="file" multiple accept="image/*"
                  onChange={(e) => setMediaFiles(e.target.files ? Array.from(e.target.files) : [])}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-400 cursor-pointer"
                />
                
                {/* عرض الصور القديمة وإمكانية حذفها */}
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

              <div>
                <label className="block text-gray-300 mb-1 text-sm font-medium">حالة المشروع</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="مكتمل">مكتمل</option>
                  <option value="قيد التنفيذ">قيد التنفيذ</option>
                </select>
              </div>

              <div className="flex gap-3 mt-8 pt-4">
                <button 
                  type="submit" disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-semibold transition-all flex justify-center items-center gap-2"
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