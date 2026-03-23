"use client";
import { useState, useEffect, useMemo } from "react";
import { Search, Users, Shield, User, Crown, Star, ChevronUp, ChevronDown, Filter, X, Pencil, School } from "lucide-react";
import Image from "next/image";
import Swal from "@/lib/swal-toast";

interface UserData {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
  role: string | null;
  current_points: number;
  total_points: number;
  referral_code: string;
  created_at: string;
  updated_at: string;
}

const ROLES = [
  { value: "user", label: "User", icon: User, color: "bg-gray-100 text-gray-600" },
  { value: "moderator", label: "Moderator", icon: Star, color: "bg-blue-100 text-blue-600" },
  { value: "act_admin", label: "ACT Admin", icon: School, color: "bg-red-100 text-red-600" },
  { value: "admin", label: "Admin", icon: Shield, color: "bg-purple-100 text-purple-600" },
  { value: "superadmin", label: "Super Admin", icon: Crown, color: "bg-yellow-100 text-yellow-600" },
];

type SortField = 'full_name' | 'username' | 'email' | 'current_points' | 'role' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterRole, setFilterRole] = useState<string | null>(null);

  // Check if current user can change roles (admin/superadmin only)
  const canChangeRoles = currentRole === 'admin' || currentRole === 'superadmin';

  // Check if current user can edit a specific target user's role
  const canEditUser = (targetRole: string) => {
    if (currentRole === 'superadmin') return targetRole !== 'superadmin';
    if (currentRole === 'admin') return targetRole !== 'superadmin' && targetRole !== 'admin';
    return false;
  };

  // Get available roles current user can assign
  const getAssignableRoles = () => {
    if (currentRole === 'superadmin') return ROLES.filter(r => r.value !== 'superadmin');
    if (currentRole === 'admin') return ROLES.filter(r => r.value !== 'admin' && r.value !== 'superadmin');
    return [];
  };

  // Normalize role - treat null/undefined/empty as "user"
  const normalizeRole = (role: string | null | undefined): string => {
    if (!role || role === '' || role === 'member') return 'user';
    return role;
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/users${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""}`);
      const data = await res.json();
      if (data.error) {
        console.error(data.error);
        return;
      }
      setUsers(data.data || []);
      if (data.currentRole) {
        setCurrentRole(data.currentRole);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  // Sort and filter users
  const sortedAndFilteredUsers = useMemo(() => {
    let result = [...users];

    // Apply role filter
    if (filterRole) {
      result = result.filter(u => normalizeRole(u.role) === filterRole);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'full_name':
          aValue = a.full_name || a.email || '';
          bValue = b.full_name || b.email || '';
          break;
        case 'username':
          aValue = a.username || '';
          bValue = b.username || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'current_points':
          aValue = a.current_points || 0;
          bValue = b.current_points || 0;
          break;
        case 'role':
          const roleOrder = { superadmin: 0, admin: 1, act_admin: 2, moderator: 3, user: 4 };
          aValue = roleOrder[normalizeRole(a.role) as keyof typeof roleOrder] ?? 3;
          bValue = roleOrder[normalizeRole(b.role) as keyof typeof roleOrder] ?? 3;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue, 'th')
          : bValue.localeCompare(aValue, 'th');
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return result;
  }, [users, sortField, sortOrder, filterRole]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-300" />;
    }
    return sortOrder === 'asc'
      ? <ChevronUp className="w-4 h-4 text-pink-500" />
      : <ChevronDown className="w-4 h-4 text-pink-500" />;
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole }),
      });

      const data = await res.json();
      if (data.error) {
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: data.error });
        return;
      }

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setEditingUser(null);
      Swal.fire({ icon: "success", title: "อัปเดตสำเร็จ", timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error("Error updating role:", error);
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด" });
    }
  };

  const handleEditPoints = async (user: UserData) => {
    const { value: formValues } = await Swal.fire({
      title: `แก้ไข Points - ${user.full_name || user.username}`,
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Current Points (ใช้ได้)</label>
            <input id="current_points" type="number" value="${user.current_points || 0}"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Total Points (สะสมทั้งหมด)</label>
            <input id="total_points" type="number" value="${user.total_points || 0}"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ec4899",
      preConfirm: () => {
        const currentPoints = parseInt((document.getElementById("current_points") as HTMLInputElement).value) || 0;
        const totalPoints = parseInt((document.getElementById("total_points") as HTMLInputElement).value) || 0;
        return { current_points: currentPoints, total_points: totalPoints };
      },
    });

    if (formValues) {
      try {
        const res = await fetch("/api/admin/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: user.id,
            current_points: formValues.current_points,
            total_points: formValues.total_points,
          }),
        });

        const data = await res.json();
        if (data.error) {
          Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: data.error });
          return;
        }

        setUsers(users.map(u =>
          u.id === user.id
            ? { ...u, current_points: formValues.current_points, total_points: formValues.total_points }
            : u
        ));
        Swal.fire({ icon: "success", title: "อัปเดต Points สำเร็จ", timer: 1500, showConfirmButton: false });
      } catch (error) {
        console.error("Error updating points:", error);
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด" });
      }
    }
  };

  const getRoleInfo = (role: string | null) => {
    const normalized = normalizeRole(role);
    return ROLES.find(r => r.value === normalized) || ROLES[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Count users by role (normalize null/member to user)
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { user: 0, moderator: 0, act_admin: 0, admin: 0, superadmin: 0 };
    users.forEach(u => {
      const role = normalizeRole(u.role);
      counts[role] = (counts[role] || 0) + 1;
    });
    return counts;
  }, [users]);

  return (
    
      <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-pink-500" />
            จัดการผู้ใช้งาน
          </h1>
          <p className="text-gray-500">ดูรายชื่อและปรับ Rank ผู้ใช้งาน ({users.length} คน)</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วย email, username หรือชื่อ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterRole || ''}
              onChange={(e) => setFilterRole(e.target.value || null)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">ทุก Role</option>
              {ROLES.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label} ({roleCounts[role.value] || 0})
                </option>
              ))}
            </select>
            {filterRole && (
              <button
                onClick={() => setFilterRole(null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-4 mb-6">
        {ROLES.map(role => {
          const count = roleCounts[role.value] || 0;
          const Icon = role.icon;
          const isActive = filterRole === role.value;
          return (
            <button
              key={role.value}
              onClick={() => setFilterRole(isActive ? null : role.value)}
              className={`bg-white rounded-xl p-4 shadow-sm border transition-all hover:shadow-md ${
                isActive ? 'border-pink-400 ring-2 ring-pink-200' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${role.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="truncate text-xs text-gray-500">{role.label}</p>
                  <p className="text-xl font-bold text-gray-800">{count}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Users List */}
      {loading ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : sortedAndFilteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm border border-gray-100">
          {searchTerm || filterRole ? "ไม่พบผู้ใช้ที่ค้นหา" : "ยังไม่มีผู้ใช้งาน"}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th
                    className="text-left px-4 py-3 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('full_name')}
                  >
                    <div className="flex items-center gap-1">
                      ผู้ใช้ <SortIcon field="full_name" />
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-3 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('username')}
                  >
                    <div className="flex items-center gap-1">
                      Username <SortIcon field="username" />
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Referral</th>
                  <th
                    className="text-left px-4 py-3 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('current_points')}
                  >
                    <div className="flex items-center gap-1">
                      แต้ม <SortIcon field="current_points" />
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-3 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center gap-1">
                      Rank <SortIcon field="role" />
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-3 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      สมัครเมื่อ <SortIcon field="created_at" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedAndFilteredUsers.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  const RoleIcon = roleInfo.icon;
                  const normalizedRole = normalizeRole(user.role);

                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user.profile_image_url ? (
                            <Image
                              src={user.profile_image_url}
                              alt={user.full_name || user.email}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-pink-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {user.full_name || "-"}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">@{user.username}</span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {user.referral_code}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-pink-600 font-medium">
                            {user.current_points?.toLocaleString() || 0}
                          </span>
                          {canChangeRoles && (
                            <button
                              onClick={() => handleEditPoints(user)}
                              className="p-1 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded transition-colors"
                              title="แก้ไข Points"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingUser === user.id && canChangeRoles ? (
                          <select
                            value={normalizedRole}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            onBlur={() => setEditingUser(null)}
                            autoFocus
                            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-pink-500"
                          >
                            {getAssignableRoles().map(role => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        ) : canEditUser(normalizedRole) ? (
                          <button
                            onClick={() => setEditingUser(user.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleInfo.color} hover:opacity-80 transition-opacity cursor-pointer`}
                          >
                            <RoleIcon className="w-3.5 h-3.5" />
                            {roleInfo.label}
                          </button>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                            <RoleIcon className="w-3.5 h-3.5" />
                            {roleInfo.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    
  );
}
