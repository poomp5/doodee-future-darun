"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Save,
  X,
  Layers,
  Monitor,
  Palette,
  Briefcase,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Mic2,
  Music,
  Dumbbell,
  Heart,
  Stethoscope,
  LucideIcon,
} from "lucide-react";
import Swal from "@/lib/swal-toast";
import LoadingSpinner from "@/components/LoadingSpinner";

// Available icons for category groups
const AVAILABLE_ICONS: Record<string, LucideIcon> = {
  Layers,
  Monitor,
  Palette,
  Briefcase,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Mic2,
  Music,
  Dumbbell,
  Heart,
  Stethoscope,
};

interface CategoryItem {
  id: number;
  group_key: string;
  value: string;
  label: string;
  display_order: number;
  is_active: boolean;
}

interface CategoryGroup {
  id: number;
  key: string;
  label: string;
  icon: string;
  display_order: number;
  is_active: boolean;
  items: CategoryItem[];
}

export default function CategoriesPage() {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Modal states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CategoryGroup | null>(null);
  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string>("");

  // Form states
  const [groupForm, setGroupForm] = useState({
    key: "",
    label: "",
    icon: "Layers",
    display_order: 0,
    is_active: true,
  });

  const [itemForm, setItemForm] = useState({
    group_key: "",
    value: "",
    label: "",
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/db/categories");
      const data = await res.json();
      setGroups(data.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };

  // Group CRUD
  const openGroupModal = (group?: CategoryGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupForm({
        key: group.key,
        label: group.label,
        icon: group.icon,
        display_order: group.display_order,
        is_active: group.is_active,
      });
    } else {
      setEditingGroup(null);
      setGroupForm({
        key: "",
        label: "",
        icon: "Layers",
        display_order: groups.length,
        is_active: true,
      });
    }
    setShowGroupModal(true);
  };

  const saveGroup = async () => {
    if (!groupForm.key || !groupForm.label) {
      Swal.fire({ icon: "error", title: "กรุณากรอก Key และ Label" });
      return;
    }

    try {
      if (editingGroup) {
        // Update
        await fetch("/api/db/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "group",
            id: editingGroup.id,
            ...groupForm,
          }),
        });
      } else {
        // Create
        await fetch("/api/db/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "group",
            ...groupForm,
          }),
        });
      }

      setShowGroupModal(false);
      fetchCategories();
      Swal.fire({
        icon: "success",
        title: editingGroup ? "แก้ไขสำเร็จ" : "เพิ่มสำเร็จ",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด" });
    }
  };

  const deleteGroup = async (group: CategoryGroup) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบ?",
      text: `ลบหมวดหมู่ "${group.label}" และหมวดย่อยทั้งหมด?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/db/categories?type=group&id=${group.id}`, {
          method: "DELETE",
        });
        fetchCategories();
        Swal.fire({
          icon: "success",
          title: "ลบสำเร็จ",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด" });
      }
    }
  };

  // Item CRUD
  const openItemModal = (groupKey: string, item?: CategoryItem) => {
    setSelectedGroupKey(groupKey);
    if (item) {
      setEditingItem(item);
      setItemForm({
        group_key: item.group_key,
        value: item.value,
        label: item.label,
        display_order: item.display_order,
        is_active: item.is_active,
      });
    } else {
      setEditingItem(null);
      const group = groups.find((g) => g.key === groupKey);
      setItemForm({
        group_key: groupKey,
        value: "",
        label: "",
        display_order: group?.items?.length || 0,
        is_active: true,
      });
    }
    setShowItemModal(true);
  };

  const saveItem = async () => {
    if (!itemForm.value || !itemForm.label) {
      Swal.fire({ icon: "error", title: "กรุณากรอก Value และ Label" });
      return;
    }

    try {
      if (editingItem) {
        // Update
        await fetch("/api/db/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "item",
            id: editingItem.id,
            ...itemForm,
          }),
        });
      } else {
        // Create
        await fetch("/api/db/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "item",
            ...itemForm,
          }),
        });
      }

      setShowItemModal(false);
      fetchCategories();
      Swal.fire({
        icon: "success",
        title: editingItem ? "แก้ไขสำเร็จ" : "เพิ่มสำเร็จ",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด" });
    }
  };

  const deleteItem = async (item: CategoryItem) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบ?",
      text: `ลบหมวดย่อย "${item.label}"?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/db/categories?type=item&id=${item.id}`, {
          method: "DELETE",
        });
        fetchCategories();
        Swal.fire({
          icon: "success",
          title: "ลบสำเร็จ",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด" });
      }
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = AVAILABLE_ICONS[iconName] || Layers;
    return <IconComponent className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    
      <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            จัดการหมวดหมู่
          </h1>
          <p className="text-gray-500">
            ทั้งหมด {groups.length} หมวดหลัก,{" "}
            {groups.reduce((acc, g) => acc + (g.items?.length || 0), 0)} หมวดย่อย
          </p>
        </div>
        <button
          onClick={() => openGroupModal()}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          <span>เพิ่มหมวดหลัก</span>
        </button>
      </div>

      {/* Category Groups List */}
      <div className="space-y-3">
        {groups.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm border border-gray-100">
            ยังไม่มีหมวดหมู่
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Group Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleGroup(group.key)}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-gray-300" />
                  {expandedGroups.has(group.key) ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <div
                    className={`p-2 rounded-lg ${
                      group.is_active
                        ? "bg-gradient-to-br from-pink-100 to-purple-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {getIcon(group.icon)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{group.label}</p>
                    <p className="text-sm text-gray-500">
                      {group.key} · {group.items?.length || 0} หมวดย่อย
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      group.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {group.is_active ? "เปิด" : "ปิด"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openGroupModal(group);
                    }}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteGroup(group);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Group Items */}
              {expandedGroups.has(group.key) && (
                <div className="border-t border-gray-100">
                  <div className="p-4 space-y-2">
                    {group.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-300" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {item.label}
                            </p>
                            <p className="text-xs text-gray-500">{item.value}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.is_active ? "เปิด" : "ปิด"}
                          </span>
                          <button
                            onClick={() => openItemModal(group.key, item)}
                            className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteItem(item)}
                            className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => openItemModal(group.key)}
                      className="flex items-center gap-2 w-full p-3 text-gray-500 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-colors border-2 border-dashed border-gray-200 hover:border-pink-300"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">เพิ่มหมวดย่อย</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingGroup ? "แก้ไขหมวดหลัก" : "เพิ่มหมวดหลัก"}
              </h2>
              <button
                onClick={() => setShowGroupModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={groupForm.key}
                  onChange={(e) =>
                    setGroupForm({
                      ...groupForm,
                      key: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                    })
                  }
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  placeholder="medical"
                  disabled={!!editingGroup}
                />
                <p className="text-xs text-gray-500 mt-1">
                  ใช้เป็นตัวอ้างอิงในระบบ (ไม่สามารถแก้ไขได้)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={groupForm.label}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, label: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  placeholder="ค่ายหมอ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {Object.entries(AVAILABLE_ICONS).map(([name, Icon]) => (
                    <button
                      key={name}
                      onClick={() => setGroupForm({ ...groupForm, icon: name })}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        groupForm.icon === name
                          ? "border-pink-500 bg-pink-50 text-pink-500"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      <Icon className="w-5 h-5 mx-auto" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ลำดับการแสดง
                </label>
                <input
                  type="number"
                  value={groupForm.display_order}
                  onChange={(e) =>
                    setGroupForm({
                      ...groupForm,
                      display_order: Number(e.target.value),
                    })
                  }
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  min={0}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="group_is_active"
                  checked={groupForm.is_active}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
                />
                <label
                  htmlFor="group_is_active"
                  className="text-sm text-gray-700"
                >
                  เปิดใช้งาน
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
              <button
                onClick={() => setShowGroupModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveGroup}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Save className="w-4 h-4" />
                <span>บันทึก</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingItem ? "แก้ไขหมวดย่อย" : "เพิ่มหมวดย่อย"}
              </h2>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={itemForm.value}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      value: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                    })
                  }
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  placeholder="med_doctor"
                  disabled={!!editingItem}
                />
                <p className="text-xs text-gray-500 mt-1">
                  ใช้เป็นตัวอ้างอิงในระบบ (ไม่สามารถแก้ไขได้)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={itemForm.label}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, label: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  placeholder="แพทย์"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ลำดับการแสดง
                </label>
                <input
                  type="number"
                  value={itemForm.display_order}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      display_order: Number(e.target.value),
                    })
                  }
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  min={0}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="item_is_active"
                  checked={itemForm.is_active}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
                />
                <label
                  htmlFor="item_is_active"
                  className="text-sm text-gray-700"
                >
                  เปิดใช้งาน
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
              <button
                onClick={() => setShowItemModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveItem}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Save className="w-4 h-4" />
                <span>บันทึก</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    
  );
}
