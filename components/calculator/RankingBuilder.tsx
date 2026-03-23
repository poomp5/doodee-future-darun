'use client';

import { useState, useEffect } from 'react';
import { GripVertical, X, Search, Plus, AlertCircle, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { ProgramInfo, RankedProgram, RankingEvaluation } from '@/types/tcas-calculator';

interface RankingBuilderProps {
  selectedProgramIds: number[];
  onProgramsChange: (programIds: number[]) => void;
  evaluation?: RankingEvaluation;
  loading?: boolean;
}

interface ProgramSearchResult {
  id: number;
  programId?: string;
  universityNameTh?: string;
  facultyNameTh?: string;
  fieldNameTh?: string;
  programNameTh?: string;
  logoUrl?: string;
}

export default function RankingBuilder({
  selectedProgramIds,
  onProgramsChange,
  evaluation,
  loading,
}: RankingBuilderProps) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ProgramSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [programs, setPrograms] = useState<ProgramSearchResult[]>([]);

  // Fetch selected programs info
  useEffect(() => {
    if (selectedProgramIds.length === 0) {
      setPrograms([]);
      return;
    }

    const fetchPrograms = async () => {
      try {
        const res = await fetch(`/api/calculator/programs?programIds=${selectedProgramIds.join(',')}`);
        const data = await res.json();
        if (data.success) {
          // Maintain order
          const programMap = new Map(data.data.map((p: any) => [p.id, p]));
          const ordered = selectedProgramIds
            .map(id => programMap.get(id))
            .filter(Boolean) as ProgramSearchResult[];
          setPrograms(ordered);
        }
      } catch (error) {
        console.error('Error fetching programs:', error);
      }
    };

    fetchPrograms();
  }, [selectedProgramIds]);

  // Search for programs
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    const searchPrograms = async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/calculator/programs?search=${encodeURIComponent(search)}&limit=10`);
        const data = await res.json();
        if (data.success) {
          // Filter out already selected
          const filtered = data.data.filter(
            (p: any) => !selectedProgramIds.includes(p.id)
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Error searching programs:', error);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchPrograms, 300);
    return () => clearTimeout(debounce);
  }, [search, selectedProgramIds]);

  const addProgram = (programId: number) => {
    if (selectedProgramIds.length >= 10) return;
    onProgramsChange([...selectedProgramIds, programId]);
    setSearch('');
    setSearchResults([]);
  };

  const removeProgram = (programId: number) => {
    onProgramsChange(selectedProgramIds.filter(id => id !== programId));
  };

  const moveProgram = (fromIndex: number, toIndex: number) => {
    const newIds = [...selectedProgramIds];
    const [removed] = newIds.splice(fromIndex, 1);
    newIds.splice(toIndex, 0, removed);
    onProgramsChange(newIds);
  };

  const getRiskBadge = () => {
    if (!evaluation) return null;
    const { riskLevel } = evaluation.overall;
    switch (riskLevel) {
      case 'low':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">ความเสี่ยงต่ำ</span>
          </div>
        );
      case 'medium':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">ความเสี่ยงปานกลาง</span>
          </div>
        );
      case 'high':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">ความเสี่ยงสูง</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">จัดเซต 10 อันดับ</h2>
        <p className="text-sm text-gray-500 mt-1">
          เลือกและจัดลำดับโปรแกรมที่ต้องการสมัคร (สูงสุด 10 อันดับ)
        </p>
      </div>

      {/* Search and add */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหาคณะ/สาขาที่ต้องการเพิ่ม..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={selectedProgramIds.length >= 10}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {/* Search results dropdown */}
        {search && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
            {searching ? (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 text-pink-500 animate-spin mx-auto" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((program) => (
                <button
                  key={program.id}
                  onClick={() => addProgram(program.id)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 text-left border-b last:border-b-0"
                >
                  <Plus className="w-5 h-5 text-pink-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {program.facultyNameTh || program.fieldNameTh}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {program.universityNameTh}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                ไม่พบผลลัพธ์
              </div>
            )}
          </div>
        )}
      </div>

      {/* Count and limit */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          เลือกแล้ว {selectedProgramIds.length}/10 อันดับ
        </p>
        {selectedProgramIds.length >= 10 && (
          <p className="text-sm text-amber-600">ถึงขีดจำกัดแล้ว</p>
        )}
      </div>

      {/* Risk evaluation */}
      {evaluation && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-700">การประเมินเซต</p>
            {getRiskBadge()}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-lg p-2">
              <p className="text-lg font-bold text-green-600">{evaluation.overall.safeCount}</p>
              <p className="text-xs text-gray-500">Safe</p>
            </div>
            <div className="bg-white rounded-lg p-2">
              <p className="text-lg font-bold text-yellow-600">{evaluation.overall.matchCount}</p>
              <p className="text-xs text-gray-500">Match</p>
            </div>
            <div className="bg-white rounded-lg p-2">
              <p className="text-lg font-bold text-red-600">{evaluation.overall.reachCount}</p>
              <p className="text-xs text-gray-500">Reach</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">{evaluation.overall.recommendation}</p>
        </div>
      )}

      {/* Ranked programs list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {programs.map((program, index) => {
            const evalProgram = evaluation?.programs.find(p => p.programId === program.id);

            return (
              <div
                key={program.id}
                className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3"
              >
                {/* Drag handle */}
                <div className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>

                {/* Rank number */}
                <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-pink-600">{index + 1}</span>
                </div>

                {/* Program info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">
                      {program.facultyNameTh || program.fieldNameTh}
                    </p>
                    {evalProgram?.strategy && (
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        evalProgram.strategy === 'safe'
                          ? 'bg-green-100 text-green-700'
                          : evalProgram.strategy === 'match'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {evalProgram.strategy}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {program.universityNameTh}
                  </p>
                </div>

                {/* Move buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => index > 0 && moveProgram(index, index - 1)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => index < programs.length - 1 && moveProgram(index, index + 1)}
                    disabled={index === programs.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeProgram(program.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            );
          })}

          {programs.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500 mb-2">ยังไม่ได้เลือกโปรแกรม</p>
              <p className="text-sm text-gray-400">ค้นหาและเพิ่มโปรแกรมที่ต้องการจัดอันดับ</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
