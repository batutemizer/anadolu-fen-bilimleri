"use client";

import Link from "next/link";
import Image from "next/image";
import AlfLogo from "../../public/AlfLogo2.png";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

const navLinkBase =
  "relative text-sm font-medium tracking-wide transition-colors hover:text-alf-gold/90";

export function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Tarayıcı ortamında mı kontrolü
    if (typeof window !== "undefined") {
      const adminStatus = sessionStorage.getItem("alf_admin");
      setIsAdmin(!!adminStatus);
      
      // SessionStorage değişikliklerini dinle
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "alf_admin") {
          setIsAdmin(!!e.newValue);
        }
      };
      
      window.addEventListener("storage", handleStorageChange);
      
      // Cleanup
      return () => {
        window.removeEventListener("storage", handleStorageChange);
      };
    }
  }, []);

  const handleAdminLogout = () => {
    // Session'ı temizle
    sessionStorage.removeItem("alf_admin");
    sessionStorage.removeItem("alf_admin_login_time");
    sessionStorage.removeItem("alf_admin_session_id");
    setIsAdmin(false);
    // Diğer sekmelerdeki değişikliği tetikle
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'alf_admin',
      newValue: null
    }));
    // Login sayfasına yönlendir
    router.push("/admin-login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-full border border-alf-gold/35 bg-slate-900/80 shadow-md shadow-alf-gold/30">
            <Image
              src={AlfLogo}
              alt="Alf Kurs Merkezi logosu"
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-50">
              Anadolu Fen Bilimleri Özel Öğretim Kursu
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
            
            </span>
          </div>
        </Link>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2 rounded-lg text-slate-300 hover:text-alf-gold focus:outline-none focus:ring-2 focus:ring-alf-gold"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className={navLinkBase}>
            Ana Sayfa
          </Link>
          
          {isAdmin ? (
            <button
              onClick={handleAdminLogout}
              className="rounded-full border border-red-500/60 bg-red-500/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-red-400 shadow-sm transition hover:bg-red-500/15"
            >
              Çıkış Yap
            </button>
          ) : (
            <Link
              href="/admin-login"
              className="rounded-full border border-alf-gold/60 bg-alf-gold/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-alf-gold shadow-sm transition hover:bg-alf-gold/15"
            >
              Admin
            </Link>
          )}
          
          <Link href="/ne-sunuyoruz" className={navLinkBase}>
            Ne Sunuyoruz?
          </Link>
          
          <Link href="/ogretmenlerimiz" className={navLinkBase}>
            Öğretmenlerimiz
          </Link>
          
          <Link href="/iletisim" className={navLinkBase}>
            İletişim
          </Link>
        </nav>
      </div>
      
      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800/80 z-50">
          <div className="px-4 py-4 flex flex-col gap-4">
            <Link 
              href="/" 
              className={`${navLinkBase} py-2`}
              onClick={() => setIsMenuOpen(false)}
            >
              Ana Sayfa
            </Link>
            
            {isAdmin ? (
              <button
                onClick={() => {
                  handleAdminLogout();
                  setIsMenuOpen(false);
                }}
                className="rounded-full border border-red-500/60 bg-red-500/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-400 shadow-sm transition hover:bg-red-500/15 text-left"
              >
                Çıkış Yap
              </button>
            ) : (
              <Link
                href="/admin-login"
                className="rounded-full border border-alf-gold/60 bg-alf-gold/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-alf-gold shadow-sm transition hover:bg-alf-gold/15 text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            
            <Link 
              href="/ne-sunuyoruz" 
              className={`${navLinkBase} py-2`}
              onClick={() => setIsMenuOpen(false)}
            >
              Ne Sunuyoruz?
            </Link>
            
            <Link 
              href="/ogretmenlerimiz" 
              className={`${navLinkBase} py-2`}
              onClick={() => setIsMenuOpen(false)}
            >
              Öğretmenlerimiz
            </Link>
            
            <Link 
              href="/iletisim" 
              className={`${navLinkBase} py-2`}
              onClick={() => setIsMenuOpen(false)}
            >
              İletişim
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}