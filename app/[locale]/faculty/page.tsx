"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "@/routing";
import {
  Search,
  Check,
  Heart,
  BookOpen,
  GraduationCap,
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  ChevronDown,
  X,
  ExternalLink,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useLocale } from "next-intl";
import { showToast } from "@/lib/toast";
import Image from "next/image";

interface Program {
  id: number;
  university_id: string;
  university_type_name_th: string;
  university_name_th: string;
  university_name_en: string;
  campus_id: string;
  campus_name_th: string;
  campus_name_en: string;
  faculty_id: string;
  faculty_name_th: string;
  faculty_name_en: string;
  group_field_id: string;
  group_field_th: string;
  field_id: string;
  field_name_th: string;
  field_name_en: string;
  program_name_th: string;
  program_name_en: string;
  program_type_name_th: string;
  program_id: string;
  program_partners_inter_name: string;
  country_partners_name: string;
  program_total_seats: number;
  r1_admission_quota: number;
  graduate_rate: string;
  employment_rate: string;
  median_salary: string;
  logo_url: string;
}

interface University {
  university_id: string;
  university_name_th: string;
  university_name_en: string;
  logo_url: string;
}

export default function FacultySelectionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const isEn = locale === "en";

  const [programs, setPrograms] = useState<Program[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // University dropdown state
  const [uniDropdownOpen, setUniDropdownOpen] = useState(false);
  const [uniSearchQuery, setUniSearchQuery] = useState("");
  const uniDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        uniDropdownRef.current &&
        !uniDropdownRef.current.contains(event.target as Node)
      ) {
        setUniDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter universities based on search
  const filteredUniversities = universities.filter(
    (uni) =>
      uni.university_name_th
        ?.toLowerCase()
        .includes(uniSearchQuery.toLowerCase()) ||
      uni.university_name_en
        ?.toLowerCase()
        .includes(uniSearchQuery.toLowerCase()),
  );

  const getUniversityName = (item: {
    university_name_th?: string;
    university_name_en?: string;
  }) =>
    isEn
      ? item.university_name_en || item.university_name_th || ""
      : item.university_name_th || item.university_name_en || "";

  const getProgramName = (program: Program) =>
    isEn
      ? program.program_name_en ||
        program.program_name_th ||
        program.field_name_en ||
        program.field_name_th ||
        program.faculty_name_en ||
        program.faculty_name_th ||
        ""
      : program.program_name_th ||
        program.program_name_en ||
        program.field_name_th ||
        program.field_name_en ||
        program.faculty_name_th ||
        program.faculty_name_en ||
        "";

  const getFacultyName = (program: Program) =>
    isEn
      ? program.faculty_name_en || program.faculty_name_th || ""
      : program.faculty_name_th || program.faculty_name_en || "";

  const getCampusName = (program: Program) =>
    isEn
      ? program.campus_name_en || program.campus_name_th || ""
      : program.campus_name_th || program.campus_name_en || "";

  const selectedUniName =
    selectedUniversity === "all"
      ? `${isEn ? "All Universities" : "ทุกมหาวิทยาลัย"} (${universities.length})`
      : getUniversityName(
          universities.find((u) => u.university_id === selectedUniversity) ||
            {},
        );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch programs and universities
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch universities list
        const uniRes = await fetch("/api/db/programs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_universities" }),
        });
        const uniData = await uniRes.json();
        if (uniRes.ok) {
          setUniversities(uniData || []);
        }

        // Fetch all programs
        const programsRes = await fetch("/api/db/programs");
        const programsData = await programsRes.json();

        if (!programsRes.ok) throw new Error(programsData.error);
        setPrograms(programsData || []);

        // Fetch user's selected programs (from interested faculties)
        const selectedRes = await fetch(
          `/api/db/interested-faculties?user_id=${user.id}`,
        );
        const selectedData = await selectedRes.json();

        if (selectedRes.ok && Array.isArray(selectedData)) {
          const selectedIds =
            selectedData.map((item: any) => item.program_id) || [];
          setSelectedPrograms(selectedIds);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        showToast.error(
          isEn
            ? "Unable to load program data"
            : "ไม่สามารถโหลดข้อมูลหลักสูตรได้",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleToggleProgram = async (programId: number) => {
    if (!user) return;

    const isSelected = selectedPrograms.includes(programId);

    try {
      if (isSelected) {
        // Remove from selection
        const res = await fetch(
          `/api/db/interested-faculties?program_id=${programId}`,
          {
            method: "DELETE",
          },
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setSelectedPrograms(selectedPrograms.filter((id) => id !== programId));
      } else {
        // Add to selection
        const res = await fetch("/api/db/interested-faculties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            program_id: programId,
            priority: selectedPrograms.length + 1,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setSelectedPrograms([...selectedPrograms, programId]);
      }
    } catch (error) {
      console.error("Error toggling program:", error);
      showToast.error(
        isEn ? "Unable to save selection" : "ไม่สามารถบันทึกข้อมูลได้",
      );
    }
  };

  const handleSaveAndContinue = () => {
    if (selectedPrograms.length === 0) {
      showToast.warning(
        isEn
          ? "Please select at least 1 program"
          : "คุณต้องเลือกอย่างน้อย 1 หลักสูตรที่สนใจ",
      );
      return;
    }

    showToast.success(
      isEn
        ? `Saved! You selected ${selectedPrograms.length} programs`
        : `บันทึกสำเร็จ! คุณได้เลือก ${selectedPrograms.length} หลักสูตร`,
    );
    setTimeout(() => {
      router.push("/profile");
    }, 1000);
  };

  // Filter programs
  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      program.university_name_th
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      program.university_name_en
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      program.faculty_name_th
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      program.faculty_name_en
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      program.field_name_th
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      program.field_name_en
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      program.program_name_th
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      program.program_name_en
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesUniversity =
      selectedUniversity === "all" ||
      program.university_id === selectedUniversity;

    return matchesSearch && matchesUniversity;
  });

  if (authLoading || loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-7xl px-3 pb-40 pt-6 sm:px-4 sm:pt-10 sm:pb-32 lg:px-6 lg:pt-12 lg:pb-24 overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-pink-700 mb-2 flex items-center gap-2">
          <GraduationCap className="w-8 h-8" />
          {isEn ? "Dream Programs & Faculties" : "สาขาและคณะในฝัน"}
        </h1>
        <p className="text-gray-600">
          {isEn
            ? "Choose programs you are interested in to get insights and guidance"
            : "เลือกหลักสูตรที่คุณสนใจเพื่อรับข้อมูลและคำแนะนำ"}
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm flex-wrap">
          <div className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-semibold">
            {isEn ? "Selected" : "เลือกแล้ว"}: {selectedPrograms.length}{" "}
            {isEn ? "programs" : "หลักสูตร"}
          </div>
          <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            {isEn ? "Total" : "ทั้งหมด"}: {programs.length.toLocaleString()}{" "}
            {isEn ? "programs" : "หลักสูตร"}
          </div>
          <a
            href="https://course.mytcas.com/universities"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-blue-200 transition-colors"
          >
            <span>{isEn ? "Data from myTCAS" : "ข้อมูลจาก myTCAS"}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 rounded-2xl border border-pink-100/70 bg-white/90 p-3 shadow-md backdrop-blur sm:mb-8 sm:rounded-3xl sm:p-5 lg:p-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-4">
          {/* Search */}
          <div className="relative md:col-span-3">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 sm:h-5 sm:w-5" />
            <input
              type="text"
              placeholder={
                isEn
                  ? "Search programs, faculties, universities..."
                  : "ค้นหาหลักสูตร คณะ มหาวิทยาลัย..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 pl-10 pr-4 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-300 sm:h-12 sm:text-base"
            />
          </div>

          {/* University Filter - Searchable Dropdown */}
          <div className="relative md:col-span-2" ref={uniDropdownRef}>
            <button
              type="button"
              onClick={() => setUniDropdownOpen(!uniDropdownOpen)}
              className="flex h-11 w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 text-left text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-300 sm:h-12 sm:text-base"
            >
              <span className="truncate">{selectedUniName}</span>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${uniDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {uniDropdownOpen && (
              <div className="absolute z-[70] mt-2 max-h-80 w-full overflow-hidden rounded-xl border border-pink-100 bg-white shadow-xl">
                {/* Search Input */}
                <div className="sticky top-0 border-b border-gray-200 bg-white p-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={
                        isEn ? "Search universities..." : "ค้นหามหาวิทยาลัย..."
                      }
                      value={uniSearchQuery}
                      onChange={(e) => setUniSearchQuery(e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-8 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-300"
                      autoFocus
                    />
                    {uniSearchQuery && (
                      <button
                        onClick={() => setUniSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Options List */}
                <div className="max-h-60 overflow-y-auto">
                  {/* All Universities Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUniversity("all");
                      setUniDropdownOpen(false);
                      setUniSearchQuery("");
                    }}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-pink-50 ${
                      selectedUniversity === "all"
                        ? "bg-pink-100 text-pink-700"
                        : ""
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span>
                      {isEn ? "All Universities" : "ทุกมหาวิทยาลัย"} (
                      {universities.length})
                    </span>
                    {selectedUniversity === "all" && (
                      <Check className="w-4 h-4 ml-auto text-pink-600" />
                    )}
                  </button>

                  {/* Filtered Universities */}
                  {filteredUniversities.map((uni) => (
                    <button
                      key={uni.university_id}
                      type="button"
                      onClick={() => {
                        setSelectedUniversity(uni.university_id);
                        setUniDropdownOpen(false);
                        setUniSearchQuery("");
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-pink-50 ${
                        selectedUniversity === uni.university_id
                          ? "bg-pink-100 text-pink-700"
                          : ""
                      }`}
                    >
                      {uni.logo_url ? (
                        <Image
                          src={uni.logo_url}
                          alt={getUniversityName(uni)}
                          width={20}
                          height={20}
                          className="rounded-full object-contain"
                        />
                      ) : (
                        <Building2 className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="truncate">{getUniversityName(uni)}</span>
                      {selectedUniversity === uni.university_id && (
                        <Check className="w-4 h-4 ml-auto text-pink-600" />
                      )}
                    </button>
                  ))}

                  {filteredUniversities.length === 0 && (
                    <div className="px-4 py-3 text-gray-500 text-sm text-center">
                      {isEn
                        ? "No universities found"
                        : "ไม่พบมหาวิทยาลัยที่ค้นหา"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:gap-5 xl:grid-cols-3">
        {filteredPrograms.slice(0, 100).map((program) => {
          const isSelected = selectedPrograms.includes(program.id);

          return (
            <div
              key={program.id}
              onClick={() => handleToggleProgram(program.id)}
              className={`cursor-pointer rounded-2xl border bg-white/95 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5 ${
                isSelected
                  ? "border-pink-200 bg-pink-50/70 ring-2 ring-pink-500 shadow-md"
                  : "border-gray-100"
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex flex-1 items-start gap-3">
                  {/* University Logo */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full sm:h-12 sm:w-12">
                    {program.logo_url ? (
                      <Image
                        src={program.logo_url}
                        alt={getUniversityName(program)}
                        width={48}
                        height={48}
                        className="object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 truncate">
                        {getUniversityName(program)}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2">
                      {getProgramName(program)}
                    </h3>
                    <p className="text-xs text-pink-600 truncate">
                      {getFacultyName(program)}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex-shrink-0 rounded-full bg-pink-600 p-1 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="space-y-2.5 text-[11px] sm:text-xs">
                {/* Campus */}
                {getCampusName(program) && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate">{getCampusName(program)}</span>
                  </div>
                )}

                {/* Program Type */}
                {program.program_type_name_th && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700 sm:text-xs">
                      {program.program_type_name_th}
                    </span>
                  </div>
                )}

                {/* Total Seats */}
                {program.program_total_seats > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-gray-600">
                      {isEn
                        ? `Seats: ${program.program_total_seats}`
                        : `รับ ${program.program_total_seats} คน`}
                    </span>
                  </div>
                )}

                {/* TCAS Round 1 */}
                {program.r1_admission_quota > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
                      Portfolio: {program.r1_admission_quota}{" "}
                      {isEn ? "seats" : "คน"}
                    </span>
                  </div>
                )}

                {/* Employment Rate & Salary */}
                {(program.employment_rate || program.median_salary) && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2 sm:gap-3">
                    {program.employment_rate && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Briefcase className="w-3 h-3" />
                        <span>
                          {isEn
                            ? `Employment ${program.employment_rate}`
                            : `มีงาน ${program.employment_rate}`}
                        </span>
                      </div>
                    )}
                    {program.median_salary && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{program.median_salary}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredPrograms.length > 100 && (
        <div className="text-center py-4 text-gray-500">
          {isEn
            ? `Showing first 100 results from ${filteredPrograms.length.toLocaleString()} total`
            : `แสดง 100 รายการแรก จากทั้งหมด ${filteredPrograms.length.toLocaleString()} รายการ`}
          <br />
          <span className="text-sm">
            {isEn
              ? "Try searching or filtering by university to narrow results"
              : "ลองค้นหาหรือกรองตามมหาวิทยาลัยเพื่อดูรายการที่ต้องการ"}
          </span>
        </div>
      )}

      {filteredPrograms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {isEn
              ? "No programs matched your search"
              : "ไม่พบหลักสูตรที่ตรงกับการค้นหา"}
          </p>
        </div>
      )}

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-20 w-full max-w-2xl mx-auto lg:max-w-[100vw]  rounded-[15px] left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50 lg:bottom-0">
        <div className="mx-auto  px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-600" />
              <span className="font-semibold text-gray-800">
                {isEn
                  ? `Selected ${selectedPrograms.length} programs`
                  : `เลือกแล้ว ${selectedPrograms.length} หลักสูตร`}
              </span>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => router.push("/profile")}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors text-sm sm:text-base"
              >
                {isEn ? "Cancel" : "ยกเลิก"}
              </button>
              <button
                onClick={handleSaveAndContinue}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                {isEn ? "Save" : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
