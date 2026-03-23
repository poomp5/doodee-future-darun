'use client';

import { useRef, useState } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface SkillsRadarChartProps {
  skills: {
    [key: string]: number; // skill name: score (0-100)
  };
  title?: string;
}

export default function SkillsRadarChart({ skills, title = "ทักษะและความสามารถ" }: SkillsRadarChartProps) {
  const chartRef = useRef<ChartJS<'radar'> | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Convert skills object to chart data
  const labels = Object.keys(skills);
  const values = Object.values(skills);

  const data = {
    labels,
    datasets: [
      {
        label: 'คะแนนทักษะ',
        data: values,
        backgroundColor: 'rgba(236, 72, 153, 0.2)', // pink-500 with opacity
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(236, 72, 153, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(236, 72, 153, 1)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: { intersect: true, mode: 'nearest' },
    onHover: (_event, elements, chart) => {
      const canvas = chart?.canvas;
      if (canvas) {
        canvas.style.cursor = elements.length ? 'pointer' : 'default';
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        min: 0,
        ticks: {
          stepSize: 20,
          font: {
            family: 'Kanit, sans-serif',
            size: 11,
          },
          color: '#6b7280', // gray-500
        },
        grid: {
          color: 'rgba(209, 213, 219, 0.5)', // gray-300
        },
        pointLabels: {
          font: {
            family: 'Kanit, sans-serif',
            size: 13,
            weight: 500,
          },
          color: '#374151', // gray-700
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          family: 'Kanit, sans-serif',
          size: 14,
        },
        bodyFont: {
          family: 'Kanit, sans-serif',
          size: 13,
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `คะแนน: ${context.parsed.r}/100`;
          },
        },
      },
    },
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const chart = chartRef.current;
    if (!chart) return;
    const elements = chart.getElementsAtEventForMode(
      event.nativeEvent,
      'nearest',
      { intersect: true },
      true
    );
    if (!elements.length) {
      setActiveIndex(null);
      return;
    }
    setActiveIndex(elements[0].index);
  };

  // If no skills, show placeholder
  if (labels.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
        <p className="text-gray-500 text-sm">ยังไม่มีข้อมูลทักษะ</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        {title}
      </h3>
      <div className="w-full max-w-md mx-auto">
        <Radar ref={chartRef} data={data} options={options} onClick={handleClick} />
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {labels.map((label, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
            <span className="text-gray-700">
              {label}: <span className="font-semibold text-pink-600">{values[index]}</span>
            </span>
          </div>
        ))}
      </div>

      {activeIndex !== null && labels[activeIndex] !== undefined && (
        <div className="mt-4 rounded-md border border-pink-100 bg-pink-50 px-3 py-2 text-xs text-pink-700">
          เลือกแล้ว: {labels[activeIndex]} = {values[activeIndex]}
        </div>
      )}
    </div>
  );
}
