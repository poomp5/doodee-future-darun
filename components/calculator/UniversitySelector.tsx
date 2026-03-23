'use client';

import { useState, useEffect } from 'react';
import { Search, Building2, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface University {
  id: string;
  nameTh: string;
  nameEn?: string;
  logoUrl?: string;
}

interface UniversitySelectorProps {
  selected: string | null;
  onSelect: (universityId: string) => void;
  multiple?: boolean;
  selectedMultiple?: string[];
  onSelectMultiple?: (universityIds: string[]) => void;
}

export default function UniversitySelector({
  selected,
  onSelect,
  multiple = false,
  selectedMultiple = [],
  onSelectMultiple,
}: UniversitySelectorProps) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const res = await fetch('/api/calculator/universities');
        const data = await res.json();
        if (data.success) {
          setUniversities(data.data);
        }
      } catch (error) {
        console.error('Error fetching universities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, []);

  const filteredUniversities = universities.filter(u =>
    u.nameTh?.toLowerCase().includes(search.toLowerCase()) ||
    u.nameEn?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: string) => {
    if (multiple && onSelectMultiple) {
      if (selectedMultiple.includes(id)) {
        onSelectMultiple(selectedMultiple.filter(u => u !== id));
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
          {multiple ? 'เลือกมหาวิทยาลัย (หลายแห่ง)' : 'เลือกมหาวิทยาลัย'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {multiple
            ? 'เลือกมหาวิทยาลัยที่ต้องการเปรียบเทียบ'
            : 'เลือกมหาวิทยาลัยที่ต้องการดูคะแนน'}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหามหาวิทยาลัย..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400"
        />
      </div>

      {/* Selected count for multiple */}
      {multiple && selectedMultiple.length > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-lg px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-pink-700">
            เลือกแล้ว {selectedMultiple.length} มหาวิทยาลัย
          </span>
          <button
            onClick={() => onSelectMultiple?.([])}
            className="text-sm text-pink-600 hover:text-pink-800 underline"
          >
            ล้างทั้งหมด
          </button>
        </div>
      )}

      {/* University list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
          {filteredUniversities.map((uni) => (
            <button
              key={uni.id}
              onClick={() => handleSelect(uni.id)}
              className={`
                flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all
                ${isSelected(uni.id)
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {uni.logoUrl ? (
                  <Image
                    src={uni.logoUrl}
                    alt={uni.nameTh}
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{uni.nameTh}</p>
                {uni.nameEn && (
                  <p className="text-xs text-gray-500 truncate">{uni.nameEn}</p>
                )}
              </div>
              {isSelected(uni.id) && (
                <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}

          {filteredUniversities.length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-500">
              ไม่พบมหาวิทยาลัยที่ตรงกับการค้นหา
            </div>
          )}
        </div>
      )}
    </div>
  );
}
