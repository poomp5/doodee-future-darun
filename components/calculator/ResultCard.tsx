'use client';

import { TrendingUp, TrendingDown, Minus, AlertTriangle, Building2 } from 'lucide-react';
import Image from 'next/image';
import type { CalculationResult, ChanceLevel } from '@/types/tcas-calculator';
import { getChanceLevelInfo, formatScore } from '@/lib/tcas-calculator';

interface ResultCardProps {
  result: CalculationResult;
  rank?: number;
  showDetails?: boolean;
  strategy?: 'safe' | 'reach' | 'match';
}

export default function ResultCard({ result, rank, showDetails = false, strategy }: ResultCardProps) {
  const chanceInfo = getChanceLevelInfo(result.chanceLevel);

  const getStrategyBadge = () => {
    if (!strategy) return null;
    switch (strategy) {
      case 'safe':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Safe</span>;
      case 'match':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Match</span>;
      case 'reach':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Reach</span>;
    }
  };

  const getDifferenceIcon = () => {
    if (!result.comparison) return null;
    const diff = result.comparison.difference;
    if (diff > 5) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (diff < -5) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Rank badge */}
        {rank && (
          <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-pink-600">{rank}</span>
          </div>
        )}

        {/* University logo */}
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {result.program.logoUrl ? (
            <Image
              src={result.program.logoUrl}
              alt={result.program.universityNameTh || ''}
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          ) : (
            <Building2 className="w-6 h-6 text-gray-400" />
          )}
        </div>

        {/* Program info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">
              {result.program.facultyNameTh || result.program.fieldNameTh}
            </h3>
            {getStrategyBadge()}
          </div>
          <p className="text-sm text-gray-500 truncate">
            {result.program.universityNameTh}
          </p>
          {result.program.programNameTh && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {result.program.programNameTh}
            </p>
          )}
        </div>

        {/* Chance badge */}
        <div className={`px-3 py-1.5 rounded-lg ${chanceInfo.bgColor} flex-shrink-0`}>
          <p className={`text-sm font-semibold ${chanceInfo.textColor}`}>
            {chanceInfo.labelTh}
          </p>
        </div>
      </div>

      {/* Score details */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">คะแนนถ่วง</p>
          <p className="text-lg font-bold text-gray-900">{formatScore(result.weightedScore)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">เต็ม</p>
          <p className="text-lg font-bold text-gray-900">{formatScore(result.maxPossibleScore)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">เปอร์เซ็นต์</p>
          <p className="text-lg font-bold text-gray-900">{result.percentage}%</p>
        </div>
      </div>

      {/* Comparison with cutoff */}
      {result.comparison && (
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getDifferenceIcon()}
              <span className="text-sm text-blue-800">
                เทียบกับ TCAS{result.comparison.round} ปี {result.comparison.year}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-600">คะแนนต่ำสุด: {result.comparison.cutoffMin}</p>
              <p className={`text-sm font-semibold ${
                result.comparison.difference >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {result.comparison.difference >= 0 ? '+' : ''}{formatScore(result.comparison.difference)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {showDetails && (result.missingSubjects.length > 0 || result.belowMinimum.length > 0) && (
        <div className="mt-3 space-y-2">
          {result.missingSubjects.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-800">วิชาที่ยังไม่ได้กรอก:</p>
                <p className="text-xs text-amber-700">{result.missingSubjects.join(', ')}</p>
              </div>
            </div>
          )}

          {result.belowMinimum.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-red-800">วิชาที่ต่ำกว่าเกณฑ์ขั้นต่ำ:</p>
                {result.belowMinimum.map((item, idx) => (
                  <p key={idx} className="text-xs text-red-700">
                    {item.subject}: {item.score} (ต้องการ {item.minRequired})
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
