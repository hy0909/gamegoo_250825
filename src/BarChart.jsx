import React from 'react'

const BarChart = ({ answers }) => {
  console.log('📊 BarChart 렌더링 - answers:', answers)

  // 선택지에 따른 각 축별 점수 계산
  const calculateScores = () => {
    if (!answers || answers.length === 0) {
      console.log('❌ 답변 데이터가 없습니다')
      return null
    }

    // 각 축별 점수 초기화
    let scores = {
      'E/I': { E: 0, I: 0, total: 0 },
      'G/C': { G: 0, C: 0, total: 0 },
      'P/S': { P: 0, S: 0, total: 0 },
      'T/M': { T: 0, M: 0, total: 0 }
    }

    // 질문별 축 매핑 (a, b 선택지에 따른 속성)
    const questionAxisMapping = {
      0: { a: 'E', b: 'I' },      // 1번: E vs I
      1: { a: 'S', b: 'P' },      // 2번: S vs P
      2: { a: 'S', b: 'P' },      // 3번: S vs P
      3: { a: 'G', b: 'C' },      // 4번: G vs C
      4: { a: 'C', b: 'G' },      // 5번: C vs G
      5: { a: 'E', b: 'I' },      // 6번: E vs I
      6: { a: 'E', b: 'I' },      // 7번: E vs I
      7: { a: 'T', b: 'M' },      // 8번: T vs M
      8: { a: 'T', b: 'M' }       // 9번: T vs M
    }

    // 각 답변에 따라 점수 계산
    answers.forEach((answer, index) => {
      const mapping = questionAxisMapping[index]
      if (mapping && answer) {
        const selectedAxis = mapping[answer.toLowerCase()]
        console.log(`질문 ${index + 1}: ${answer} 선택 → ${selectedAxis} 축 +1점`)
        
        // 해당 축에 점수 추가
        if (selectedAxis === 'E') scores['E/I'].E++
        else if (selectedAxis === 'I') scores['E/I'].I++
        else if (selectedAxis === 'G') scores['G/C'].G++
        else if (selectedAxis === 'C') scores['G/C'].C++
        else if (selectedAxis === 'P') scores['P/S'].P++
        else if (selectedAxis === 'S') scores['P/S'].S++
        else if (selectedAxis === 'T') scores['T/M'].T++
        else if (selectedAxis === 'M') scores['T/M'].M++
      }
    })

    // 각 축의 총점 계산
    scores['E/I'].total = scores['E/I'].E + scores['E/I'].I
    scores['G/C'].total = scores['G/C'].G + scores['G/C'].C
    scores['P/S'].total = scores['P/S'].P + scores['P/S'].S
    scores['T/M'].total = scores['T/M'].T + scores['T/M'].M

    console.log('📊 계산된 점수:', scores)
    return scores
  }

  const scores = calculateScores()
  
  // 실제 점수만 사용 (테스트 데이터 제거)
  const displayScores = scores
  
  if (!scores) {
    console.log('❌ 점수 계산 실패 - 답변 데이터가 없습니다')
    return (
      <div className="bar-chart">
        <h3 className="chart-title">나의 롤BTI 프로필</h3>
        <div className="test-mode-notice">
          <p>📝 테스트를 완료하면 4축 막대그래프가 표시됩니다!</p>
        </div>
      </div>
    )
  }

  // 축별 설정 (그래프는 왼쪽만 밝은 색상, 텍스트는 높은 수치에만 밝은 색상)
  const axisConfig = {
    'E/I': {
      left: { name: '전투참여', color: '#00ff88' },
      right: { name: '안정운영', color: '#00ff88' }
    },
    'G/C': {
      left: { name: '팀워크', color: '#ff6b35' },
      right: { name: '개인플레이', color: '#ff6b35' }
    },
    'P/S': {
      left: { name: '안정지향', color: '#00d4ff' },
      right: { name: '공격지향', color: '#00d4ff' }
    },
    'T/M': {
      left: { name: '전략적', color: '#ff6b9d' },
      right: { name: '직감적', color: '#ff6b9d' }
    }
  }

  return (
    <div className="bar-chart">
      <h3 className="chart-title">나의 롤BTI 프로필</h3>
      
      {Object.entries(displayScores).map(([axis, score]) => {
        const config = axisConfig[axis]
        let leftScore = score[axis.split('/')[0]]  // E, G, P, T
        let rightScore = score[axis.split('/')[1]] // I, C, S, M
        
        // 그래프 색상: 수치에 따라 높은 쪽은 밝은 색상, 낮은 쪽은 회색
        const leftBarColor = leftScore >= rightScore ? config.left.color : '#666666'
        const rightBarColor = rightScore >= leftScore ? config.right.color : '#666666'
        
        // 텍스트 색상: 높은 수치에만 밝은 색상, 낮은 수치는 회색
        const leftTextColor = leftScore > 0 && leftScore >= rightScore ? config.left.color : '#666666'
        const rightTextColor = rightScore > 0 && rightScore >= leftScore ? config.right.color : '#666666'
        
        // 퍼센트 계산 (각 축의 합이 100%)
        const axisTotal = leftScore + rightScore
        const leftPercentage = axisTotal > 0 ? Math.round((leftScore / axisTotal) * 100) : 0
        const rightPercentage = axisTotal > 0 ? Math.round((rightScore / axisTotal) * 100) : 0

        console.log(`${axis} 축: ${leftScore} vs ${rightScore} (${leftPercentage}% vs ${rightPercentage}%)`)

        return (
          <div key={axis} className="axis-section">
            <div className="axis-title">{axis}</div>
            <div className="bar-container">
              <div className="bar-wrapper">
                <div 
                  className="bar left-bar" 
                  style={{ 
                    width: `${leftPercentage}%`,
                    backgroundColor: leftBarColor
                  }}
                />
                <div 
                  className="bar right-bar" 
                  style={{ 
                    width: `${rightPercentage}%`,
                    backgroundColor: rightBarColor
                  }}
                />
              </div>
            </div>
            <div className="axis-labels">
              <div className="label-left">
                <span className="percentage" style={{ color: leftTextColor }}>
                  {leftPercentage}%
                </span>
                <span className="type-name left-type" style={{ color: leftTextColor }}>
                  {config.left.name}
                </span>
              </div>
              <div className="label-right">
                <span className="percentage" style={{ color: rightTextColor }}>
                  {rightPercentage}%
                </span>
                <span className="type-name right-type" style={{ color: rightTextColor }}>
                  {config.right.name}
                </span>
              </div>
            </div>
          </div>
        )
      })}
      
      {!scores && (
        <div className="test-mode-notice">
          <p>📝 테스트를 완료하면 4축 막대그래프가 표시됩니다!</p>
        </div>
      )}
    </div>
  )
}

export default BarChart 