"use client";
import { useState } from "react";
import Swal from "@/lib/swal-toast";
import { BadgeCheck, FileBarChart2, Save, GraduationCap, ShoppingCart } from "lucide-react";

const features = [
  {
    name: "วิเคราะห์เกียรติบัตร (AI)",
    price: 20, // เดิม 100 บาท → 20 เครดิต
    icon: <BadgeCheck className="w-5 h-5 text-pink-500 mr-2" />,
    key: "ai",
  },
  {
    name: "บันทึกข้อมูลผลลัพธ์",
    price: 10, // เดิม 60 บาท → 10 เครดิต
    icon: <Save className="w-5 h-5 text-pink-500 mr-2" />,
    key: "save",
  },
  {
    name: "วิเคราะห์เกียรติบัตร (ทั่วไป)",
    price: 10, // เดิม 60 บาท → 10 เครดิต
    icon: <FileBarChart2 className="w-5 h-5 text-pink-500 mr-2" />,
    key: "basic",
  },
  {
    name: "แนะนำแนวทางการเรียน",
    price: 20, // เดิม 60 บาท → 20 เครดิต
    icon: <GraduationCap className="w-5 h-5 text-pink-500 mr-2" />,
    key: "guidance",
  },
];

const FeaturePurchase = () => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleFeature = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const totalPrice = selected.reduce((sum, key) => {
    const found = features.find((f) => f.key === key);
    return sum + (found?.price || 0);
  }, 0);

  const handlePurchase = () => {
    Swal.fire({
      icon: "success",
      title: "ยืนยันการสั่งซื้อ",
      text: `คุณได้ซื้อฟีเจอร์จำนวน ${selected.length} รายการ รวม ${totalPrice} เครดิต`,
      confirmButtonText: "ตกลง",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-6 w-full">
      <h2 className="text-xl font-bold mb-4 text-pink-600">
        <ShoppingCart className="inline-block h-6 w-6 mr-2" /> ซื้อฟีเจอร์เสริม{" "}
        <small className="ml-1 text-base text-gray-500 font-medium">
          (ใช้งานได้ 30 วัน)
        </small>
      </h2>
      <div className="flex flex-wrap gap-4">
        {features.map((feature) => (
          <label
            key={feature.key}
            className="flex items-center border rounded-lg px-4 py-3 cursor-pointer w-full sm:w-auto min-w-[250px] hover:shadow transition"
          >
            <input
              type="checkbox"
              checked={selected.includes(feature.key)}
              onChange={() => toggleFeature(feature.key)}
              className="accent-pink-500 mr-3"
            />
            {feature.icon}
            <div>
              <div className="font-medium">{feature.name}</div>
              <div className="text-sm text-gray-500">{feature.price} เครดิต</div>
            </div>
          </label>
        ))}
      </div>

      <div className="flex justify-between items-center mt-6">
        <div className="text-lg font-bold text-gray-700">
          รวม: <span className="text-pink-600">{totalPrice} เครดิต</span>
        </div>
        <button
          onClick={handlePurchase}
          disabled={selected.length === 0}
          className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-2 rounded-lg disabled:opacity-50"
        >
          ยืนยันการสั่งซื้อ
        </button>
      </div>
    </div>
  );
};

export default FeaturePurchase;
