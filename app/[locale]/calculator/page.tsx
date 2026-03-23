'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTranslations } from 'next-intl';
import Breadcrumbs from '@/components/Breadcrumbs';
import { CalculatorWizard } from '@/components/calculator';
import { Calculator, History, Clock, RefreshCw } from 'lucide-react';
import type { UserScores, CalculatorProgramType } from '@/types/tcas-calculator';

interface SavedCalculation {
  id: number;
  programType: number;
  createdAt: string;
  scores: UserScores;
  results: any;
}

export default function CalculatorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations('calculator');

  const [history, setHistory] = useState<SavedCalculation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch user's calculation history
  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/calculator/save?limit=5');
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSave = async (
    scores: UserScores,
    results: any,
    programType: CalculatorProgramType
  ) => {
    try {
      const res = await fetch('/api/calculator/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores, results, programType }),
      });

      if (res.ok) {
        // Refresh history
        fetchHistory();
      }
    } catch (error) {
      console.error('Error saving calculation:', error);
      throw error;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProgramTypeName = (type: number) => {
    switch (type) {
      case 1: return 'คำนวณคะแนนคณะที่สนใจ';
      case 2: return 'ดูคะแนนทุกคณะในมหาวิทยาลัย';
      case 3: return 'ดูคะแนนหลายมหาวิทยาลัย';
      case 4: return 'ลองจัดเซต 10 อันดับ';
      default: return 'การคำนวณ';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f7f7fb] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f7f7fb]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs items={[{ label: 'คำนวณคะแนน TCAS' }]} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                คำนวณคะแนน TCAS69
              </h1>
              <p className="text-sm text-gray-500">
                คำนวณคะแนนและโอกาสติดคณะที่ใฝ่ฝัน
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1">
            <CalculatorWizard onSave={handleSave} />
          </div>

          {/* Sidebar - History */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-400" />
                  <span className="font-semibold text-gray-800">ประวัติการคำนวณ</span>
                </div>
                <button
                  onClick={fetchHistory}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingHistory ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-6 h-6 text-pink-500 animate-spin mx-auto" />
                </div>
              ) : history.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {history.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <p className="font-medium text-gray-900 text-sm mb-1">
                        {getProgramTypeName(item.programType)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">ยังไม่มีประวัติการคำนวณ</p>
                </div>
              )}
            </div>

            {/* Info card */}
            <div className="mt-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-100 p-4">
              <h3 className="font-semibold text-pink-800 mb-2">
                เกี่ยวกับ TCAS69
              </h3>
              <p className="text-sm text-pink-700 leading-relaxed">
                ระบบการคัดเลือกบุคคลเข้าศึกษาในสถาบันอุดมศึกษา ประจำปีการศึกษา 2569
                ใช้คะแนน TGAT, TPAT และ A-Level ในการคัดเลือก
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
