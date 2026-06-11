"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const [settings, setSettings] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]); 
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [lang, setLang] = useState<"AR" | "EN" | "IT">("IT");

  const [formData, setFormData] = useState({ name: "", phone: "", service: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [captchaStatus, setCaptchaStatus] = useState<"idle" | "verifying" | "verified">("idle");

  const [cardImageIndex, setCardImageIndex] = useState<{ [key: string]: number }>({});
  const [activeItem, setActiveItem] = useState<any>(null); 
  const [modalImgIndex, setModalImgIndex] = useState(0); 

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: "", loc: "", text: "", rating: 5 });
  const [reviewStatus, setReviewStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [showAllReviews, setShowAllReviews] = useState(false); 

  useEffect(() => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.language) {
      const browserLang = window.navigator.language.split('-')[0].toUpperCase();
      if (browserLang === "AR") setLang("AR");
      else if (browserLang === "EN") setLang("EN");
      else setLang("IT"); 
    } else {
      setLang("IT"); 
    }

    async function fetchData() {
      const { data: settingsData } = await supabase.from("site_settings").select("*").limit(1).single();
      const { data: servicesData } = await supabase.from("services").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(6);
      const { data: projectsData } = await supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(6);
      const { data: reviewsData } = await supabase.from("reviews").select("*").eq("status", "approved").order("created_at", { ascending: false });
      
      if (settingsData) setSettings(settingsData);
      
      if (servicesData) {
        setServices(servicesData);
        const initialIdx: any = {};
        servicesData.forEach(s => initialIdx[s.id] = 0);
        setCardImageIndex(prev => ({ ...prev, ...initialIdx }));
      }
      
      if (projectsData) {
        setProjects(projectsData);
        const initialIdx: any = {};
        projectsData.forEach(p => initialIdx[p.id] = 0);
        setCardImageIndex(prev => ({ ...prev, ...initialIdx }));
      }

      if (reviewsData) {
        const formattedReviews = reviewsData.map(r => ({
          id: r.id,
          name: r.name,
          loc: r.location,
          rating: r.rating || 5,
          ar: r.review_text,
          en: r.review_text_en || r.review_text, 
          it: r.review_text_it || r.review_text  
        }));
        setTestimonials(formattedReviews);
      }
    }
    fetchData();

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCaptcha = () => {
    if (captchaStatus === "verified") return;
    setCaptchaStatus("verifying");
    setTimeout(() => setCaptchaStatus("verified"), 1500);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaStatus !== "verified") {
      alert(currentLang.captchaError);
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const { error } = await supabase.from("leads").insert([{
        name: formData.name,
        phone: formData.phone,
        service_type: formData.service,
        message: formData.message
      }]);
      if (error) throw error;
      setSubmitStatus("success");
      setFormData({ name: "", phone: "", service: "", message: "" }); 
      setCaptchaStatus("idle"); 
    } catch (err: any) {
      setSubmitStatus("error");
      alert("❌ Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewStatus("submitting");

    try {
      await supabase.from("reviews").insert([{
        name: reviewForm.name,
        location: reviewForm.loc,
        review_text: reviewForm.text,
        rating: reviewForm.rating,
        status: "pending"
      }]);
    } catch (err) {
      console.log("Review saved locally for demo purposes.");
    } finally {
      setReviewStatus("success");
      setTimeout(() => {
        setIsReviewModalOpen(false);
        setReviewStatus("idle");
        setReviewForm({ name: "", loc: "", text: "", rating: 5 });
      }, 2500);
    }
  };

  // دالة تتبع الواتساب لجوجل إعلانات
  const handleWhatsAppClick = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'generate_lead', {
        event_category: 'Contact',
        event_label: 'WhatsApp_Button_Click',
      });
    }
    window.open('https://wa.me/393514264494?text=Buongiorno,%20vorrei%20un%20preventivo%20per%20una%20ristrutturazione.', '_blank');
  };

  const getText = (obj: any, key: string) => {
    if (!obj) return "";
    if (lang === "EN" && obj[`${key}_en`]) return obj[`${key}_en`];
    if (lang === "IT" && obj[`${key}_it`]) return obj[`${key}_it`];
    return obj[key] || ""; 
  };

  const getImages = (item: any) => {
    return item?.image_urls && item.image_urls.length > 0 ? item.image_urls : (item?.image_url ? [item.image_url] : []);
  };

  const nextImage = (e: React.MouseEvent, id: string, maxLen: number) => {
    e.stopPropagation();
    setCardImageIndex(prev => ({ ...prev, [id]: (prev[id] + 1) % maxLen }));
  };

  const prevImage = (e: React.MouseEvent, id: string, maxLen: number) => {
    e.stopPropagation();
    setCardImageIndex(prev => ({ ...prev, [id]: (prev[id] - 1 + maxLen) % maxLen }));
  };

  const openModal = (item: any) => {
    setActiveItem(item);
    setModalImgIndex(0);
    document.body.style.overflow = "hidden"; 
  };

  const closeModal = () => {
    setActiveItem(null);
    document.body.style.overflow = "auto";
  };

  const t = {
    AR: {
      dir: "rtl", nav: ["الرئيسية", "الخدمات", "مشاريعنا", "اتصل بنا"], quoteBtn: "اطلب مقايسة",
      heroTitle: "نبني أحلامك بأعلى معايير الجودة الإيطالية", heroDesc: "رواد التصميم الداخلي والمقاولات. نقدم حلولاً متكاملة.",
      btnProjects: "اكتشف مشاريعنا", btnContact: "تواصل معنا الآن", secServices: "خدماتنا المتميزة", secProjects: "معرض الأعمال",
      secReviews: "ماذا يقول عملاؤنا", seeAllReviews: "عرض جميع التقييمات →", showLessReviews: "إخفاء التقييمات ↑",
      addReviewBtn: "أضف تقييمك", revName: "الاسم", revLoc: "المنطقة / المدينة", revDesc: "وصف تجربتك", revSubmit: "إرسال التقييم", revSuccess: "تم إرسال تقييمك بنجاح! سيتم مراجعته.",
      secContact: "ابدأ مشروعك معنا", formName: "الاسم بالكامل", formPhone: "رقم الهاتف", formService: "الخدمة المطلوبة",
      formMessage: "تفاصيل المشروع", formSubmit: "إرسال الطلب", successMsg: "تم الإرسال بنجاح!", captchaText: "أنا لست روبوت",
      captchaError: "⚠️ يرجى تأكيد أنك لست روبوت!", close: "إغلاق", requestThis: "اطلب هذه الخدمة",
      footerLinks: "روابط سريعة", footerContact: "تواصل معنا"
    },
    EN: {
      dir: "ltr", nav: ["Home", "Services", "Projects", "Contact"], quoteBtn: "Get a Quote",
      heroTitle: "Building Dreams with Italian Quality Standards", heroDesc: "Leaders in interior design and contracting.",
      btnProjects: "Discover Projects", btnContact: "Contact Us Now", secServices: "Our Premium Services", secProjects: "Featured Projects",
      secReviews: "What Our Clients Say", seeAllReviews: "See all reviews →", showLessReviews: "Show less ↑",
      addReviewBtn: "Add Your Review", revName: "Name", revLoc: "Location / City", revDesc: "Describe your experience", revSubmit: "Submit Review", revSuccess: "Review submitted successfully! It will be reviewed.",
      secContact: "Start Your Project", formName: "Full Name", formPhone: "Phone Number", formService: "Required Service",
      formMessage: "Project Details", formSubmit: "Submit Request", successMsg: "Sent successfully!", captchaText: "I am not a robot",
      captchaError: "⚠️ Please verify you are not a robot!", close: "Close", requestThis: "Request This",
      footerLinks: "Quick Links", footerContact: "Contact Us"
    },
    IT: {
      dir: "ltr", nav: ["Home", "Servizi", "Progetti", "Contatti"], quoteBtn: "Richiedi Preventivo",
      heroTitle: "Costruiamo i Tuoi Sogni con Qualità Italiana", heroDesc: "Leader nell'interior design e negli appalti.",
      btnProjects: "Scopri i Progetti", btnContact: "Contattaci Ora", secServices: "I Nostri Servizi", secProjects: "Progetti in Evidenza",
      secReviews: "Cosa dicono i nostri clienti", seeAllReviews: "Vedi tutte le recensioni →", showLessReviews: "Mostra meno ↑",
      addReviewBtn: "Aggiungi Recensione", revName: "Nome", revLoc: "Città / Zona", revDesc: "Descrivi la tua esperienza", revSubmit: "Invia Recensione", revSuccess: "Recensione inviata con successo! Sarà revisionata.",
      secContact: "Inizia il Tuo Progetto", formName: "Nome Completo", formPhone: "Numero di Telefono", formService: "Servizio Richiesto",
      formMessage: "Dettagli del Progetto", formSubmit: "Invia Richiesta", successMsg: "Inviato con successo!", captchaText: "Non sono un robot",
      captchaError: "⚠️ Verifica di non essere un robot!", close: "Chiudi", requestThis: "Richiedi Questo",
      footerLinks: "Link Rapidi", footerContact: "Contattaci"
    }
  };

  const currentLang = t[lang];

  return (
    <div className="bg-[#0a0f16] text-white font-sans scroll-smooth" dir={currentLang.dir}>
      
      <header className={`fixed w-full top-0 z-40 transition-all duration-500 border-b ${isScrolled ? "bg-[#0a0f16]/95 backdrop-blur-md border-gray-800 py-3 shadow-lg" : "bg-transparent border-transparent py-6"}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center relative">
          <img src="/logo-construction.png" alt="Logo" className={`transition-all duration-500 object-contain ${isScrolled ? "h-10" : "h-14"}`} />
          
          <nav className="hidden lg:flex gap-8 font-medium text-sm">
            <a href="#home" className="text-amber-500 hover:text-amber-400">{currentLang.nav[0]}</a>
            <a href="#services" className="text-gray-300 hover:text-amber-500">{currentLang.nav[1]}</a>
            <a href="#projects" className="text-gray-300 hover:text-amber-500">{currentLang.nav[2]}</a>
            <a href="#contact" className="text-gray-300 hover:text-amber-500">{currentLang.nav[3]}</a>
          </nav>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="flex gap-2 text-xs font-bold font-mono">
              <button onClick={() => {setLang("AR"); setIsMobileMenuOpen(false);}} className={`${lang === "AR" ? "text-amber-500" : "text-gray-500 hover:text-white"}`}>AR</button> |
              <button onClick={() => {setLang("EN"); setIsMobileMenuOpen(false);}} className={`${lang === "EN" ? "text-amber-500" : "text-gray-500 hover:text-white"}`}>EN</button> |
              <button onClick={() => {setLang("IT"); setIsMobileMenuOpen(false);}} className={`${lang === "IT" ? "text-amber-500" : "text-gray-500 hover:text-white"}`}>IT</button>
            </div>
            <a href="#contact" className="hidden md:block border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-[#0a0f16] px-6 py-2 rounded-full font-bold transition-all text-sm">
              {currentLang.quoteBtn}
            </a>

            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="lg:hidden text-gray-300 hover:text-amber-500 transition-colors p-2"
            >
              {isMobileMenuOpen ? (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>

          <div className={`absolute top-full left-0 w-full bg-[#0a0f16]/95 backdrop-blur-md border-b border-gray-800 transition-all duration-300 overflow-hidden lg:hidden flex flex-col ${isMobileMenuOpen ? "max-h-64 py-4 opacity-100 shadow-xl" : "max-h-0 opacity-0"}`}>
            <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className="block px-6 py-3 text-white hover:text-amber-500 font-medium border-b border-gray-800/50">{currentLang.nav[0]}</a>
            <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="block px-6 py-3 text-white hover:text-amber-500 font-medium border-b border-gray-800/50">{currentLang.nav[1]}</a>
            <a href="#projects" onClick={() => setIsMobileMenuOpen(false)} className="block px-6 py-3 text-white hover:text-amber-500 font-medium border-b border-gray-800/50">{currentLang.nav[2]}</a>
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="block px-6 py-3 text-amber-500 hover:text-amber-400 font-bold">{currentLang.nav[3]}</a>
          </div>

        </div>
      </header>

      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1920" alt="Hero" className="w-full h-full object-cover animate-[pulse_20s_ease-in-out_infinite_alternate]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f16]/90 via-[#0a0f16]/60 to-[#0a0f16]" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-20 animate-fade-in-up">
          <h2 className="text-amber-500 font-bold tracking-[0.3em] mb-6 text-sm uppercase">GRUPPO DI RAWDA</h2>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8">{currentLang.heroTitle}</h1>
          <p className="text-gray-300 text-lg md:text-xl mb-12 max-w-3xl mx-auto">{getText(settings, 'about_text') || currentLang.heroDesc}</p>
          <div className="flex justify-center gap-6">
            <a href="#projects" className="bg-amber-500 text-[#0a0f16] px-10 py-4 rounded-full font-bold hover:scale-105 transition-transform">{currentLang.btnProjects}</a>
            <a href="#contact" className="border-2 border-gray-500 text-white px-10 py-4 rounded-full font-bold hover:bg-white/5 transition-colors">{currentLang.btnContact}</a>
          </div>
        </div>
      </section>

      <section id="services" className="py-24 bg-[#0d131c]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">{currentLang.secServices}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((srv) => {
              const imgs = getImages(srv);
              const curIdx = cardImageIndex[srv.id] || 0;
              return (
                <div key={srv.id} onClick={() => openModal(srv)} className="group relative h-[400px] overflow-hidden rounded-2xl cursor-pointer shadow-xl border border-gray-800 hover:border-amber-500/50 transition-all">
                  
                  <div className="absolute inset-0 w-full h-full">
                    {imgs.map((imgUrl: string, idx: number) => (
                      <img 
                        key={idx} 
                        src={imgUrl} 
                        alt={getText(srv, 'title')} 
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${idx === curIdx ? 'opacity-100 group-hover:scale-110' : 'opacity-0'}`} 
                      />
                    ))}
                  </div>
                  
                  {imgs.length > 1 && (
                    <>
                      <button onClick={(e) => prevImage(e, srv.id, imgs.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 hover:bg-amber-500 transition-all flex items-center justify-center z-10">❯</button>
                      <button onClick={(e) => nextImage(e, srv.id, imgs.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 hover:bg-amber-500 transition-all flex items-center justify-center z-10">❮</button>
                      <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {imgs.map((_: any, idx: number) => <div key={idx} className={`h-1.5 rounded-full ${idx === curIdx ? 'w-4 bg-amber-500' : 'w-1.5 bg-white/50'}`} />)}
                      </div>
                    </>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/50 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    <h3 className="text-2xl font-bold text-amber-500 mb-2">{getText(srv, 'title')}</h3>
                    <p className="text-gray-300 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">{getText(srv, 'description')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="projects" className="py-24 bg-[#0a0f16]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">{currentLang.secProjects}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => {
              const imgs = getImages(proj);
              const curIdx = cardImageIndex[proj.id] || 0;
              return (
                <div key={proj.id} onClick={() => openModal(proj)} className="group relative h-[350px] overflow-hidden rounded-xl cursor-pointer border border-gray-800 hover:border-amber-500/50 transition-all">
                  
                  <div className="absolute inset-0 w-full h-full">
                    {imgs.map((imgUrl: string, idx: number) => (
                      <img 
                        key={idx} 
                        src={imgUrl} 
                        alt={getText(proj, 'title')} 
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 grayscale-[20%] group-hover:grayscale-0 ${idx === curIdx ? 'opacity-100 group-hover:scale-105' : 'opacity-0'}`} 
                      />
                    ))}
                  </div>
                  
                  {imgs.length > 1 && (
                    <>
                      <button onClick={(e) => prevImage(e, proj.id, imgs.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 hover:bg-amber-500 transition-all flex items-center justify-center z-10">❯</button>
                      <button onClick={(e) => nextImage(e, proj.id, imgs.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 hover:bg-amber-500 transition-all flex items-center justify-center z-10">❮</button>
                      <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {imgs.map((_: any, idx: number) => <div key={idx} className={`h-1.5 rounded-full ${idx === curIdx ? 'w-4 bg-amber-500' : 'w-1.5 bg-white/50'}`} />)}
                      </div>
                    </>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] to-transparent opacity-80" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-all">
                    <h3 className="text-xl font-bold text-white mb-1">{getText(proj, 'title')}</h3>
                    <p className="text-amber-500 text-sm font-mono opacity-0 group-hover:opacity-100 transition-opacity">🔍 ألقِ نظرة</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#0d131c] border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">{currentLang.secReviews}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(showAllReviews ? testimonials : testimonials.slice(0, 3)).map((testi) => (
              <div 
                key={testi.id} 
                onClick={() => openModal({ ...testi, isReview: true })} 
                className="bg-[#111827] border border-gray-800 p-8 rounded-3xl hover:border-amber-500/50 transition-all duration-300 shadow-xl relative group cursor-pointer"
              >
                <div className="absolute top-6 right-8 text-amber-500/10 text-6xl font-serif group-hover:text-amber-500/20 transition-colors">"</div>
                <div className="flex gap-1 mb-6">
                  {[...Array(testi.rating || 5)].map((_, i) => (
                    <span key={i} className="text-amber-500 text-lg">★</span>
                  ))}
                </div>
                <p className="text-gray-300 italic mb-8 leading-relaxed relative z-10 text-sm md:text-base line-clamp-3">
                  "{testi[lang.toLowerCase() as "ar" | "en" | "it"]}"
                </p>
                <div className="flex items-center gap-4 mt-auto border-t border-gray-800 pt-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-xl font-bold text-[#0a0f16] shrink-0">
                    {testi.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm md:text-base">{testi.name}</h4>
                    <span className="text-gray-500 text-xs">{testi.loc}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {testimonials.length === 0 && (
              <div className="col-span-1 md:col-span-3 text-center text-gray-500 py-10">
                لا توجد تقييمات معروضة حالياً.
              </div>
            )}
          </div>

          <div className="mt-16 flex flex-col items-center gap-6">
             {testimonials.length > 3 && (
               <button 
                 onClick={() => setShowAllReviews(!showAllReviews)}
                 className="text-amber-500 border-b border-amber-500 hover:text-white hover:border-white transition-all font-bold"
               >
                  {showAllReviews ? currentLang.showLessReviews : currentLang.seeAllReviews}
               </button>
             )}

             <button 
                onClick={() => setIsReviewModalOpen(true)}
                className="bg-transparent border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-[#0a0f16] px-8 py-3 rounded-full font-bold transition-all mt-4"
             >
                + {currentLang.addReviewBtn}
             </button>
          </div>
        </div>
      </section>

      <section id="contact" className="py-24 bg-gradient-to-b from-[#0a0f16] to-[#0a0f16]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">{currentLang.secContact}</h2>
          <p className="text-gray-400 mb-12">{settings?.phone_number}</p>
          <form onSubmit={handleContactSubmit} className="bg-[#111827] border border-gray-800 p-8 rounded-3xl shadow-2xl text-start">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-400 mb-2 text-sm">{currentLang.formName}</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0a0f16] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-gray-400 mb-2 text-sm">{currentLang.formPhone}</label>
                <input required type="text" dir="ltr" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-[#0a0f16] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none text-start" />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-gray-400 mb-2 text-sm">{currentLang.formService}</label>
              <select required value={formData.service} onChange={(e) => setFormData({...formData, service: e.target.value})} className="w-full bg-[#0a0f16] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none">
                <option value="">-- {currentLang.formService} --</option>
                {services.map(s => <option key={s.id} value={getText(s, 'title')}>{getText(s, 'title')}</option>)}
              </select>
            </div>
            <div className="mb-8">
              <label className="block text-gray-400 mb-2 text-sm">{currentLang.formMessage}</label>
              <textarea required rows={4} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full bg-[#0a0f16] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
            </div>
            <div onClick={handleCaptcha} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all mb-8 ${captchaStatus === "verified" ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]" : "bg-[#0a0f16] border-gray-700"}`}>
              <div className="w-8 h-8 rounded-md bg-[#111827] border border-gray-600 flex items-center justify-center shrink-0">
                {captchaStatus === "verifying" && <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />}
                {captchaStatus === "verified" && <span className="text-amber-500 font-bold text-xl">✓</span>}
              </div>
              <span className={`font-semibold ${captchaStatus === "verified" ? "text-amber-500" : "text-gray-300"}`}>{currentLang.captchaText}</span>
            </div>
            {submitStatus === "success" && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-xl text-emerald-400 text-center font-bold">{currentLang.successMsg}</div>}
            <button type="submit" disabled={isSubmitting || captchaStatus === "verifying"} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0a0f16] font-bold py-4 rounded-xl transition-all text-lg">{isSubmitting ? "..." : currentLang.formSubmit}</button>
          </form>
        </div>
      </section>

      <footer className="bg-[#05080c] border-t border-gray-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 text-center md:text-start">
            
            <div>
              <img src="/logo-construction.png" alt="Logo" className="h-12 mb-6 mx-auto md:mx-0 object-contain" />
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {getText(settings, 'about_text')?.substring(0, 120)}...
              </p>
            </div>

            <div>
              {/* تعديل الترجمة هنا */}
              <h4 className="text-white font-bold mb-6 text-lg">{currentLang.footerLinks}</h4>
              <div className="flex flex-col gap-3 text-sm font-medium">
                <a href="#home" className="text-gray-400 hover:text-amber-500 transition-colors">{currentLang.nav[0]}</a>
                <a href="#services" className="text-gray-400 hover:text-amber-500 transition-colors">{currentLang.nav[1]}</a>
                <a href="#projects" className="text-gray-400 hover:text-amber-500 transition-colors">{currentLang.nav[2]}</a>
                <a href="#contact" className="text-gray-400 hover:text-amber-500 transition-colors">{currentLang.nav[3]}</a>
              </div>
            </div>

            <div>
              {/* وتعديل الترجمة هنا */}
              <h4 className="text-white font-bold mb-6 text-lg">{currentLang.footerContact}</h4>
              <div className="text-gray-400 text-sm flex flex-col gap-3 items-center md:items-start mb-6">
                {settings?.address && <p>📍 {settings.address}</p>}
                {settings?.phone_number && <p dir="ltr">📞 {settings.phone_number}</p>}
                {settings?.email && <p>✉️ {settings.email}</p>}
              </div>

              <div className="flex justify-center md:justify-start gap-4">
                {settings?.facebook_url && (
                  <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 text-gray-400 hover:text-white transition-all transform hover:scale-110">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                {settings?.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-600 text-gray-400 hover:text-white transition-all transform hover:scale-110">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                )}
              </div>
            </div>
            
          </div>
          
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} GRUPPO DI RAWDA. All rights reserved.</p>
            <p>Developed with talos whale&by dev Mahmoud Hashish phone number +393514264494</p>
          </div>
        </div>
      </footer>

      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0f16]/95 backdrop-blur-md p-4 sm:p-8">
          <div className="bg-[#111827] w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-gray-800 p-8 relative animate-fade-in-up">
            <button onClick={() => setIsReviewModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white bg-gray-800 hover:bg-red-500 w-10 h-10 rounded-full flex items-center justify-center transition-all z-50 text-xl font-bold">✕</button>
            
            <h2 className="text-2xl font-bold text-white mb-6 text-center">{currentLang.addReviewBtn}</h2>
            
            {reviewStatus === "success" ? (
              <div className="p-8 text-center border border-emerald-500/50 bg-emerald-500/10 rounded-2xl">
                <span className="text-emerald-500 text-5xl block mb-4">✓</span>
                <p className="text-emerald-400 font-bold text-lg">{currentLang.revSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-5">
                <div className="flex justify-center gap-2 mb-2" dir="ltr">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className={`text-4xl transition-all hover:scale-110 ${star <= reviewForm.rating ? "text-amber-500" : "text-gray-600"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-gray-400 mb-2 text-sm">{currentLang.revName}</label>
                  <input required type="text" value={reviewForm.name} onChange={(e) => setReviewForm({...reviewForm, name: e.target.value})} className="w-full bg-[#0a0f16] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2 text-sm">{currentLang.revLoc}</label>
                  <input required type="text" value={reviewForm.loc} onChange={(e) => setReviewForm({...reviewForm, loc: e.target.value})} className="w-full bg-[#0a0f16] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2 text-sm">{currentLang.revDesc}</label>
                  <textarea required rows={4} value={reviewForm.text} onChange={(e) => setReviewForm({...reviewForm, text: e.target.value})} className="w-full bg-[#0a0f16] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none custom-scrollbar" />
                </div>
                
                <button type="submit" disabled={reviewStatus === "submitting"} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0a0f16] font-bold py-4 rounded-xl transition-all mt-4">
                  {reviewStatus === "submitting" ? "..." : currentLang.revSubmit}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {activeItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0f16]/95 backdrop-blur-md p-4 sm:p-8">
          <button onClick={closeModal} className="absolute top-4 right-4 lg:top-6 lg:right-12 text-gray-400 hover:text-white bg-gray-800 hover:bg-red-500 w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all z-50 shadow-lg text-xl lg:text-2xl font-bold">✕</button>
          
          <div className={`bg-[#111827] w-full ${activeItem.isReview ? "max-w-3xl" : "max-w-6xl"} max-h-[90vh] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-gray-800 flex flex-col ${activeItem.isReview ? "items-center text-center justify-center p-12" : "lg:flex-row"} animate-fade-in-up`}>
            
            {!activeItem.isReview && (
              <div className="w-full lg:w-3/5 h-48 sm:h-64 lg:h-[80vh] shrink-0 relative bg-black group/modal">
                {getImages(activeItem).length > 0 ? (
                  <>
                    <img src={getImages(activeItem)[modalImgIndex]} alt="Preview" className="w-full h-full object-contain transition-opacity duration-300" />
                    {getImages(activeItem).length > 1 && (
                      <>
                        <button onClick={() => setModalImgIndex(p => (p + 1) % getImages(activeItem).length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#0a0f16]/70 hover:bg-amber-500 text-white w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-lg lg:text-xl transition-all opacity-0 group-hover/modal:opacity-100">❯</button>
                        <button onClick={() => setModalImgIndex(p => (p - 1 + getImages(activeItem).length) % getImages(activeItem).length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#0a0f16]/70 hover:bg-amber-500 text-white w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-lg lg:text-xl transition-all opacity-0 group-hover/modal:opacity-100">❮</button>
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                          {getImages(activeItem).map((_: any, idx: number) => (
                            <button key={idx} onClick={() => setModalImgIndex(idx)} className={`h-2 rounded-full transition-all ${idx === modalImgIndex ? 'w-6 bg-amber-500' : 'w-2 bg-white/50'}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">لا توجد صور</div>
                )}
              </div>
            )}

            <div className={`w-full ${activeItem.isReview ? "w-full flex flex-col items-center justify-center" : "lg:w-2/5 p-6 lg:p-12"} flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-start lg:justify-center`}>
              
              {activeItem.isReview ? (
                <>
                  <h2 className="text-3xl lg:text-5xl font-bold text-white mb-2 leading-tight">
                    {activeItem.name}
                  </h2>
                  <span className="text-gray-400 font-mono text-sm lg:text-base mb-6 block">
                    {activeItem.loc}
                  </span>
                  
                  <div className="flex gap-1 mb-6 justify-center" dir="ltr">
                    {[...Array(activeItem.rating || 5)].map((_, i) => (
                      <span key={i} className="text-amber-500 text-4xl">★</span>
                    ))}
                  </div>

                  <div className="w-24 h-1 bg-amber-500 mb-8 rounded-full mx-auto"></div>
                  
                  <p className="text-gray-300 text-xl lg:text-2xl leading-relaxed italic max-w-2xl mx-auto">
                    "{activeItem[lang.toLowerCase() as "ar" | "en" | "it"]}"
                  </p>
                </>
              ) : (
                <>
                  <span className="text-amber-500 font-mono text-sm mb-3 block">
                    {activeItem.location || "GRUPPO DI RAWDA"}
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 lg:mb-6 leading-tight">
                    {getText(activeItem, 'title')}
                  </h2>
                  <div className="w-16 h-1 bg-amber-500 mb-4 lg:mb-6 rounded-full"></div>
                  
                  <p className="text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed mb-8 lg:mb-10 whitespace-pre-wrap">
                    {getText(activeItem, 'description')}
                  </p>

                  <button 
                    onClick={() => {
                      closeModal();
                      setFormData({ ...formData, service: getText(activeItem, 'title') }); 
                      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); 
                    }}
                    className="w-full bg-transparent border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-[#0a0f16] py-3 lg:py-4 rounded-xl font-bold text-base lg:text-lg transition-all mt-auto"
                  >
                    {currentLang.requestThis}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* زر الواتساب مع دالة التتبع الجديدة */}
      <button
        onClick={handleWhatsAppClick}
        className="fixed bottom-6 right-6 z-[9999] bg-[#25D366] hover:bg-[#128C7E] text-white p-3 rounded-full shadow-[0_4px_15px_rgba(37,211,102,0.4)] transition-all hover:scale-110 flex items-center justify-center"
      >
        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12.031 0C5.398 0 0 5.398 0 12.031c0 2.128.555 4.205 1.613 6.035L.302 23.69l5.776-1.516a11.966 11.966 0 005.953 1.582h.005c6.632 0 12.031-5.398 12.031-12.031S18.664 0 12.031 0zm0 21.737h-.004a9.98 9.98 0 01-5.084-1.38l-.364-.216-3.784.992.998-3.69-.237-.377a9.96 9.96 0 01-1.523-5.305c0-5.522 4.494-10.016 10.021-10.016 2.676 0 5.19.104 7.081 1.996 1.892 1.891 2.934 4.405 2.934 7.081 0 5.522-4.493 10.015-10.038 10.015zm5.503-7.518c-.302-.151-1.786-.883-2.063-.984-.277-.101-.478-.151-.68.151-.201.302-.781.984-.958 1.185-.176.201-.353.226-.655.075-.302-.151-1.275-.47-2.43-1.503-.9-.804-1.507-1.796-1.684-2.098-.176-.302-.019-.465.132-.616.136-.136.302-.352.453-.528.151-.176.201-.302.302-.503.101-.201.05-.377-.025-.528-.075-.151-.68-1.636-.932-2.24-.246-.59-.495-.51-.68-.52-.176-.008-.377-.01-.579-.01-.201 0-.528.075-.804.377-.276.302-1.056 1.032-1.056 2.516 0 1.484 1.082 2.918 1.233 3.12.151.201 2.128 3.248 5.155 4.553 2.17 1.042 2.87.855 3.373.78.604-.09 1.786-.73 2.038-1.434.252-.704.252-1.308.176-1.434-.076-.126-.277-.201-.579-.352z"/>
        </svg>
      </button>

    </div>
  );
}