'use client'

import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'
import type { UniversitySummary } from '@/lib/university/university-summary'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip)

const LABELS = ['Activity', 'Maintenance', 'Community', 'Docs', 'Security']

interface Props {
  summary: UniversitySummary
}

export function UniversityCardRadar({ summary }: Props) {
  const { activity, maintenance, community, documentation, security } = summary.metrics

  const data = {
    labels: LABELS,
    datasets: [
      {
        data: [activity, maintenance, community, documentation, security],
        backgroundColor: 'rgba(14, 165, 233, 0.15)',
        borderColor: 'rgba(14, 165, 233, 0.8)',
        borderWidth: 1.5,
        pointRadius: 2,
        pointBackgroundColor: 'rgba(14, 165, 233, 0.8)',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { tooltip: { enabled: false }, legend: { display: false } },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { display: false, stepSize: 25 },
        pointLabels: { display: false },
        grid: { color: 'rgba(148,163,184,0.2)' },
        angleLines: { color: 'rgba(148,163,184,0.2)' },
      },
    },
  }

  return <Radar data={data} options={options} />
}
