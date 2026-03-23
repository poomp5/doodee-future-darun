"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Building2 } from "lucide-react";

interface ProgramRecommendation {
  id: number;
  university_name_th: string | null;
  university_name_en: string | null;
  faculty_name_th: string | null;
  faculty_name_en: string | null;
  field_name_th: string | null;
  field_name_en: string | null;
  program_name_th: string | null;
  program_name_en: string | null;
  logo_url: string | null;
  required_skills: string[];
  matched_skills: Array<{ skill: string; score: number }>;
  match_percentage: number;
}

interface ProgramRecommendationCardProps {
  program: ProgramRecommendation;
  index: number;
  isTh: boolean;
  requiredSkillsLabel: string;
  unknownUniversity: string;
}

export default function ProgramRecommendationCard({
  program,
  index,
  isTh,
  requiredSkillsLabel,
  unknownUniversity,
}: ProgramRecommendationCardProps) {
  const programName =
    program.program_name_th ||
    program.program_name_en ||
    program.field_name_th ||
    program.field_name_en ||
    "-";

  const universityName =
    program.university_name_th ||
    program.university_name_en ||
    unknownUniversity;

  const matchColor =
    program.match_percentage >= 80
      ? "bg-green-100 text-green-700"
      : program.match_percentage >= 65
        ? "bg-amber-100 text-amber-700"
        : "bg-gray-100 text-gray-700";

  const matchLabel = isTh
    ? `${program.match_percentage}% เหมาะสม`
    : `${program.match_percentage}% match`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{
        y: -2,
        boxShadow: "0 4px 12px rgba(236, 72, 153, 0.1)",
      }}
      className="w-full max-w-[85vw] overflow-hidden rounded-xl border mt-4 border-gray-200 bg-white p-4 transition-all hover:border-pink-200 sm:rounded-2xl sm:p-5"
    >
      <div className="mb-3 flex w-full max-w-full flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-gray-50 shadow-sm sm:h-10 sm:w-10">
            {program.logo_url ? (
              <Image
                src={program.logo_url}
                alt={universityName}
                width={36}
                height={36}
                className="object-contain"
              />
            ) : (
              <Building2 className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <h3 className="truncate text-xs font-bold text-gray-900 sm:text-sm">
              {programName}
            </h3>
            <p className="truncate text-[11px] text-gray-600 sm:text-xs">
              {universityName}
            </p>
            <p className="truncate text-[10px] text-gray-500 sm:text-[11px]">
              {program.faculty_name_th || program.faculty_name_en || "-"}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold sm:px-2.5 sm:py-1 sm:text-xs ${matchColor}`}
        >
          {matchLabel}
        </span>
      </div>

      <div className="mb-1.5 text-[10px] font-semibold text-pink-600 sm:mb-2 sm:text-[11px]">
        {requiredSkillsLabel}
      </div>
      <div className="mb-2 flex w-full max-w-full flex-wrap gap-1 overflow-x-hidden sm:mb-3 sm:gap-1.5">
        {program.required_skills.map((sk) => (
          <span
            key={`${program.id}-${sk}`}
            className="inline-block whitespace-nowrap rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-medium text-pink-700 sm:px-2.5 sm:py-1 sm:text-[11px]"
          >
            {sk}
          </span>
        ))}
      </div>

      <div className="grid w-full max-w-full grid-cols-2 gap-1.5 overflow-x-hidden sm:gap-2 md:grid-cols-3 lg:grid-cols-4">
        {program.matched_skills.map((sk) => (
          <div
            key={`${program.id}-${sk.skill}`}
            className="rounded-lg border border-pink-100 bg-pink-50/40 px-2 py-1.5"
          >
            <div className="truncate text-[10px] text-pink-600">{sk.skill}</div>
            <div className="text-sm font-bold text-pink-900">{sk.score}%</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
