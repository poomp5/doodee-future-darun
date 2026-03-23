'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import StepIndicator from './StepIndicator';
import ProgramSelector from './ProgramSelector';
import ScoreInputForm from './ScoreInputForm';
import UniversitySelector from './UniversitySelector';
import FacultySelector from './FacultySelector';
import ResultsDisplay from './ResultsDisplay';
import RankingBuilder from './RankingBuilder';
import type {
  CalculatorProgramType,
  UserScores,
  CalculationResult,
  RankingEvaluation,
} from '@/types/tcas-calculator';

interface CalculatorWizardProps {
  onSave?: (scores: UserScores, results: any, programType: CalculatorProgramType) => Promise<void>;
}

export default function CalculatorWizard({ onSave }: CalculatorWizardProps) {
  // Wizard state
  const [step, setStep] = useState(1);
  const [programType, setProgramType] = useState<CalculatorProgramType | null>(null);
  const [scores, setScores] = useState<UserScores>({});
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);
  const [selectedUniversityIds, setSelectedUniversityIds] = useState<string[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [selectedProgramIds, setSelectedProgramIds] = useState<number[]>([]);
  const [rankedProgramIds, setRankedProgramIds] = useState<number[]>([]);

  // Results state
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [summary, setSummary] = useState({ totalPrograms: 0, highChance: 0, mediumChance: 0, lowChance: 0 });
  const [rankingEvaluation, setRankingEvaluation] = useState<RankingEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get steps based on program type
  const getSteps = () => {
    const baseSteps = [
      { number: 1, title: 'เลือกโปรแกรม', description: 'เลือกวิธีคำนวณ' },
      { number: 2, title: 'กรอกคะแนน', description: 'ใส่คะแนนสอบ' },
    ];

    switch (programType) {
      case 1: // Single faculty
        return [
          ...baseSteps,
          { number: 3, title: 'เลือกคณะ', description: 'เลือกคณะ/สาขา' },
          { number: 4, title: 'ผลลัพธ์', description: 'ดูผลการคำนวณ' },
        ];
      case 2: // All faculties in university
        return [
          ...baseSteps,
          { number: 3, title: 'เลือกมหาวิทยาลัย', description: 'เลือก ม.' },
          { number: 4, title: 'ผลลัพธ์', description: 'ดูผลการคำนวณ' },
        ];
      case 3: // Multi-university comparison
        return [
          ...baseSteps,
          { number: 3, title: 'เลือกคณะ', description: 'เลือกคณะ' },
          { number: 4, title: 'เลือกมหาวิทยาลัย', description: 'หลาย ม.' },
          { number: 5, title: 'ผลลัพธ์', description: 'เปรียบเทียบ' },
        ];
      case 4: // Ranking builder
        return [
          ...baseSteps,
          { number: 3, title: 'จัดอันดับ', description: 'เลือก 10 อันดับ' },
          { number: 4, title: 'ผลลัพธ์', description: 'ประเมินเซต' },
        ];
      default:
        return baseSteps;
    }
  };

  const steps = getSteps();
  const maxStep = steps.length;

  // Calculate results when reaching results step
  const calculateResults = async () => {
    if (loading) return;

    setLoading(true);
    try {
      let programIds: number[] = [];

      // Get program IDs based on program type
      if (programType === 4) {
        programIds = rankedProgramIds;
      } else {
        // Fetch programs based on selection
        const params = new URLSearchParams();

        if (programType === 2 && selectedUniversityId) {
          params.set('universityId', selectedUniversityId);
        }
        if (programType === 1 && selectedFacultyId) {
          params.set('facultyId', selectedFacultyId);
        }
        if (programType === 3 && selectedFacultyId && selectedUniversityIds.length > 0) {
          // This requires special handling - filter by faculty across multiple universities
          // For now, we'll just use the faculty filter
          params.set('facultyId', selectedFacultyId);
        }

        const programsRes = await fetch(`/api/calculator/programs?${params.toString()}&limit=100`);
        const programsData = await programsRes.json();

        if (programsData.success) {
          programIds = programsData.data.map((p: any) => p.id);

          // Filter by universities for program type 3
          if (programType === 3 && selectedUniversityIds.length > 0) {
            programIds = programsData.data
              .filter((p: any) => selectedUniversityIds.includes(p.universityId))
              .map((p: any) => p.id);
          }
        }
      }

      if (programIds.length === 0) {
        setResults([]);
        setSummary({ totalPrograms: 0, highChance: 0, mediumChance: 0, lowChance: 0 });
        setLoading(false);
        return;
      }

      // Calculate scores
      if (programType === 4) {
        // Use ranking endpoint
        const res = await fetch('/api/calculator/ranking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scores,
            rankedProgramIds: programIds,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setRankingEvaluation(data.data);
          setResults(data.data.programs.map((p: any) => p.result));
          setSummary({
            totalPrograms: data.data.programs.length,
            highChance: data.data.overall.safeCount,
            mediumChance: data.data.overall.matchCount,
            lowChance: data.data.overall.reachCount,
          });
        }
      } else {
        // Use calculate endpoint
        const res = await fetch('/api/calculator/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scores,
            programIds,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setResults(data.data.results);
          setSummary(data.data.summary);
        }
      }
    } catch (error) {
      console.error('Error calculating:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!onSave || !programType) return;

    setSaving(true);
    try {
      await onSave(scores, programType === 4 ? rankingEvaluation : results, programType);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  // Calculate on step change to results
  useEffect(() => {
    const isResultsStep = step === maxStep;
    if (isResultsStep && results.length === 0) {
      calculateResults();
    }
  }, [step, maxStep]);

  // Validate current step
  const canProceed = () => {
    switch (step) {
      case 1:
        return programType !== null;
      case 2:
        return Object.keys(scores).length > 0;
      case 3:
        if (programType === 1) return selectedFacultyId !== null;
        if (programType === 2) return selectedUniversityId !== null;
        if (programType === 3) return selectedFacultyId !== null;
        if (programType === 4) return rankedProgramIds.length > 0;
        return false;
      case 4:
        if (programType === 3) return selectedUniversityIds.length > 0;
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < maxStep && canProceed()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      // Clear results when going back
      if (step === maxStep) {
        setResults([]);
        setRankingEvaluation(null);
      }
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <ProgramSelector
            selected={programType}
            onSelect={setProgramType}
          />
        );

      case 2:
        return (
          <ScoreInputForm
            scores={scores}
            onChange={setScores}
          />
        );

      case 3:
        if (programType === 1 || programType === 3) {
          return (
            <FacultySelector
              selected={selectedFacultyId}
              onSelect={setSelectedFacultyId}
            />
          );
        }
        if (programType === 2) {
          return (
            <UniversitySelector
              selected={selectedUniversityId}
              onSelect={setSelectedUniversityId}
            />
          );
        }
        if (programType === 4) {
          return (
            <RankingBuilder
              selectedProgramIds={rankedProgramIds}
              onProgramsChange={setRankedProgramIds}
            />
          );
        }
        return null;

      case 4:
        if (programType === 3) {
          return (
            <UniversitySelector
              selected={null}
              onSelect={() => {}}
              multiple
              selectedMultiple={selectedUniversityIds}
              onSelectMultiple={setSelectedUniversityIds}
            />
          );
        }
        // Results step for program types 1, 2, 4
        if (loading) {
          return (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
              <p className="text-gray-500">กำลังคำนวณ...</p>
            </div>
          );
        }
        if (programType === 4 && rankingEvaluation) {
          return (
            <RankingBuilder
              selectedProgramIds={rankedProgramIds}
              onProgramsChange={setRankedProgramIds}
              evaluation={rankingEvaluation}
            />
          );
        }
        return (
          <ResultsDisplay
            results={results}
            summary={summary}
            onSave={onSave ? handleSave : undefined}
          />
        );

      case 5:
        // Results step for program type 3
        if (loading) {
          return (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
              <p className="text-gray-500">กำลังคำนวณ...</p>
            </div>
          );
        }
        return (
          <ResultsDisplay
            results={results}
            summary={summary}
            onSave={onSave ? handleSave : undefined}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <StepIndicator
          steps={steps}
          currentStep={step}
          onStepClick={(s) => s < step && setStep(s)}
        />
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors
            ${step === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          <ChevronLeft className="w-5 h-5" />
          ย้อนกลับ
        </button>

        {step < maxStep && (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-colors
              ${canProceed()
                ? 'bg-pink-500 text-white hover:bg-pink-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            ถัดไป
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {step === maxStep && onSave && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 rounded-xl font-medium bg-pink-500 text-white hover:bg-pink-600 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              'บันทึกผลลัพธ์'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
