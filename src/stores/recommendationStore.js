import { defineStore } from 'pinia'

// 기온과 상대습도로 계산하는 Thom 불쾌지수
export const calculateDiscomfortIndex = (temp = 0, humidity = 0) =>
  Math.round(1.8 * temp - 0.55 * (1 - humidity / 100) * (1.8 * temp - 26) + 32)

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const activities = [
  { id: 'walk', title: '공원 산책', icon: '🚶', place: 'outdoor', baseScore: 88, time: '오전 7시 - 10시', startTime: '07:00', endTime: '10:00' },
  { id: 'running', title: '조깅 / 러닝', icon: '🏃', place: 'outdoor', baseScore: 86, time: '오전 6시 - 9시', startTime: '06:00', endTime: '09:00' },
  { id: 'cycling', title: '자전거 타기', icon: '🚴', place: 'outdoor', baseScore: 84, time: '오전 8시 - 11시', startTime: '08:00', endTime: '11:00' },
  { id: 'picnic', title: '피크닉', icon: '🧺', place: 'outdoor', baseScore: 82, time: '오후 12시 - 3시', startTime: '12:00', endTime: '15:00' },
  { id: 'museum', title: '미술관 관람', icon: '🎨', place: 'indoor', baseScore: 76, time: '오후 1시 - 4시', startTime: '13:00', endTime: '16:00' },
  { id: 'reading', title: '실내 독서', icon: '📚', place: 'indoor', baseScore: 75, time: '오후 2시 - 4시', startTime: '14:00', endTime: '16:00' },
  { id: 'workout', title: '홈 트레이닝', icon: '🧘', place: 'indoor', baseScore: 77, time: '오후 6시 - 7시', startTime: '18:00', endTime: '19:00' },
  { id: 'swimming', title: '실내 수영', icon: '🏊', place: 'indoor', baseScore: 80, time: '오전 10시 - 12시', startTime: '10:00', endTime: '12:00', hotBonus: true },
  { id: 'cafe', title: '실내 카페 투어', icon: '☕', place: 'indoor', baseScore: 74, time: '오후 1시 - 3시', startTime: '13:00', endTime: '15:00' },
]

export const useRecommendationStore = defineStore('recommendation', () => {
  const getRecommendations = (weather, limit = 5) => {
    if (!weather) return []

    const temp = Number(weather.temp) || 0
    const humidity = Number(weather.humidity) || 0
    const precipitation = Number(weather.precipitation) || 0
    const discomfortIndex = calculateDiscomfortIndex(temp, humidity)
    const status = (weather.status || '').toLowerCase()
    const isWet = precipitation > 0 || /rain|비|눈|snow|소나기|drizzle/.test(status)
    const isSevere = /thunder|뇌우|폭우|태풍/.test(status)

    return activities
      .map((activity) => {
        let score = activity.baseScore
        const reasons = []

        if (activity.place === 'outdoor') {
          if (isWet) {
            score -= precipitation >= 5 ? 55 : 38
            reasons.push(`강수량 ${precipitation}mm로 야외 활동에 불리`)
          }
          if (humidity >= 80) {
            score -= 14
            reasons.push(`습도 ${humidity}%로 답답함`)
          }
          if (temp >= 30 || discomfortIndex >= 80) {
            score -= 25
            reasons.push(`불쾌지수 ${discomfortIndex}로 온열 주의`)
          } else if (temp >= 18 && temp <= 26 && humidity < 75 && !isWet) {
            score += 10
            reasons.push('기온과 습도가 야외 활동에 적합')
          }
          if (temp <= 5) {
            score -= 18
            reasons.push('낮은 기온으로 보온 필요')
          }
        } else {
          if (isWet) {
            score += 15
            reasons.push('비·눈을 피할 수 있는 실내 활동')
          }
          if (humidity >= 80 || discomfortIndex >= 80) {
            score += 10
            reasons.push('고습·불쾌한 날씨에 쾌적함')
          }
          if (temp <= 5 || temp >= 30) score += 7
        }

        if (activity.hotBonus && temp >= 28) {
          score += 12
          reasons.push('더위를 식히기 좋음')
        }
        if (isSevere && activity.place === 'outdoor') score = 5

        score = clamp(Math.round(score), 5, 99)
        return {
          ...activity,
          score: `${score}%`,
          scoreValue: score,
          type: score >= 75 ? '추천' : score >= 55 ? '보통' : '주의',
          reason: reasons[0] || '현재 날씨에 무난한 활동',
        }
      })
      .sort((a, b) => b.scoreValue - a.scoreValue)
      .slice(0, limit)
  }

  return { getRecommendations, calculateDiscomfortIndex }
})
