"use client";
import { useState, useEffect } from "react";
import { Link } from "@/routing";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Gift,
  ExternalLink,
  FileText,
  MessageSquare,
} from "lucide-react";
import Swal from "@/lib/swal-toast";

interface PointsReward {
  id: number;
  title: string;
  description: string;
  image_url: string;
  icon: string;
  points_cost: number;
  reward_type: string;
  reward_value: string;
  stock: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export default function PointsRewardsPage() {
  const [rewards, setRewards] = useState<PointsReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/db/points-rewards");
      const data = await res.json();
      setRewards(data.data || []);
    } catch (error) {
      console.error("Error fetching rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleDelete = async (id: number, title: string) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: `คุณต้องการลบ "${title}" ใช่หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/db/points-rewards?id=${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          Swal.fire({
            icon: "success",
            title: "ลบสำเร็จ",
            timer: 1500,
            showConfirmButton: false,
          });
          fetchRewards();
        } else {
          throw new Error("Delete failed");
        }
      } catch (error) {
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด" });
      }
    }
  };

  const handleToggleActive = async (reward: PointsReward) => {
    try {
      const res = await fetch("/api/db/points-rewards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reward.id,
          is_active: !reward.is_active,
        }),
      });

      if (res.ok) {
        fetchRewards();
      }
    } catch (error) {
      console.error("Error toggling active:", error);
    }
  };

  const filteredRewards = rewards.filter(
    (reward) =>
      reward.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reward.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case "link":
        return <ExternalLink className="w-4 h-4" />;
      case "pdf":
        return <FileText className="w-4 h-4" />;
      case "message":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case "link":
        return "ลิงก์";
      case "pdf":
        return "PDF";
      case "message":
        return "ข้อความ";
      default:
        return type;
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Gift className="w-7 h-7 text-pink-500" />
            ของรางวัลแลก Points
          </h1>
          <p className="text-gray-500 mt-1">
            จัดการของรางวัลที่ผู้ใช้สามารถแลกด้วย Points
          </p>
        </div>
        <Link
          href="/admin/points-rewards/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          <span>เพิ่มของรางวัล</span>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาของรางวัล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
          />
        </div>
      </div>

      {/* Rewards List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse"
            >
              <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredRewards.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">ยังไม่มีของรางวัล</p>
          <Link
            href="/admin/points-rewards/new"
            className="inline-flex items-center gap-2 mt-4 text-pink-500 hover:text-pink-600"
          >
            <Plus className="w-4 h-4" />
            เพิ่มของรางวัลใหม่
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRewards.map((reward) => (
            <div
              key={reward.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                reward.is_active
                  ? "border-gray-100"
                  : "border-gray-200 opacity-60"
              }`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                      <Gift className="w-6 h-6 text-pink-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 line-clamp-1">
                        {reward.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-pink-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                          {reward.points_cost} Points
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          {getRewardTypeIcon(reward.reward_type)}
                          {getRewardTypeLabel(reward.reward_type)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {reward.description || "ไม่มีคำอธิบาย"}
                </p>

                {/* Stock */}
                {reward.stock !== null && (
                  <p className="text-xs text-gray-400 mb-3">
                    คงเหลือ: <span className="font-semibold text-gray-600">{reward.stock}</span> ชิ้น
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleActive(reward)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        reward.is_active ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          reward.is_active ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <span className={`text-sm font-medium ${reward.is_active ? "text-green-600" : "text-gray-400"}`}>
                      {reward.is_active ? "เปิด" : "ปิด"}
                    </span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/points-rewards/${reward.id}`}
                      className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(reward.id, reward.title)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
