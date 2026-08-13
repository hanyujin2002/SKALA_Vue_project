<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/configStore'
import { useWeatherStore } from '@/stores/weatherStore'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()
const weatherStore = useWeatherStore()

const cityData = ref(null)

onMounted(async () => {
  await weatherStore.fetchWeatherForAllCities()
  const id = route.params.cityId
  if (weatherStore.weatherData[id]) {
    cityData.value = weatherStore.weatherData[id]
  }
})

const displayTemp = computed(() => {
  if (!cityData.value) return 0
  const rawTemp = cityData.value.temp // 기본 원본 데이터는 섭씨 숫자
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32) // 화씨 변환 연산
  }
  return rawTemp // 'celsius'일 때는 원본 그대로 반환
})

const discomfortIndex = computed(() => {
  if (!cityData.value) return 0
  const T = cityData.value.temp
  const H = cityData.value.humidity
  const di = 1.8 * T - 0.55 * (1 - H / 100) * (1.8 * T - 26) + 32
  return Math.round(di)
})

const discomfortText = computed(() => {
  const di = discomfortIndex.value
  if (di >= 80) return 'Bad'
  if (di >= 75) return 'Okay'
  return 'Great'
})

const customActivities = computed(() => {
  if (!cityData.value) return []
  const temp = cityData.value.temp
  const status = (cityData.value.status || '').toLowerCase()
  
  if (status.includes('비') || status.includes('rain') || status.includes('snow')) {
    return [
      { title: '실내 독서', time: '오후 2시 - 4시', score: '90%', type: '추천', icon: '📚' },
      { title: '홈 트레이닝', time: '오후 6시 - 7시', score: '85%', type: '추천', icon: '🧘' }
    ]
  } else if (temp > 30) {
    return [
      { title: '실내 수영', time: '오전 10시 - 12시', score: '95%', type: '추천', icon: '🏊' },
      { title: '야외 활동 자제', time: '오후 12시 - 3시', score: '20%', type: '주의', icon: '⚠️' }
    ]
  } else {
    return [
      { title: '조깅 / 러닝', time: '오전 6시 - 9시', score: '90%', type: '추천', icon: '🏃' },
      { title: '자전거 타기', time: '오전 9시 - 11시', score: '85%', type: '추천', icon: '🚴' }
    ]
  }
})

</script>

