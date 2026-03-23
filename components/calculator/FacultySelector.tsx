'use client';

import { useState, useEffect } from 'react';
import { Search, GraduationCap, Check, Loader2 } from 'lucide-react';

interface Faculty {
  id: string;
  nameTh: string;
  nameEn?: string;
  universityId?: string;
  universityNameTh?: string;
}

interface FacultySelectorProps {
  universityId?: string;
  selected: string | null;
  onSelect: (facultyId: string) => void;
  multiple?: boolean;
  selectedMultiple?: string[];
  onSelectMultiple?: (facultyIds: string[]) => void;
}

export default function FacultySelector({
  universityId,
  selected,
  onSelect,
  multiple = false,
  selectedMultiple = [],
  onSelectMultiple,
}: FacultySelectorProps) {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchFaculties = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (universityId) {
          params.set('universityId', universityId);
        }

        const res = await fetch(`/api/calculator/faculties?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setFaculties(data.data);
        }
      } catch (error) {
        console.error('Error fetching faculties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaculties();
  }, [universityId]);

  const filteredFaculties = faculties.filter(f =>
    f.nameTh?.toLowerCase().includes(search.toLowerCase()) ||
    f.nameEn?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: string) => {
    if (multiple && onSelectMultiple) {
      if (selectedMultiple.includes(id)) {
        onSelectMultiple(selectedMultiple.filter(f => f !== id));
      } else {
        onSelectMultiple([...selectedMultiple, id]);
      }
    } else {
      onSelect(id);
    }
  };

  const isSelected = (id: string) => {
    if (multiple) {
      return selectedMultiple.includes(id);
    }
    return selected === id;
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {multiple ? 'เลือกคณะ/สาขา (หลายรายการ)' : 'เลือกคณะ/สาขา'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {multiple
            ? 'เลือกคณะ/สาขาที่ต้องการเปรียบเทียบ'
            : 'เลือกคณะ/สาขาที่ต้องการคำนวณ'}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหาคณะ/สาขา..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400"
        />
      </div>

      {/* Selected count for multiple */}
      {multiple && selectedMultiple.length > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-lg px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-pink-700">
            เลือกแล้ว {selectedMultiple.length} รายการ
          </span>
          <button
            onClick={() => onSelectMultiple?.([])}
            className="text-sm text-pink-600 hover:text-pink-800 underline"
          >
            ล้างทั้งหมด
          </button>
        </div>
      )}

      {/* Faculty list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {filteredFaculties.map((faculty) => (
            <button
              key={`${faculty.universityId}-${faculty.id}`}
              onClick={() => handleSelect(faculty.id)}
              className={`
                w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all
                ${isSelected(faculty.id)
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{faculty.nameTh}</p>
                {faculty.universityNameTh && !universityId && (
                  <p className="text-xs text-gray-500 truncate">{faculty.universityNameTh}</p>
                )}
              </div>
              {isSelected(faculty.id) && (
                <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}

          {filteredFaculties.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              ไม่พบคณะ/สาขาที่ตรงกับการค้นหา
            </div>
          )}
        </div>
      )}
    </div>
  );
}
