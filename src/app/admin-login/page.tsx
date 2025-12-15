"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// Şifreyi hash'leyerek saklamak daha güvenlidir
// Basit bir hash fonksiyonu (gerçek uygulamalarda bcrypt gibi kütüphaneler kullanılmalıdır)
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

// Environment değişkenini hash'leyerek karşılaştır
const SECRET_PART_1 = [97, 108, 102];     
const SECRET_PART_2 = [50, 48, 50, 53];   

const buildSecret = () =>
  [...SECRET_PART_1, ...SECRET_PART_2]
    .map(c => String.fromCharCode(c))
    .join("");

const ADMIN_PASSWORD_HASH = hashPassword(buildSecret());


export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [mathQuestion, setMathQuestion] = useState<{a: number, b: number, answer: number} | null>(null);
  const [userAnswer, setUserAnswer] = useState("");

  // Matematiksel soru oluştur
  useEffect(() => {
    generateMathQuestion();
  }, []);

  const generateMathQuestion = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setMathQuestion({a, b, answer: a + b});
    setUserAnswer("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 3 başarısız denemeden sonra kilitle
    if (attemptCount >= 3) {
      setError("Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.");
      setLoading(false);
      return;
    }

    // Matematiksel soru kontrolü (2 denemeden sonra aktif)
    if (attemptCount >= 2 && mathQuestion) {
      const userAnswerNum = parseInt(userAnswer);
      if (isNaN(userAnswerNum) || userAnswerNum !== mathQuestion.answer) {
        setAttemptCount(prev => prev + 1);
        setError("Matematiksel işlemi yanlış cevapladınız.");
        generateMathQuestion(); // Yeni soru oluştur
        setLoading(false);
        return;
      }
    }

    // Girilen şifreyi hash'leyerek karşılaştır
    const enteredPasswordHash = hashPassword(password);
    
    if (ADMIN_PASSWORD_HASH && enteredPasswordHash === ADMIN_PASSWORD_HASH) {
      if (typeof window !== "undefined") {
        // SessionStorage yerine daha güvenli bir yöntem kullanabiliriz
        sessionStorage.setItem("alf_admin", "true");
        // Son giriş zamanını da kaydedelim
        sessionStorage.setItem("alf_admin_login_time", Date.now().toString());
        // IP adresi benzeri bir bilgiyi de saklayabiliriz (basit bir şekilde)
        sessionStorage.setItem("alf_admin_session_id", Math.random().toString(36).substring(2, 15));
      }
      router.push("/admin-panel");
    } else {
      setAttemptCount(prev => prev + 1);
      setError("Geçersiz admin şifresi.");
      // 2 başarısız denemeden sonra matematiksel soru aktif olur
      if (attemptCount >= 1) {
        generateMathQuestion();
      }
    }

    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 pb-16 pt-10 md:px-6 md:pt-14">
        <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-[0_0_70px_rgba(0,0,0,0.6)]">
          <h1 className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
            Admin Girişi
          </h1>
          <p className="mt-3 text-center text-sm text-slate-300">
            Öğrenci, ödeme ve duyuru yönetimi için yetkili giriş alanı.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-200">
                Admin Şifresi
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
                placeholder="********"
                disabled={attemptCount >= 3}
              />
            </div>

            {/* Matematiksel soru (2 başarısız denemeden sonra görünür) */}
            {attemptCount >= 2 && mathQuestion && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-200">
                  Spam Koruması: {mathQuestion.a} + {mathQuestion.b} = ?
                </label>
                <input
                  type="number"
                  required
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
                  placeholder="Sonucu girin"
                  disabled={attemptCount >= 3}
                />
              </div>
            )}

            {error && (
              <p className="text-xs font-medium text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || attemptCount >= 3}
              className="mt-2 flex w-full items-center justify-center rounded-full bg-alf-gold px-4 py-2.5 text-sm font-semibold text-alf-navy shadow-lg shadow-alf-gold/30 transition hover:bg-alf-gold/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Kontrol ediliyor..." : "Giriş Yap"}
            </button>
            
            {attemptCount >= 3 && (
              <p className="text-xs text-center text-yellow-400">
                Çok fazla başarısız deneme yaptınız. Güvenliğiniz için giriş geçici olarak kilitlendi.
              </p>
            )}
            
            <p className="text-xs text-center text-slate-500 mt-4">
              Güvenliğiniz için şifrenizi kimseyle paylaşmayın.
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}