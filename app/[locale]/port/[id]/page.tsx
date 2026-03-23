"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useParams } from "next/navigation";
import { useRouter } from "@/routing";
import Swal from "@/lib/swal-toast";
import Image from "next/image";
import R2Image from "@/components/R2Image";
import { ArrowLeft, ArrowRight, Target, Package, Info } from "lucide-react";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";

type TemplateDetail = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  canva_link?: string | null;
  download_link?: string | null;
  template_type?: string[];
  thumbnails?: string[];
  preview?: string;
};

const BuyPortfolioPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string; locale: string }>();
  const templateId = params?.id;

  const carouselRef = useRef<HTMLDivElement>(null);
  const [selectedPage, setSelectedPage] = useState(0);
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) return;
      try {
        const res = await fetch(`/api/db/templates?id=${templateId}`);
        const data = await res.json();
        if (data && !data.error) {
          const mapBadges = Array.isArray(data.template_type)
            ? data.template_type
            : Array.isArray(data.template_type?.array)
            ? data.template_type.array
            : [];

          setTemplate({
            id: data.id,
            name: data.template_name,
            description: data.description,
            price: Number(data.price) || 0,
            canva_link: data.canva_link,
            download_link: data.download_link,
            template_type: mapBadges,
            thumbnails: Array.isArray(data.thumbnail_images) ? data.thumbnail_images : [],
            preview: data.preview_image_url,
          });
        }
      } catch (error) {
        console.error("Error loading template", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  const pages = useMemo(() => {
    const list = template?.thumbnails?.length
      ? template.thumbnails
      : template?.preview
      ? [template.preview]
      : [];
    return list.map((src, index) => ({
      label: `Page ${index + 1}`,
      src,
    }));
  }, [template]);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 200;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleBuy = async () => {
    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเข้าสู่ระบบ",
        text: "คุณต้องเข้าสู่ระบบก่อนซื้อเทมเพลต",
        confirmButtonText: "เข้าสู่ระบบ",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/login");
        }
      });
      return;
    }

    try {
      // Save purchase to API
      const res = await fetch("/api/db/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_name: template?.name,
          template_type: "Canva, PPTX",
          price: template?.price || 0,
          canva_link: template?.canva_link,
          download_link: template?.download_link,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        console.error("Error saving purchase:", data.error);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถบันทึกการซื้อได้",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "ซื้อสำเร็จ",
        html: `
          <p>ขอบคุณที่ซื้อเทมเพลต ${template?.name || ""}</p>
          <p class="mt-2">ลิงก์เทมเพลตถูกบันทึกไว้ในโปรไฟล์ของคุณแล้ว</p>
        `,
        confirmButtonText: "ไปที่โปรไฟล์",
        showCancelButton: true,
        cancelButtonText: "ปิด",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/profile");
        }
      });
    } catch (err) {
      console.error("Error:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "กรุณาลองใหม่อีกครั้ง",
      });
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!template) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-600">
        ไม่พบเทมเพลตนี้
      </div>
    );
  }

  return (
    
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
      {/* Left: Preview Image */}
      <div className="flex flex-col items-center space-y-4">
        <R2Image
          src={(pages[selectedPage] || pages[0])?.src || "/port/1.jpg"}
          alt={(pages[selectedPage] || pages[0])?.label || template.name}
          width={500}
          height={700}
          className="rounded-lg shadow-md object-contain"
        />
        <div className="relative w-full">
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow px-2 py-1 rounded-full z-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div
            ref={carouselRef}
            className="overflow-x-auto flex gap-3 pt-2 pb-1 px-8 scrollbar-hide scroll-smooth"
          >
            {pages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4 w-full">
                ไม่มีรูปตัวอย่าง
              </div>
            ) : (
              pages.map((page, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPage(index)}
                  className={`flex-shrink-0 w-24 border-2 rounded-lg overflow-hidden ${
                    selectedPage === index
                      ? "border-pink-500"
                      : "border-transparent"
                  }`}
                >
                  <R2Image
                    src={page.src}
                    alt={page.label}
                    width={100}
                    height={150}
                    className="object-cover"
                  />
                  <p className="text-center text-xs font-medium py-1">
                    {page.label}
                  </p>
                </button>
              ))
            )}
          </div>

          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow px-2 py-1 rounded-full z-10"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Right: Detail + Buy */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-pink-600">{template.name}</h1>
        {template.description && (
          <p className="text-gray-600 text-sm whitespace-pre-line">{template.description}</p>
        )}
        <h1 className="text-xl flex items-center gap-2">
          <Target className="w-5 h-5 text-pink-600" />
          เหมาะกับใคร?
        </h1>
        <hr />
        <ul className="ml-2 md:ml-4 list-disc whitespace-pre-wrap">
          <li>เทมเพลต Portfolioนี้ออกแบบมาให้ใช้ได้กับทุกคณะ</li>
          <li>เหมาะสำหรับนักเรียนที่ต้องการ ประหยัดเวลา แต่ยังได้</li>
          <li>
            ดีไซน์สวยงามระดับมืออาชีพ ใช้งานได้ทั้งในระบบ TCAS รอบ Portfolio
          </li>
          <li>
            (รอบที่ 1), การสมัครงาน, ส่งเอกสารฝึกงาน หรือ portfolio ทั่วไป
          </li>
          <li>
            รองรับทุกอุปกรณ์ เช่น คอมพิวเตอร์, โน้ตบุ๊ก, มือถือ, แท็บเล็ต และ
            iPad
          </li>
          <li>สามารถใช้งานผ่านเว็บไซต์หรือแอปพลิเคชัน Canva</li>
          <li>ได้แบบออนไลน์ 100%</li>
        </ul>
        <h1 className="mt-4 text-xl flex items-center gap-2">
          <Package className="w-5 h-5 text-pink-600" />
          สิ่งที่จะได้รับ
        </h1>
        <hr />
        <ul className="ml-2 md:ml-4 list-disc whitespace-pre-wrap">
          <li>ใช้งานได้ฟรีใน Canva</li>
          <li>
            วิธีใช้เพียงแค่ใส่รูป + ข้อความของคุณลงในเทมเพลต
            ปรับแต่งกราฟิกเพิ่มเติมได้ตามใจ
          </li>
          <li>
            แชร์ออนไลน์ผ่านลิงก์, แปลงเป็น PDF หรือสั่งพิมพ์เป็นรูปเล่มก็ได้
          </li>
        </ul>
        <h1 className="mt-4 text-xl flex items-center gap-2">
          <Info className="w-5 h-5 text-pink-600" />
          หมายเหตุ:
        </h1>
        <hr />
        <ul className="ml-2 md:ml-4 list-disc whitespace-pre-wrap">
          <li>
            ลิงก์เทมเพลตจะถูกส่งเข้าในประวัติการสั่งซื้อ{" "}
            <Link href={"/profile"} className="text-pink-600 hover:underline">
              หน้าโปรไฟล์
            </Link>
          </li>
          <li>ลิงก์ Canva ใช้งานได้ตลอดชีพบน ID ของคุณ</li>
          <li>หากมีคำถามติดต่อทีมงาน Doodee ได้ที่ Line: @doodee</li>
        </ul>
        <hr />
        <div className="text-2xl font-semibold text-pink-700 flex justify-between">
          <span className="font-medium text-gray-800">ราคาเพียง</span>
          {template.price === 0 ? "ฟรี" : `฿${template.price}`}
        </div>
        <button
          onClick={handleBuy}
          className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-3 rounded-lg transition w-full"
        >
          ซื้อเทมเพลตนี้
        </button>
      </div>
      </div>
    
  );
};

export default BuyPortfolioPage;
