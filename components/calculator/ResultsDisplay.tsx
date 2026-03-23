'use client';

import { useState } from 'react';
import { BarChart3, Filter, Download, Share2 } from 'lucide-react';
import type { CalculationResult, ChanceLevel } from '@/types/tcas-calculator';
import ResultCard from './ResultCard';

interface ResultsDisplayProps {
  results: CalculationResult[];
  summary: {
    totalPrograms: number;
    highChance: number;
    mediumChance: number;
    lowChance: number;
  };
  onSave?: () => void;
}

export default function ResultsDisplay({ results, summary, onSave }: ResultsDisplayProps) {
  const [filter, setFilter] = useState<ChanceLevel | 'ALL'>('ALL');
  const [showDetails, setShowDetails] = useState(false);

  const filteredResults = results.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'HIGH' || filter === 'VERY_HIGH') {
      return r.chanceLevel === 'HIGH' || r.chanceLevel === 'VERY_HIGH';
    }
    if (filter === 'LOW' || filter === 'VERY_LOW') {
      return r.chanceLevel === 'LOW' || r.chanceLevel === 'VERY_LOW' || r.chanceLevel === 'UNKNOWN';
    }
    return r.chanceLevel === filter;
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">ผลการคำนวณ</h2>
        <p className="text-sm text-gray-500 mt-1">
          คำนวณจาก {summary.totalPrograms} สาขาวิชา
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700">{summary.highChance}</p>
          <p className="text-xs text-green-600">โอกาสสูง</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-yellow-100 mx-auto flex items-center justify-center mb-2">
            <BarChart3 className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-700">{summary.mediumChance}</p>
          <p className="text-xs text-yellow-600">โอกาสปานกลาง</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-2">
            <BarChart3 className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-700">{summary.lowChance}</p>
          <p className="text-xs text-red-600">โอกาสต่ำ</p>
        </div>
      </div>

      {/* Filter and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ChanceLevel | 'ALL')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            <option value="ALL">ทั้งหมด ({results.length})</option>
            <option value="HIGH">โอกาสสูง ({summary.highChance})</option>
            <option value="MEDIUM">โอกาสปานกลาง ({summary.mediumChance})</option>
            <option value="LOW">โอกาสต่ำ ({summary.lowChance})</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              showDetails
                ? 'bg-pink-100 text-pink-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showDetails ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียด'}
          </button>

          {onSave && (
            <button
              onClick={onSave}
              className="text-sm px-3 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              บันทึก
            </button>
          )}
        </div>
      </div>

      {/* Results list */}
      <div className="space-y-3">
        {filteredResults.map((result, index) => (
          <ResultCard
            key={result.program.id}
            result={result}
            showDetails={showDetails}
          />
        ))}

        {filteredResults.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500">ไม่พบผลลัพธ์ที่ตรงกับตัวกรอง</p>
          </div>
        )}
      </div>
    </div>
  );
}