<template>
  <div class="detail-container" v-loading="weatherStore.isLoading">
    <h3>📊 지역별 상세 기상 관측 정보</h3>
    <hr />

    <div v-if="cityData" class="info-card">
      <div style="display: flex; align-items: center; gap: 10px;">
        <h4>📍 지정 지역: {{ cityData.name }}</h4>
        <img v-if="cityData.icon" :src="cityData.icon" alt="weather icon" style="width: 50px; height: 50px;" />
      </div>
      <p>
        실시간 기온: <strong>{{ displayTemp }}{{ configStore.unitSymbol }}</strong>
      </p>
      <p>기상 현황: <el-tag type="info">{{ cityData.status }}</el-tag></p>
      <p>대기 습도: 
        <el-progress 
          :percentage="cityData.humidity" 
          :status="cityData.humidity > 80 ? 'warning' : 'success'"
          style="width: 200px; display: inline-block; vertical-align: middle; margin-left: 10px;" 
        />
      </p>
      <p>현재 풍속: {{ cityData.wind }} m/s</p>
    </div>

    
    <!-- New Feature Cards -->
    <div v-if="cityData" class="detail-cards-grid">
      <!-- 1. Activity Recommendation -->
      <div class="d-card activity-card">
        <h4>오늘의 활동 추천</h4>
        <div class="activity-list">
          <div class="activity-item" v-for="(act, idx) in customActivities" :key="idx">
            <div class="act-icon">{{ act.icon }}</div>
            <div class="act-info">
              <div class="act-title">{{ act.title }} <span class="badge" :class="act.type === '추천' ? 'good' : 'bad'">{{ act.type }}</span></div>
              <div class="act-time">{{ act.time }} | 지수: {{ act.score }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Dust Info -->
      <div class="d-card dust-card">
        <h4>미세먼지 농도</h4>
        <div class="dust-stats">
          <div class="dust-col"><span>미세먼지</span><strong>{{ cityData.airQuality?.pm10 ?? '-' }} <small>μg/m³</small></strong></div>
          <div class="dust-col"><span>초미세먼지</span><strong>{{ cityData.airQuality?.pm25 ?? '-' }} <small>μg/m³</small></strong></div>
        </div>
        <p class="air-quality-label">{{ cityData.airQuality?.status || '대기질 확인 중' }} · AQI {{ cityData.airQuality?.aqi ?? '-' }}</p>
        <small class="air-source">Open-Meteo · CAMS</small>
      </div>

      <!-- 3. Discomfort Index -->
      <div class="d-card discomfort-card">
        <h4>불쾌지수</h4>
        <div class="discomfort-content">
          <div class="score">{{ discomfortIndex }}</div>
          <div class="status">{{ discomfortText === 'Bad' ? '불쾌' : discomfortText === 'Okay' ? '보통' : '쾌적' }}</div>
        </div>
      </div>
    </div>


    <div v-else-if="!cityData && !weatherStore.isLoading">
      <el-empty description="해당 지역의 상세 데이터 장부가 존재하지 않습니다." />
    </div>

    <el-button type="primary" plain @click="router.push('/')" class="back-btn" style="margin-top: 15px;">← 메인 대시보드로 돌아가기</el-button>
  </div>
</template>

<style scoped>
.detail-container {
  margin: 0 auto;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.info-card {
  background: #f1f2f6;
  padding: 15px;
  border-radius: 6px;
  margin: 15px 0;
}
.back-btn {
  width: 100%;
}
.recommendation-section {
  background: #fff3e0;
  padding: 15px;
  border-radius: 6px;
  margin: 15px 0;
  border-left: 4px solid #4caf50;
}
.activity-list {
  list-style: none;
  padding: 0;
  margin-top: 10px;
}
.activity-item {
  padding: 8px 0;
  border-bottom: 1px dashed #c8e6c9;
  display: flex;
  align-items: center;
  gap: 10px;
}
.activity-item:last-child {
  border-bottom: none;
}
.activity-type {
  background: #4caf50;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.detail-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  margin-top: 20px;
}
@media (min-width: 768px) {
  .detail-cards-grid {
    grid-template-columns: 2fr 1fr 1fr;
  }
}
.d-card {
  padding: 20px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
}
.d-card h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #1e293b;
}
.activity-card {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
}
.dust-card {
  background: linear-gradient(135deg, #faf5ff, #f3e8ff);
}
.discomfort-card {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(255,255,255,0.7);
  padding: 10px 15px;
  border-radius: 12px;
}
.act-icon {
  font-size: 24px;
}
.act-info {
  display: flex;
  flex-direction: column;
}
.act-title {
  font-size: 14px;
  font-weight: bold;
}
.act-time {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}
.badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  color: white;
  margin-left: 5px;
}
.badge.good { background: #22c55e; }
.badge.bad { background: #ef4444; }

.dust-stats {
  display: flex;
  justify-content: space-between;
}
.dust-col {
  display: flex;
  flex-direction: column;
  color: #64748b;
  font-size: 12px;
}
.dust-col strong {
  font-size: 20px;
  color: #1e293b;
  margin-top: 8px;
}
.air-quality-label { margin: 13px 0 4px; color: #475569; font-size: 12px; font-weight: 700; }
.air-source { color: #7c8b9d; font-size: 10px; }
.discomfort-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100% - 30px);
}
.score {
  font-size: 36px;
  font-weight: bold;
  color: #1e293b;
}
.status {
  font-size: 14px;
  color: #d97706;
  font-weight: bold;
  margin-top: 5px;
}

</style>
