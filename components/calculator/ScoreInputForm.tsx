'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { UserScores, SubjectCode } from '@/types/tcas-calculator';
import { SUBJECT_CONFIG } from '@/types/tcas-calculator';

interface ScoreInputFormProps {
  scores: UserScores;
  onChange: (scores: UserScores) => void;
  requiredSubjects?: SubjectCode[];
}

const SUBJECT_GROUPS = [
  {
    name: 'TGAT',
    nameTh: 'TGAT (ความถนัดทั่วไป)',
    subjects: ['TGAT1', 'TGAT2', 'TGAT3'] as SubjectCode[],
    color: 'blue',
  },
  {
    name: 'TPAT',
    nameTh: 'TPAT (ความถนัดเฉพาะ)',
    subjects: ['TPAT1', 'TPAT2', 'TPAT3', 'TPAT4', 'TPAT5'] as SubjectCode[],
    color: 'violet',
  },
  {
    name: 'A-Level',
    nameTh: 'A-Level',
    subjects: ['A_MATH1', 'A_MATH2', 'A_PHY', 'A_CHEM', 'A_BIO', 'A_SCI', 'A_THAI', 'A_SOC', 'A_ENG'] as SubjectCode[],
    color: 'pink',
  },
  {
    name: 'Other',
    nameTh: 'อื่นๆ',
    subjects: ['GPAX'] as SubjectCode[],
    color: 'gray',
  },
];

export default function ScoreInputForm({ scores, onChange, requiredSubjects }: ScoreInputFormProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['TGAT', 'A-Level']);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  const handleScoreChange = (subject: SubjectCode, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    const config = SUBJECT_CONFIG[subject];

    // Validate max score
    if (numValue !== undefined && numValue > config.maxScore) {
      return;
    }
    if (numValue !== undefined && numValue < 0) {
      return;
    }

    onChange({
      ...scores,
      [subject]: numValue,
    });
  };

  const isRequired = (subject: SubjectCode) =>
    requiredSubjects?.includes(subject) ?? false;

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          header: 'bg-blue-50 border-blue-200',
          badge: 'bg-blue-500',
          focus: 'focus:ring-blue-300 focus:border-blue-400',
        };
      case 'violet':
        return {
          header: 'bg-violet-50 border-violet-200',
          badge: 'bg-violet-500',
          focus: 'focus:ring-violet-300 focus:border-violet-400',
        };
      case 'pink':
        return {
          header: 'bg-pink-50 border-pink-200',
          badge: 'bg-pink-500',
          focus: 'focus:ring-pink-300 focus:border-pink-400',
        };
      default:
        return {
          header: 'bg-gray-50 border-gray-200',
          badge: 'bg-gray-500',
          focus: 'focus:ring-gray-300 focus:border-gray-400',
        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">กรอกคะแนนสอบ</h2>
        <p className="text-sm text-gray-500 mt-1">
          กรอกคะแนนสอบของคุณเพื่อคำนวณโอกาสติด
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          กรอกเฉพาะวิชาที่คุณสอบก็พอ ไม่จำเป็นต้องกรอกทุกวิชา
        </p>
      </div>

      {SUBJECT_GROUPS.map((group) => {
        const colors = getColorClasses(group.color);
        const isExpanded = expandedGroups.includes(group.name);
        const filledCount = group.subjects.filter(s => scores[s] !== undefined).length;

        return (
          <div key={group.name} className="border rounded-xl overflow-hidden">
            <button
              onClick={() => toggleGroup(group.name)}
              className={`w-full px-4 py-3 flex items-center justify-between ${colors.header} transition-colors`}
            >
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${colors.badge}`}>
                  {group.name}
                </span>
                <span className="font-medium text-gray-800">{group.nameTh}</span>
                {filledCount > 0 && (
                  <span className="text-xs text-gray-500">
                    ({filledCount}/{group.subjects.length} กรอกแล้ว)
                  </span>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {isExpanded && (
              <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.subjects.map((subject) => {
                  const config = SUBJECT_CONFIG[subject];
                  const required = isRequired(subject);

                  return (
                    <div key={subject} className="space-y-1">
                      <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                        {config.nameTh}
                        {required && <span className="text-red-500">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max={config.maxScore}
                          step={config.code === 'GPAX' ? '0.01' : '1'}
                          value={scores[subject] ?? ''}
                          onChange={(e) => handleScoreChange(subject, e.target.value)}
                          placeholder={`0 - ${config.maxScore}`}
                          className={`
                            w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                            focus:outline-none focus:ring-2 ${colors.focus}
                            ${required && scores[subject] === undefined ? 'border-amber-300' : ''}
                          `}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          / {config.maxScore}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex justify-end">
        <button
          onClick={() => onChange({})}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          ล้างทั้งหมด
        </button>
      </div>
    </div>
  );
}
