'use client';

import { Calculator, Building2, GitCompare, ListOrdered } from 'lucide-react';
import type { CalculatorProgramType } from '@/types/tcas-calculator';

interface ProgramSelectorProps {
  selected: CalculatorProgramType | null;
  onSelect: (type: CalculatorProgramType) => void;
}

const PROGRAMS = [
  {
    type: 1 as CalculatorProgramType,
    name: 'คำนวณคะแนนคณะที่สนใจ',
    description: 'คำนวณคะแนนสำหรับคณะ/สาขาที่เลือก',
    icon: Calculator,
    color: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50',
  },
  {
    type: 2 as CalculatorProgramType,
    name: 'ดูคะแนนทุกคณะในมหาวิทยาลัย',
    description: 'ดูโอกาสติดทุกคณะในมหาวิทยาลัยที่เลือก',
    icon: Building2,
    color: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50',
  },
  {
    type: 3 as CalculatorProgramType,
    name: 'ดูคะแนนหลายมหาวิทยาลัย',
    description: 'เปรียบเทียบคณะเดียวกันหลายมหาวิทยาลัย',
    icon: GitCompare,
    color: 'from-pink-500 to-rose-600',
    bgLight: 'bg-pink-50',
  },
  {
    type: 4 as CalculatorProgramType,
    name: 'ลองจัดเซต 10 อันดับ',
    description: 'จัดลำดับและประเมินความเสี่ยงของเซตที่เลือก',
    icon: ListOrdered,
    color: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
  },
];

export default function ProgramSelector({ selected, onSelect }: ProgramSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">เลือกโปรแกรมคำนวณ</h2>
        <p className="text-sm text-gray-500 mt-1">เลือกวิธีคำนวณที่ต้องการ</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PROGRAMS.map((program) => {
          const Icon = program.icon;
          const isSelected = selected === program.type;

          return (
            <button
              key={program.type}
              onClick={() => onSelect(program.type)}
              className={`
                relative p-5 rounded-2xl border-2 text-left transition-all duration-200
                ${isSelected
                  ? 'border-pink-500 bg-pink-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center mb-3
                bg-gradient-to-br ${program.color}
              `}>
                <Icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="font-semibold text-gray-900 mb-1">
                {program.name}
              </h3>
              <p className="text-sm text-gray-500">
                {program.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
