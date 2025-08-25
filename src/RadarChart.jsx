import React from 'react'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

const RadarChart = ({ answers }) => {
  // 각 축별 점수 계산 (0-100)
  const calculateScores = () => {
    if (!answers || answers.length === 0) return null

    // E/I 축 (전투 참여도) - 질문 1, 5, 6
    const eiAnswers = [answers[0], answers[4], answers[5]]
    const eScore = eiAnswers.filter(ans => ans === 'A').length / 3 * 100
    const iScore = eiAnswers.filter(ans => ans === 'B').length / 3 * 100

    // G/C 축 (자원 사용 방식) - 질문 4, 9
    const gcAnswers = [answers[3], answers[8]]
    const gScore = gcAnswers.filter(ans => ans === 'A').length / 2 * 100
    const cScore = gcAnswers.filter(ans => ans === 'B').length / 2 * 100

    // P/S 축 (운영 스타일) - 질문 2, 3
    const psAnswers = [answers[1], answers[2]]
    const pScore = psAnswers.filter(ans => ans === 'B').length / 2 * 100
    const sScore = psAnswers.filter(ans => ans === 'A').length / 2 * 100

    // T/M 축 (멘탈 안정성) - 질문 7, 8
    const tmAnswers = [answers[6], answers[7]]
    const tScore = tmAnswers.filter(ans => ans === 'A').length / 2 * 100
    const mScore = tmAnswers.filter(ans => ans === 'B').length / 2 * 100

    return {
      eScore: Math.round(eScore),
      iScore: Math.round(iScore),
      gScore: Math.round(gScore),
      cScore: Math.round(cScore),
      pScore: Math.round(pScore),
      sScore: Math.round(sScore),
      tScore: Math.round(tScore),
      mScore: Math.round(mScore)
    }
  }

  const scores = calculateScores()
  if (!scores) return null

  const data = {
    labels: [
      'E (전투 참여)',
      'I (안정적 플레이)',
      'G (자원 욕심)',
      'C (팀원 양보)',
      'P (안정 운영)',
      'S (초반 굴리기)',
      'T (멘탈 강철)',
      'M (감정 기복)'
    ],
    datasets: [
      {
        label: '당신의 점수',
        data: [
          scores.eScore,
          scores.iScore,
          scores.gScore,
          scores.cScore,
          scores.pScore,
          scores.sScore,
          scores.tScore,
          scores.mScore
        ],
        backgroundColor: 'rgba(0, 255, 136, 0.2)',
        borderColor: 'rgba(0, 255, 136, 1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(0, 255, 136, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(0, 255, 136, 1)',
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        min: 0,
        ticks: {
          display: false,
          stepSize: 33.33,
          callback: function(value, index, values) {
            // 0, 33.33, 66.66, 100만 표시 (4개 선이지만 3개 간격)
            return value % 33.33 === 0 ? value : '';
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          circular: true
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        pointLabels: {
          color: '#ffffff',
          font: {
            size: 14,
            weight: '600'
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(0, 255, 136, 1)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed.r}점`
          }
        }
      }
    }
  }

  return (
    <div className="radar-chart-container">
      <div className="chart-wrapper">
        <Radar data={data} options={options} />
      </div>
    </div>
  )
}

export default RadarChart 