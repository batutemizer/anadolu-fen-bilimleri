export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-800/70 bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <div className="font-semibold text-slate-100">
            Anadolu Fen Bilimleri Özel Öğretim Kursu • TYT – AYT Hazırlık
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Adres, telefon ve iletişim kanalları ana sayfada detaylı olarak
            belirtilmiştir.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full border border-slate-700/80 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
            Kurumsal Eğitim • Birebir Takip
          </span>
          <span className="text-slate-500">
            © {new Date().getFullYear()} TEMIZER. Tüm hakları
            saklıdır.
          </span>
        </div>
      </div>
    </footer>
  );
}



