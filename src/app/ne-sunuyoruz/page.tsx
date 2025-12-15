"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  Brain,
  Trophy,
  MonitorPlay,
  BarChart3,
  ClipboardCheck,
  MessageSquare,
  Layers,
  Library
} from "lucide-react";
import Image from "next/image";
import AlfLogo from "../../../public/AlfLogo2.png";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function NeSunuyoruzPage() {
  const features = [
    {
      icon: <BookOpen size={28} />,
      title: "Deneyimli Öğretmen Kadrosu",
      text: "Alanında uzman, müfredata hâkim ve sınav sistemini yakından takip eden öğretmenlerle eğitim veriyoruz."
    },
    {
      icon: <Brain size={28} />,
      title: "Kişiye Özel Öğrenim Planı",
      text: "Öğrencinin seviyesi, hedefi ve ihtiyaçlarına göre bireysel çalışma planları hazırlanır."
    },
    {
      icon: <MonitorPlay size={28} />,
      title: "Online – Offline Eğitim Desteği",
      text: "Yüz yüze derslerin yanı sıra dijital platformlar üzerinden içerik ve tekrar desteği sağlanır."
    },
    {
      icon: <Users size={28} />,
      title: "Bireysel Mentorluk & Rehberlik",
      text: "Her öğrenciye özel mentor atanarak akademik ve motivasyonel süreçler düzenli takip edilir."
    },
    {
      icon: <Trophy size={28} />,
      title: "Sınav Odaklı Eğitim Sistemi",
      text: "TYT–AYT müfredatına uygun, güncel ve ölçme-değerlendirme temelli eğitim programı uygulanır."
    },
    {
      icon: <BarChart3 size={28} />,
      title: "Deneme Sınavları & Net Analizi",
      text: "Haftalık deneme sınavlarıyla net artışı, konu bazlı gelişim ve eksikler detaylı analiz edilir."
    },
    {
      icon: <ClipboardCheck size={28} />,
      title: "Disiplin & Devam Takibi",
      text: "Öğrencinin derslere katılımı, etüt durumu ve devamsızlıkları düzenli olarak kontrol edilir."
    },
    {
      icon: <MessageSquare size={28} />,
      title: "Şeffaf Veli Bilgilendirme",
      text: "Veliler; deneme sonuçları, akademik ilerleme ve genel süreç hakkında düzenli bilgilendirilir."
    },
    {
      icon: <Library size={28} />,
      title: "Sessiz Etüt & Kütüphane Alanı",
      text: "Odaklanmayı artıran sessiz etüt ortamı ve kaynak desteği ile verimli çalışma imkânı sunulur."
    },
    {
      icon: <Layers size={28} />,
      title: "Küçük Gruplarla Eğitim",
      text: "Sınıflar kontrollü sayıda tutulur, böylece her öğrenciyle birebir ilgilenme sağlanır."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-800/50">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-12"
          >
            <Image src={AlfLogo} alt="Alf Kurs Merkezi Logo" width={180} height={180} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
          >
            Ne Sunuyoruz?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300"
          >
            Anadolu Fen Bilimleri Özel Öğretim Kursu, öğrencinin akademik başarısını disiplinli takip, 
            güçlü analiz ve şeffaf veli iletişimi ile destekleyen modern bir eğitim anlayışı sunar.
          </motion.p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="h-full p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50 transition-all duration-300 hover:border-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/5">
                <div className="w-14 h-14 mb-6 rounded-xl bg-slate-800/50 flex items-center justify-center text-yellow-500">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-yellow-500 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {item.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
