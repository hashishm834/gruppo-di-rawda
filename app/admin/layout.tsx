"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Head from "next/head";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // حالات تسجيل الدخول
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // حالة التحقق (أنا لست روبوت)
  const [captchaStatus, setCaptchaStatus] = useState<"idle" | "verifying" | "verified">("idle");

  const COMPANY_NAME = "GRUPPO DI RAWDA DI NASEFRABIE ABDRABOU AHMED";

  useEffect(() => {
    // التأكد إذا كان المدير مسجل دخول بالفعل
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // مراقبة أي تغيير في حالة الدخول/الخروج
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // دالة اختبار الروبوت الوهمي
  const handleCaptcha = () => {
    if (captchaStatus === "verified") return;
    setCaptchaStatus("verifying");
    setTimeout(() => {
      setCaptchaStatus("verified");
    }, 1500);
  };

  // دالة تسجيل الدخول
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (captchaStatus !== "verified") {
      setLoginError("⚠️ يرجى تأكيد أنك لست روبوت أولاً.");
      return;
    }

    setIsLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError("❌ البريد الإلكتروني أو كلمة المرور غير صحيحة!");
      setCaptchaStatus("idle");
      setIsLoggingIn(false);
    } else {
      // لو الباسورد صح، خده من إيده ووديه الداشبورد فوراً!
      setIsLoggingIn(false);
      router.push("/admin/dashboard"); 
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl animate-bounce">🛡️</span>
          <p className="text-xl animate-pulse text-emerald-400 font-bold">جاري فحص نظام الحماية المتقدمة...</p>
        </div>
      </div>
    );
  }

  // لو مفيش تسجيل دخول => اعرض شاشة الحماية (اللوجين)
  if (!session) {
    return (
      <>
        {/* نعدل عنوان التاب */}
        <Head>
          <title>تسجيل الدخول - {COMPANY_NAME}</title>
        </Head>

        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
          {/* خلفية متحركة */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500 via-gray-900 to-black animate-pulse" />
          
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(249,115,22,0.1)] max-w-lg w-full relative z-10">
            <div className="text-center mb-8">
              
              {/* اللوجو الجديد بالمقاس العريض المضبوط */}
              <div className="w-72 h-auto mx-auto mb-6 flex justify-center">
                <img 
                  src="/logo-construction.png" 
                  alt="Gruppo Di Rawda" 
                  className="w-full h-auto object-contain rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-gray-700/50" 
                />
              </div>

              {/* اسم الشركة الفخم باللون الذهبي */}
              <h2 className="text-xl font-bold bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent mb-1 px-4 leading-tight">
                {COMPANY_NAME}
              </h2>
              <p className="text-gray-400 text-sm mt-2 font-mono">BENVENUTO NELLA PIATTAFORMA AMMINISTRATIVA</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-gray-400 mb-1 text-sm">البريد الإلكتروني للإدارة</label>
                <input 
                  required type="email" value={email} dir="ltr"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-500 transition-colors text-left"
                  placeholder="admin@grupporawda.com"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 text-sm">كلمة المرور السريّة</label>
                <input 
                  required type="password" value={password} dir="ltr"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-500 transition-colors text-left font-mono"
                  placeholder="••••••••"
                />
              </div>

              {/* نظام أنا لست روبوت */}
              <div 
                onClick={handleCaptcha}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  captchaStatus === "verified" ? "bg-orange-500/10 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.1)]" : "bg-gray-900/50 border-gray-700 hover:border-gray-500"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-600 flex items-center justify-center shrink-0">
                  {captchaStatus === "verifying" && <span className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />}
                  {captchaStatus === "verified" && <span className="text-orange-400 font-bold text-2xl">✓</span>}
                </div>
                <span className={`font-semibold ${captchaStatus === "verified" ? "text-orange-400" : "text-gray-300"}`}>
                  أنا لست برنامج روبوت (التحقق من الهوية)
                </span>
                <span className="mr-auto text-3xl opacity-50 grayscale">🤖</span>
              </div>

              {loginError && (
                <div className="text-red-400 text-sm text-center bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                  {loginError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoggingIn || captchaStatus === "verifying"}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-orange-500/25 mt-2 text-lg"
              >
                {isLoggingIn ? "جاري المصادقة..." : "تسجيل الدخول"}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // لو المدير مسجل دخول => اعرض له لوحة التحكم
  return (
    <>
      <Head>
        <title>لوحة التحكم - {COMPANY_NAME}</title>
      </Head>

      {/* زرار تسجيل خروج عائم */}
      <div className="fixed top-6 left-6 z-50">
        <button 
          onClick={() => {
            supabase.auth.signOut();
            router.push("/admin"); // يرجعه للوجين بعد الخروج عشان ميشوفش شاشة بيضا
          }} 
          className="bg-red-600/90 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.3)] backdrop-blur-sm transition-all text-sm font-bold flex items-center gap-2 border border-red-500/50 hover:scale-105"
        >
          <span>خروج من النظام</span>
          <span className="text-lg">🔒</span>
        </button>
      </div>
      
      {/* هنا بيتعرض محتوى الصفحات بتاعتك */}
      {children}
    </>
  );
}