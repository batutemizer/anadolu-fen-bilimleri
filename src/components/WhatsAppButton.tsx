"use client";

import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_URL =
  "https://wa.me/904245024840?text=Merhaba,%20Anadolu%20Fen%20Bilimleri%20hakkında%20bilgi%20almak%20istiyorum.";

export default function WhatsAppButton() {
  return (
    <Link
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile iletişime geç"
      className="fixed bottom-6 right-6 z-[999] group"
    >
      {/* Glow efekti */}
      <div className="absolute -inset-2 rounded-full bg-green-500 blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />

      {/* Button */}
      <div className="relative flex items-center gap-3 rounded-full bg-green-500 px-5 py-4 text-white shadow-2xl hover:bg-green-600 transition-all">
        <FaWhatsapp size={26} />
        <span className="hidden md:block font-semibold tracking-wide">
          WhatsApp
        </span>
      </div>
    </Link>
  );
}
