<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWeatherStore } from '@/stores/weatherStore'
import { useConfigStore } from '@/stores/configStore'
import { useRecommendationStore } from '@/stores/recommendationStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { storeToRefs } from 'pinia'
import { Calendar, Location, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const weatherStore = useWeatherStore()
const configStore = useConfigStore()
const recommendationStore = useRecommendationStore()
const scheduleStore = useScheduleStore()
const { schedules } = storeToRefs(scheduleStore)

const searchQuery = ref('')

// 접속한 기기의 시간대와 관계없이 대한민국(Asia/Seoul)의 오늘을 표시한다.
const getKoreaToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date())
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]))

  return new Date(Number(dateParts.year), Number(dateParts.month) - 1, Number(dateParts.day))
}

const currentDate = ref(getKoreaToday())
const isScheduleDialogOpen = ref(false)
const isRightSidebarOpen = ref(false)
const scheduleForm = ref({ title: '', startTime: '09:00', endTime: '10:00' })
const scheduleColors = ['#2ecc71', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444']

const toDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const selectedDateKey = computed(() => toDateKey(currentDate.value))
const selectedDateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(currentDate.value),
)
const selectedSchedules = computed(() =>
  [...(schedules.value[selectedDateKey.value] || [])].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  ),
)
const todayDateKey = computed(() => toDateKey(getKoreaToday()))
const todaySchedules = computed(() =>
  [...(schedules.value[todayDateKey.value] || [])].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  ),
)

const saveSchedules = () => {
  scheduleStore.saveSchedules()
}

const openScheduleDialog = () => {
  scheduleForm.value = { title: '', startTime: '09:00', endTime: '10:00' }
  isScheduleDialogOpen.value = true
}

const openTodaySchedule = (openDialog = false) => {
  currentDate.value = getKoreaToday()
  isRightSidebarOpen.value = true
  if (openDialog) openScheduleDialog()
}

const addRecommendedActivity = (activity) => {
  const dateKey = todayDateKey.value
  const dateSchedules = schedules.value[dateKey] || []
  const isAlreadyAdded = dateSchedules.some(
    (schedule) => schedule.activityId === activity.id,
  )

  if (isAlreadyAdded) {
    ElMessage.info('이미 오늘 일정에 추가된 활동입니다.')
    return
  }

  schedules.value = {
    ...schedules.value,
    [dateKey]: [
      ...dateSchedules,
      {
        id: `activity-${activity.id}-${Date.now()}`,
        activityId: activity.id,
        title: activity.title,
        startTime: activity.startTime,
        endTime: activity.endTime,
        displayTime: activity.time,
        color: scheduleColors[dateSchedules.length % scheduleColors.length],
      },
    ],
  }
  saveSchedules()
  ElMessage.success(`${activity.title} 활동을 오늘 일정에 추가했습니다.`)
}

const addSchedule = () => {
  const title = scheduleForm.value.title.trim()
  if (!title || scheduleForm.value.startTime >= scheduleForm.value.endTime) return

  const dateSchedules = schedules.value[selectedDateKey.value] || []
  schedules.value = {
    ...schedules.value,
    [selectedDateKey.value]: [
      ...dateSchedules,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title,
        startTime: scheduleForm.value.startTime,
        endTime: scheduleForm.value.endTime,
        color: scheduleColors[dateSchedules.length % scheduleColors.length],
      },
    ],
  }
  saveSchedules()
  isScheduleDialogOpen.value = false
}

const deleteSchedule = (id) => {
  const remaining = selectedSchedules.value.filter((schedule) => schedule.id !== id)
  const nextSchedules = { ...schedules.value }
  if (remaining.length) nextSchedules[selectedDateKey.value] = remaining
  else delete nextSchedules[selectedDateKey.value]
  schedules.value = nextSchedules
  saveSchedules()
}

const moveCalendarMonth = (offset) => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + offset,
    1,
  )
}

const moveCalendarToToday = () => {
  currentDate.value = getKoreaToday()
}

const closeScheduleSidebar = () => {
  if (isRightSidebarOpen.value) isRightSidebarOpen.value = false
}

onMounted(async () => {
  await weatherStore.fetchWeatherForAllCities()
  await weatherStore.fetchCurrentLocationWeather()
})

const currentLocation = computed(() => {
  return weatherStore.currentWeather || weatherStore.weatherData.city_08 || weatherStore.weatherList[0]
})

const filteredWeatherList = computed(() => {
  const query = searchQuery.value.trim()

  if (!query) {
    return weatherStore.weatherList
  }

  return weatherStore.weatherList.filter((item) => item.name.includes(query))
})

const handleDetailJump = (id) => {
  router.push(`/weather/${id}`)
}

const formatTemp = (temp) => {
  if (configStore.unit === 'fahrenheit') {
    return Math.round((temp * 9) / 5 + 32)
  }

  return temp
}

const getWeatherPresentation = (status = '') => {
  const value = status.toLowerCase()
  if (/뇌우|천둥|thunder|storm/.test(value)) return { emoji: '⛈️', text: '뇌우' }
  if (/눈|snow|sleet|진눈깨비/.test(value)) return { emoji: '🌨️', text: '눈' }
  if (/비|rain|소나기|drizzle/.test(value)) return { emoji: '🌧️', text: '비' }
  if (/안개|박무|mist|fog|haze/.test(value)) return { emoji: '🌫️', text: '안개' }
  if (/구름|흐림|cloud|overcast/.test(value)) return { emoji: '☁️', text: '구름 많음' }
  if (/맑|clear|sun/.test(value)) return { emoji: '☀️', text: '맑음' }
  return { emoji: '🌤️', text: status || '날씨 확인 중' }
}

const discomfortIndex = computed(() => {
  if (!currentLocation.value) {
    return 0
  }

  return recommendationStore.calculateDiscomfortIndex(
    currentLocation.value.temp,
    currentLocation.value.humidity,
  )
})

const discomfortText = computed(() => {
  const di = discomfortIndex.value

  if (di >= 80) {
    return 'Bad'
  }

  if (di >= 75) {
    return 'Okay'
  }

  return 'Great'
})


const recommendedActivities = computed(() => {
  return recommendationStore.getRecommendations(currentLocation.value)
})

const hourlyForecast = ref((() => {
  const currentHour = new Date().getHours()
  const mockData = []
  const icons = ['☀️', '⛅', '☁️', '☁️', '🌧️', '🌧️']
  for (let i = 0; i < 24; i++) {
    const hour = (currentHour + i) % 24
    mockData.push({
      time: `${hour}시`,
      temp: 28 + Math.floor(Math.sin((hour - 6) / 4) * 6),
      icon: icons[Math.floor(Math.random() * icons.length)]
    })
  }
  return mockData
})())

const hourlyScrollRef = ref(null)

const scrollRight = () => {
  if (hourlyScrollRef.value) {
    hourlyScrollRef.value.scrollBy({ left: 280, behavior: 'smooth' })
  }
}

const scrollLeft = () => {
  if (hourlyScrollRef.value) {
    hourlyScrollRef.value.scrollBy({ left: -280, behavior: 'smooth' })
  }
}

const ITEM_WIDTH = 70
const CHART_HEIGHT = 80
const PADDING_TOP = 30

const points = computed(() => {
  if (hourlyForecast.value.length <= 1) return []
  const temps = hourlyForecast.value.map((h) => h.temp)
  const maxTemp = Math.max(...temps)
  const minTemp = Math.min(...temps)
  const range = maxTemp - minTemp || 1

  return hourlyForecast.value.map((item, idx) => {
    const x = idx * ITEM_WIDTH + ITEM_WIDTH / 2
    const y = CHART_HEIGHT - ((item.temp - minTemp) / range) * (CHART_HEIGHT - PADDING_TOP)
    return { x, y, temp: item.temp }
  })
})

const polylinePoints = computed(() => {
  return points.value.map((p) => `${p.x},${p.y}`).join(' ')
})
</script>

<template>
  <div class="dashboard-container" v-loading="weatherStore.isLoading" @click="closeScheduleSidebar">
    <div class="greeting">
      <span class="dashboard-eyebrow">SMART WEATHER DASHBOARD</span>
      <h1>오늘도 기분 좋은 하루 보내세요</h1>

      <p>오늘의 날씨를 확인하고 하루를 미리 계획해보세요.</p>
    </div>

    <!-- Main Grid -->
    <div class="cards-grid new-layout">
      <!-- 1. Top Card (Combined) -->
      <div class="card top-card">
        <div class="main-info">
          <p class="location-label">현재 위치</p>
          <h2 class="location-name">{{ currentLocation?.name || '울산광역시' }} <el-icon><Location /></el-icon></h2>
          <div class="weather-brief">
            <span class="weather-icon-shell">
              <span class="main-icon">{{ getWeatherPresentation(currentLocation?.status).emoji }}</span>
              <img
                v-if="currentLocation?.icon"
                :src="currentLocation.icon"
                :alt="currentLocation.status"
                class="main-weather-icon"
                @error="$event.currentTarget.style.display = 'none'"
              />
            </span>
            <h1 class="main-temp">{{ currentLocation ? formatTemp(currentLocation.temp) : 30 }}°{{ configStore.unit === 'celsius' ? 'C' : 'F' }}</h1>
          </div>
          <p class="weather-status">{{ currentLocation?.status || '날씨 확인 중' }} | 체감 {{ formatTemp(currentLocation?.feelsLike ?? currentLocation?.temp ?? 0) }}°</p>
          <p class="extra-info">습도 {{ currentLocation?.humidity ?? '-' }}% | 최근 1시간 강수량 {{ currentLocation?.precipitation ?? 0 }}mm | 불쾌지수 {{ discomfortIndex }}</p>
        </div>
        
        <div class="hourly-part">
          <button class="scroll-btn left" @click="scrollLeft">&lt;</button>
          <button class="scroll-btn right" @click="scrollRight">&gt;</button>
          <div class="hourly-scroll" ref="hourlyScrollRef">
            <div class="hourly-content" :style="{ width: (hourlyForecast.length * 70) + 'px' }">
              <svg class="chart-svg" :width="hourlyForecast.length * 70" height="90">
                <line v-for="(p, i) in points" :key="'l' + i" :x1="p.x" :y1="p.y" :x2="p.x" :y2="90" stroke="#f1f5f9" stroke-width="2" />
                <polyline :points="polylinePoints" class="temp-line" fill="none" stroke="#cbd5e1" stroke-width="3" />
                <circle v-for="(p, i) in points" :key="'c' + i" :cx="p.x" :cy="p.y" r="4" fill="#e2e8f0" stroke="#ffffff" stroke-width="2" />
              </svg>
              <div class="forecast-items">
                <div class="forecast-item" v-for="(item, idx) in hourlyForecast" :key="idx" :style="{ width: '70px' }">
                  <span class="temp-label" :style="{ top: points[idx]?.y - 25 + 'px' }">{{ item.temp }}°</span>
                  <div class="icon-label">{{ item.icon }}</div>
                  <div class="time-label">{{ item.time }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="daily-stats">
            <div class="stat-col"><span>현재 / 체감</span><strong>{{ currentLocation ? formatTemp(currentLocation.temp) : '-' }}° / {{ currentLocation ? formatTemp(currentLocation.feelsLike) : '-' }}°</strong></div>
            <div class="stat-col"><span>습도</span><strong>{{ currentLocation?.humidity ?? '-' }}%</strong></div>
            <div class="stat-col"><span>강수량 (1h)</span><strong>{{ currentLocation?.precipitation ?? 0 }} mm</strong></div>
            <div class="stat-col"><span>풍속</span><strong>{{ currentLocation?.wind ?? '-' }} m/s</strong></div>
          </div>
        </div>
      </div>

      <!-- 2. Middle Row -->
      <div class="card activity-card">
        <div class="card-header">
          <h3>오늘의 활동 추천</h3>
          <a href="#">전체 보기 ></a>
        </div>
        <p class="sub-desc">기온·습도·강수량·불쾌지수를 종합한 추천이에요 · 카드를 누르면 오늘 일정에 추가됩니다</p>
        <div class="activity-list">
          <div
            class="activity-item"
            v-for="act in recommendedActivities"
            :key="act.id"
            role="button"
            tabindex="0"
            :aria-label="`${act.title} 오늘 일정에 추가`"
            @click="addRecommendedActivity(act)"
            @keydown.enter="addRecommendedActivity(act)"
            @keydown.space.prevent="addRecommendedActivity(act)"
          >
            <div class="act-badge" :class="act.type === '추천' ? 'good' : (act.type === '보통' ? 'normal' : 'bad')">{{ act.type }}</div>
            <div class="act-icon">{{ act.icon }}</div>
            <div class="act-title">{{ act.title }}</div>
            <div class="act-time">{{ act.time }}</div>
            <div class="act-score">추천 지수 <strong>{{ act.score }}</strong></div>
            <div class="act-reason">{{ act.reason }}</div>
          </div>
        </div>
      </div>

      <!-- 3. Schedule Card -->
      <div class="card schedule-card">
        <div class="card-header">
          <h3>오늘의 내 스케줄</h3>
          <button type="button" class="schedule-add-icon" aria-label="오늘 일정 추가" @click.stop="openTodaySchedule(true)">+</button>
        </div>
        <div class="schedule-list">
          <div class="schedule-item" v-for="sched in todaySchedules" :key="sched.id">
            <div class="sched-icon" :style="{ backgroundColor: sched.color }"></div>
            <div class="sched-info">
              <strong>{{ sched.title }}</strong>
              <span>{{ sched.displayTime || `${sched.startTime} - ${sched.endTime}` }}</span>
            </div>
          </div>
          <p v-if="!todaySchedules.length" class="schedule-empty">오늘 등록된 일정이 없습니다.</p>
        </div>
        <button class="more-btn" @click.stop="router.push('/schedule')">전체 스케줄 보기 ></button>
      </div>

      <!-- 4. Bottom Row -->
      <div class="bottom-wrapper">
        <div class="card dust-card">
          <div class="card-header">
            <h3>미세먼지 농도</h3>
            <span class="status-good">{{ currentLocation?.airQuality?.status || '확인 중' }} {{ currentLocation?.airQuality?.pm10 ?? '-' }} μg/m³</span>
          </div>
          <div class="dust-stats">
            <div class="dust-col"><span>미세먼지 (PM10)</span><strong>{{ currentLocation?.airQuality?.pm10 ?? '-' }} <small>μg/m³</small></strong><span class="status-good">{{ currentLocation?.airQuality?.status || '-' }}</span></div>
            <div class="dust-col"><span>초미세먼지 (PM2.5)</span><strong>{{ currentLocation?.airQuality?.pm25 ?? '-' }} <small>μg/m³</small></strong><span>실시간</span></div>
            <div class="dust-col"><span>이산화질소 (NO₂)</span><strong>{{ currentLocation?.airQuality?.no2 ?? '-' }} <small>μg/m³</small></strong><span>AQI {{ currentLocation?.airQuality?.aqi ?? '-' }}</span></div>
          </div>
          <small class="air-source">대기질 데이터: Open-Meteo · CAMS</small>
        </div>

        <div class="card discomfort-card">
          <div class="card-header">
            <h3>불쾌지수</h3>
            <span class="status-ok">{{ discomfortIndex }} {{ discomfortText }}</span>
          </div>
          <div class="discomfort-bar-wrapper">
             <div class="discomfort-bar">
               <div class="bar-fill" :style="{ width: Math.min(discomfortIndex, 100) + '%' }"></div>
             </div>
             <div class="bar-labels">
               <span>Great<br>0-75</span>
               <span>Okay<br>75-80</span>
               <span>Bad<br>80+</span>
             </div>
          </div>
        </div>
      </div>

      <!-- 5. Regions Card (Restored) -->
      <div class="card regions-card">
        <h3>지역 별 날씨 현황</h3>
        <el-input v-model="searchQuery" placeholder="Search" :prefix-icon="Search" class="search-input" />
        <div class="region-list">
          <div v-for="item in filteredWeatherList.slice(0, 5)" :key="item.id" class="region-row" @click="handleDetailJump(item.id)">
            <span class="region-weather-emoji" aria-hidden="true">{{ getWeatherPresentation(item.status).emoji }}</span>
            <span class="region-weather-status"><strong>{{ item.name }}</strong> · {{ getWeatherPresentation(item.status).text }}</span>
            <span class="region-temperature">{{ formatTemp(item.temp) }}°{{ configStore.unit === 'celsius' ? 'C' : 'F' }}</span>
          </div>
        </div>
        <el-button round class="more-btn" @click="router.push('/regions')"> 모든 지역 보기 </el-button>
      </div>
    </div>
    <!-- Right Sidebar -->
    <div class="right-sidebar" :class="{ open: isRightSidebarOpen }" @click.stop>
      <button type="button" class="sidebar-handle" aria-label="일정 달력 열기" @click="isRightSidebarOpen = !isRightSidebarOpen">
        <el-icon>
          <Calendar />
        </el-icon>
      </button>

      <div class="sidebar-content">
        <el-calendar v-model="currentDate" class="schedule-calendar">
          <template #header="{ date }">
            <div class="calendar-header">
              <div class="calendar-title"><strong>{{ date }}</strong></div>
              <div class="calendar-actions">
                <button type="button" @click="moveCalendarMonth(-1)">이전 달</button>
                <button type="button" @click="moveCalendarToToday">오늘</button>
                <button type="button" @click="moveCalendarMonth(1)">다음 달</button>
              </div>
            </div>
          </template>
          <template #date-cell="{ data }">
            <div class="calendar-day" :class="{ 'has-schedule': schedules[data.day]?.length }">
              <span>{{ Number(data.day.split('-')[2]) }}</span>
              <i v-if="schedules[data.day]?.length"></i>
            </div>
          </template>
        </el-calendar>

        <section class="day-schedules">
          <h3>{{ selectedDateLabel }} 일정</h3>
          <div v-if="selectedSchedules.length" class="day-schedule-list">
            <div v-for="schedule in selectedSchedules" :key="schedule.id" class="day-schedule-item">
              <i :style="{ backgroundColor: schedule.color }"></i>
              <span class="schedule-time">{{ schedule.displayTime || `${schedule.startTime} - ${schedule.endTime}` }}</span>
              <strong>{{ schedule.title }}</strong>
              <button type="button" class="delete-schedule" :aria-label="`${schedule.title} 삭제`" @click="deleteSchedule(schedule.id)">×</button>
            </div>
          </div>
          <p v-else class="empty-schedule">등록된 일정이 없습니다.</p>
          <button type="button" class="add-schedule-button" @click="openScheduleDialog">＋ 일정 추가</button>
        </section>
      </div>
    </div>

    <el-dialog v-model="isScheduleDialogOpen" title="일정 추가" width="360px" class="schedule-dialog">
      <form class="schedule-form" @submit.prevent="addSchedule">
        <label>일정 이름<input v-model="scheduleForm.title" maxlength="30" placeholder="일정을 입력하세요" autofocus /></label>
        <div class="time-fields">
          <label>시작 시간<input v-model="scheduleForm.startTime" type="time" /></label>
          <label>종료 시간<input v-model="scheduleForm.endTime" type="time" /></label>
        </div>
        <p v-if="scheduleForm.startTime >= scheduleForm.endTime" class="form-error">종료 시간은 시작 시간보다 늦어야 합니다.</p>
        <div class="dialog-actions">
          <button type="button" @click="isScheduleDialogOpen = false">취소</button>
          <button type="submit" class="primary" :disabled="!scheduleForm.title.trim() || scheduleForm.startTime >= scheduleForm.endTime">추가</button>
        </div>
      </form>
    </el-dialog>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding-right: 60px;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  margin-bottom: 20px;

  --el-input-border-radius: 20px;
  --el-input-bg-color: #ffffff;
}

/* Greeting */
.dashboard-eyebrow {
  display: block;
  margin-bottom: 8px;
  color: #3b82f6;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.4px;
}
.greeting h1 {
  font-size: 32px;
  line-height: 1.2;
  margin: 0 0 10px 0;
  color: #111;
}

.greeting p {
  color: #666;
  margin: 0 0 40px 0;
  line-height: 1.6;
}

/* Main Grid */
.cards-grid {
  display: grid;
  gap: 20px;
  width: 100%;
}

/* PC */
@media (min-width: 769px) {
  .cards-grid {
    grid-template-columns: 1fr 1fr 0.8fr;
    grid-template-rows: auto auto auto;
  }
  .main-card {
    grid-column: 1 / 3;
    grid-row: 1;
  }
  .hourly-card {
    grid-column: 1 / 3;
    grid-row: 2;
  }
  .green-card {
    grid-column: 1;
    grid-row: 3;
  }
  .blue-card {
    grid-column: 2;
    grid-row: 3;
  }
  .pink-card {
    grid-column: 3;
    grid-row: 1 / 4;
  }
}

.card {
  padding: 30px;
  border-radius: 24px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  color: #1e293b;
  position: relative;
  box-sizing: border-box;
}

.card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
}

.main-card {
  background: linear-gradient(135deg, #f0f5ff, #e3eeff);
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.main-card-content p {
  margin: 5px 0;
  color: #64748b;
  font-weight: 500;
}
.location-label {
  font-size: 14px;
}
.location-name {
  font-size: 24px;
  margin: 10px 0;
  color: #1e293b;
  font-weight: 700;
}
.main-temp {
  font-size: 80px;
  font-weight: 800;
  color: #1e293b;
  margin: 10px 0;
  letter-spacing: -3px;
}
.weather-status {
  font-size: 16px;
  margin-top: 15px !important;
}
.temp-range {
  font-size: 14px;
  margin-top: 5px !important;
}
.extra-info {
  font-size: 14px;
  margin-top: 5px !important;
  font-weight: 600 !important;
}

.hourly-card {
  position: relative;
  background-color: #ffffff;
}
.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  color: #64748b;
  font-weight: bold;
}
.scroll-btn:hover {
  background: #f8fafc;
}
.scroll-btn.left {
  left: -15px;
}
.scroll-btn.right {
  right: -15px;
}
.hourly-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  padding-top: 10px;
  padding-bottom: 10px;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hourly-scroll::-webkit-scrollbar {
  display: none;
}
.hourly-content {
  position: relative;
  height: 180px;
}
.chart-svg {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}
.forecast-items {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  height: 100%;
  z-index: 2;
}
.forecast-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.temp-label {
  position: absolute;
  font-weight: 700;
  font-size: 15px;
  color: #1e293b;
}
.icon-label {
  position: absolute;
  top: 110px;
  font-size: 26px;
}
.time-label {
  position: absolute;
  top: 150px;
  font-size: 13px;
  color: #94a3b8;
  font-weight: 600;
}

.sub-card {
  display: flex;
  flex-direction: column;
}
.sub-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 1px;
  margin: 0 0 5px 0;
  text-transform: uppercase;
}
.sub-card h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: #1e293b;
}
.sub-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 20px 0;
}

.pink-card {
  background: linear-gradient(135deg, #fff5f8, #fce7f3);
}

.green-card {
  background: linear-gradient(135deg, #f8faff, #e2e8f0);
}

.blue-card {
  background: linear-gradient(135deg, #fffcf9, #ffedd5);
}

/* 공통 데이터 영역 */
.content {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
  align-items: baseline;
}

.stat {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat .label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.stat .value {
  font-size: 20px;
  font-weight: 800;
}

.current-temp {
  font-size: 32px !important;
  white-space: nowrap;
}

.stat .value small {
  font-size: 12px;
  font-weight: 600;
}

/* Air Quality */
.air-quality {
  display: flex;
  gap: 10px;
  margin-top: auto;
  align-items: stretch;
}
.stat-box {
  background: #ffffff;
  padding: 15px;
  border-radius: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.stat-box .label {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 5px;
}
.stat-box .value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}
.stat-box .value small {
  font-size: 10px;
  color: #94a3b8;
}

/* Region List */
.region-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 15px;
}

.region-row {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 7px;
  flex: 1;
  box-sizing: border-box;

  min-height: 148px;
  padding: 17px 14px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 12px;

  cursor: pointer;
  font-weight: 600;

  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
}

.region-row:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-3px);
  box-shadow: 0 8px 18px rgba(124, 58, 237, 0.08);
}
.region-weather-emoji {
  margin-bottom: 3px;
  font-size: 37px;
  line-height: 1;
  filter: drop-shadow(0 4px 5px rgba(30, 41, 59, 0.09));
}
.region-weather-status {
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}
.region-weather-status strong { color: #334155; font-weight: 700; }
.region-temperature {
  color: #1e293b;
  font-size: 21px;
  font-weight: 750;
  letter-spacing: -0.5px;
}

.more-btn {
  margin-top: 20px;
  width: 100%;

  border: none;
  background: rgba(255, 255, 255, 0.6);
  font-weight: bold;
}

/* Discomfort */
.sentiment-content-new {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  height: 100%;
  flex: 1;
}

.sentiment-score {
  text-align: right;
  margin-top: auto;
}

.score-value {
  font-size: 48px;
  font-weight: 800;
  color: #f97316;
  line-height: 1;
}

.score-label {
  font-size: 16px;
  font-weight: 700;
  color: #f97316;
  margin-left: 5px;
}

/* Right Sidebar */
.right-sidebar {
  position: fixed;
  right: 0;
  top: 0;

  width: 50px;
  height: 100vh;

  background: #ffffff;
  box-shadow: -2px 0 15px rgba(0, 0, 0, 0.05);

  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  overflow: hidden;
  z-index: 1000;

  border-radius: 30px 0 0 30px;
}

.right-sidebar:hover,
.right-sidebar.open {
  width: 440px;
}

.sidebar-handle {
  position: absolute;
  left: 15px;
  top: 30px;

  font-size: 24px;
  color: #111;

  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.sidebar-content {
  width: 440px;
  height: 100vh;
  box-sizing: border-box;
  padding: 24px 14px 40px 54px;

  opacity: 0;

  transition: opacity 0.4s ease;

  pointer-events: none;

  margin-left: 0;
  overflow-y: auto;
}

.right-sidebar:hover .sidebar-content,
.right-sidebar.open .sidebar-content {
  opacity: 1;
  pointer-events: auto;
}

.schedule-calendar {
  --el-calendar-selected-bg-color: transparent;
  border: none;
}
.schedule-calendar :deep(.el-calendar__header) {
  display: block;
  padding: 0 0 22px;
  border-bottom: none;
}
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.calendar-title {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  color: #111827;
}
.calendar-title strong { font-size: 17px; }
.calendar-actions { display: flex; gap: 6px; }
.calendar-actions button,
.dialog-actions button {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #4b5563;
  padding: 8px 10px;
  font-weight: 600;
  cursor: pointer;
}
.calendar-actions button:hover { border-color: #3b82f6; color: #2563eb; }
.schedule-calendar :deep(.el-calendar__body) { padding: 0; }
.schedule-calendar :deep(.el-calendar-table thead th) {
  padding: 8px 0 13px;
  color: #4b5563;
  font-size: 13px;
  font-weight: 700;
}
.schedule-calendar :deep(.el-calendar-table td) { border: none; }
.schedule-calendar :deep(.el-calendar-day) {
  height: 48px;
  padding: 3px;
}
.schedule-calendar :deep(.el-calendar-table td.is-selected) { background: transparent; }
.schedule-calendar :deep(.el-calendar-table td.prev .calendar-day),
.schedule-calendar :deep(.el-calendar-table td.next .calendar-day) { color: #d1d5db; }
.calendar-day {
  width: 36px;
  height: 36px;
  margin: auto;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #1f2937;
  font-size: 13px;
  transition: 0.2s ease;
}
.schedule-calendar :deep(.el-calendar-table td.is-selected .calendar-day) {
  color: #fff;
  background: #4285e5;
  box-shadow: 0 4px 10px rgba(66, 133, 229, 0.3);
}
.calendar-day.has-schedule i {
  position: absolute;
  bottom: 3px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #3b82f6;
}
.schedule-calendar :deep(td.is-selected .calendar-day.has-schedule i) { background: #fff; }
.day-schedules {
  margin-top: 15px;
  padding-top: 24px;
  border-top: 1px solid #eef0f3;
}
.day-schedules h3 {
  margin: 0 0 20px;
  color: #111827;
  font-size: 16px;
}
.day-schedule-list { display: flex; flex-direction: column; gap: 7px; }
.day-schedule-item {
  display: grid;
  grid-template-columns: 8px 112px 1fr 24px;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 3px 0;
  color: #111827;
}
.day-schedule-item > i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.schedule-time { color: #6b7280; font-size: 13px; }
.day-schedule-item strong {
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.delete-schedule {
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #9ca3af;
  font-size: 20px;
  cursor: pointer;
}
.delete-schedule:hover { color: #ef4444; background: #fef2f2; }
.empty-schedule { margin: 16px 0; color: #9ca3af; font-size: 13px; text-align: center; }
.add-schedule-button {
  display: block;
  margin: 22px auto 0;
  padding: 11px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  background: #fff;
  color: #6b7280;
  font-weight: 700;
  cursor: pointer;
}
.add-schedule-button:hover { color: #2563eb; border-color: #93c5fd; }
.schedule-form { display: flex; flex-direction: column; gap: 18px; }
.schedule-form label { display: flex; flex-direction: column; gap: 7px; color: #374151; font-size: 13px; font-weight: 700; }
.schedule-form input {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 11px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  font: inherit;
  outline: none;
}
.schedule-form input:focus { border-color: #3b82f6; }
.time-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-error { margin: -8px 0 0; color: #ef4444; font-size: 12px; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
.dialog-actions .primary { color: #fff; border-color: #3b82f6; background: #3b82f6; }
.dialog-actions .primary:disabled { cursor: not-allowed; opacity: 0.45; }

/* ==================================================
   Mobile
================================================== */
@media (max-width: 768px) {
  .dashboard-container {
    max-width: none;
    width: 100%;

    margin: 0;

    padding-right: 55px;

    box-sizing: border-box;
  }

  /* 검색 */
  .search-input {
    width: 100%;
    max-width: none;
  }

  /* 5번: 모바일 제목 크기 조정 */
  .greeting h1 {
    font-size: 28px;
    line-height: 1.25;
  }

  .greeting p {
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 30px;
  }

  /* 전체 카드 1열 */
  .cards-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;

    gap: 18px;
  }
  .hourly-card {
    grid-column: 1;
    grid-row: auto;
  }

  .pink-card {
    grid-row: auto;
    grid-column: 1;
  }

  .card {
    width: 100%;
    max-width: none;

    padding: 24px 20px;

    box-sizing: border-box;
  }

  /*
   3번:
   온도 카드 내부 겹침 방지
  */
  .temperature-content {
    display: grid;

    grid-template-columns: 1fr 1fr;

    gap: 20px 14px;

    margin-top: 28px;

    align-items: start;
  }

  .temperature-content .stat {
    min-width: 0;
  }

  .temperature-content .stat:nth-child(3) {
    grid-column: 1 / -1;
  }

  .temperature-content .value {
    display: block;

    font-size: 20px;

    white-space: nowrap;
  }

  .current-temp {
    font-size: 28px !important;
  }

  /*
   4번:
   지역별 날씨 카드 모바일 최적화
  */
  .pink-card {
    padding: 24px 20px;
  }

  .region-list {
    gap: 12px;
  }

  .region-row {
    width: 100%;

    padding: 14px 16px;

    box-sizing: border-box;

    font-size: 14px;
  }

  .more-btn {
    height: 40px;
    margin-top: 16px;
  }

  /* 미세먼지 */
  .air-quality {
    display: grid;
    grid-template-columns: repeat(3, 1fr);

    gap: 10px;

    margin-top: 20px;
  }

  .air-quality .stat {
    min-width: 0;
  }

  .air-quality .label {
    font-size: 12px;
  }

  .air-quality .value {
    font-size: 18px;
  }

  /* 불쾌지수 */
  .sentiment-content {
    gap: 10px;
  }
}

/* 더 작은 스마트폰 */
@media (max-width: 480px) {
  .dashboard-container {
    padding-right: 52px;
  }

  .greeting h1 {
    font-size: 26px;
  }

  .greeting p {
    font-size: 13px;
  }

  .card {
    padding: 22px 18px;
    border-radius: 20px;
  }

  .card h3 {
    font-size: 17px;
  }

  /*
   작은 화면에서도 온도 카드가
   명확하게 보이도록 2열 유지
  */
  .temperature-content {
    grid-template-columns: 1fr 1fr;
    gap: 18px 10px;
  }

  .temperature-content .stat:nth-child(3) {
    grid-column: 1 / -1;
  }

  .temperature-content .label {
    font-size: 12px;
  }

  .temperature-content .value {
    font-size: 18px;
  }

  .current-temp {
    font-size: 26px !important;
  }

  /*
   지역 카드
  */
  .region-row {
    padding: 13px 14px;
    font-size: 14px;
  }

  /*
   미세먼지는 모바일 폭이 아주 작으면
   2열 + 마지막 항목 아래 배치
  */
  .air-quality {
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }

  .air-quality .stat:last-child {
    grid-column: 1 / -1;
  }

  .sentiment-content {
    margin-top: 22px;
  }

  .sentiment-item .label {
    font-size: 13px;
  }

  .sentiment-item .value {
    font-size: 22px;
  }
}

.new-layout {
  display: grid !important;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}
.top-card {
  grid-column: 1 / 3;
  display: flex;
  background: linear-gradient(135deg, rgba(255,255,255,.97) 0%, rgba(244,249,255,.96) 48%, rgba(232,243,255,.94) 100%) !important;
  border: 1px solid rgba(255,255,255,.9);
  box-shadow: 0 12px 32px rgba(49, 91, 138, .12), inset 0 1px 0 rgba(255,255,255,.95);
  padding: 30px;
  gap: 30px;
}
.main-info {
  flex: 1;
}
.hourly-part {
  flex: 2;
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.daily-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  background: rgba(255,255,255,0.5);
  padding: 15px;
  border-radius: 12px;
}
.daily-stats .stat-col {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #64748b;
}
.daily-stats .stat-col strong {
  font-size: 14px;
  color: #1e293b;
  margin-top: 5px;
}

.activity-card {
  grid-column: 1;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7) !important;
}
.activity-list {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  margin-top: 5px;
  padding-top: 15px;
  padding-bottom: 10px;
}
.activity-item {
  min-width: 120px;
  background: #ffffff;
  padding: 15px;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  text-align: center;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.activity-item:hover,
.activity-item:focus-visible {
  transform: translateY(-3px);
  box-shadow: 0 7px 18px rgba(34, 197, 94, 0.14);
  outline: none;
}
.act-badge {
  position: absolute;
  top: -10px;
  right: 10px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  color: white;
  font-weight: bold;
  z-index: 10;
}
.act-badge.good { background: #22c55e; }
.act-badge.normal { background: #facc15; }
.act-badge.bad { background: #ef4444; }
.act-icon { font-size: 32px; margin: 10px 0; }
.act-title { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
.act-time { font-size: 12px; color: #64748b; }
.act-score { font-size: 11px; margin-top: 10px; color: #94a3b8; }
.act-reason {
  margin-top: 8px;
  font-size: 11px;
  line-height: 1.4;
  color: #64748b;
}
.main-weather-icon {
  position: absolute;
  inset: 0;
  width: 88px;
  height: 88px;
  object-fit: contain;
  filter: saturate(1.22) contrast(1.12) drop-shadow(0 4px 6px rgba(42,72,105,.22));
  transform: scale(1.08);
}
.weather-icon-shell {
  position: relative;
  flex: 0 0 88px;
  width: 88px;
  height: 88px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.96);
  border-radius: 50%;
  background: radial-gradient(circle at 38% 30%, #ffffff 0%, #f7fbff 48%, #dcecff 100%);
  box-shadow: 0 8px 20px rgba(63,112,163,.17), inset 0 0 18px rgba(255,255,255,.92);
}
.weather-icon-shell .main-icon {
  font-size: 48px;
  line-height: 1;
  filter: drop-shadow(0 3px 4px rgba(30,64,95,.16));
}

.schedule-card {
  grid-column: 2;
  grid-row: 2 / 4;
  background: linear-gradient(135deg, #faf5ff, #f3e8ff) !important;
  display: flex;
  flex-direction: column;
}
.schedule-list {
  flex: 1;
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.schedule-item {
  display: flex;
  align-items: center;
  background: #ffffff;
  padding: 15px;
  border-radius: 12px;
  gap: 15px;
}
.sched-icon {
  width: 9px;
  height: 9px;
  flex: 0 0 9px;
  border-radius: 50%;
}
.sched-info { display: flex; flex-direction: column; }
.sched-info strong { font-size: 14px; color: #1e293b; }
.sched-info span { font-size: 12px; color: #64748b; margin-top: 4px; }
.schedule-add-icon {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
  color: #7c3aed;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.schedule-add-icon:hover { background: #fff; }
.schedule-empty {
  margin: auto 0;
  padding: 28px 12px;
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
}
.schedule-card .more-btn {
  height: 42px;
  margin-top: 18px;
  border: 1px solid rgba(124, 58, 237, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
  color: #6d5a86;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.1px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.schedule-card .more-btn:hover {
  border-color: rgba(124, 58, 237, 0.3);
  background: #ffffff;
  color: #7c3aed;
  transform: translateY(-1px);
}
.schedule-card .more-btn:active { transform: translateY(0); }

.bottom-wrapper {
  grid-column: 1;
  display: flex;
  gap: 20px;
}
.dust-card, .discomfort-card {
  flex: 1;
  border: 1px solid rgba(255,255,255,.82);
  box-shadow: 0 10px 28px rgba(57,82,112,.09), inset 0 1px 0 rgba(255,255,255,.82);
}
.dust-card {
  background: linear-gradient(140deg, rgba(244,252,255,.97) 0%, rgba(222,244,249,.95) 52%, rgba(210,235,247,.94) 100%) !important;
}
.discomfort-card {
  background: linear-gradient(140deg, rgba(255,250,244,.98) 0%, rgba(255,237,224,.96) 52%, rgba(245,229,246,.94) 100%) !important;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header h3 { margin: 0; font-size: 16px; color: #1e293b; }
.card-header a { font-size: 13px; color: #64748b; text-decoration: none; }
.status-good { color: #3b82f6; font-weight: bold; font-size: 13px; }
.status-ok { color: #d97706; font-weight: bold; font-size: 18px; }

.dust-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}
.dust-col {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #64748b;
}
.dust-col strong { font-size: 18px; color: #1e293b; margin: 5px 0; }
.air-source { display: block; margin-top: 17px; color: #7c8b9d; font-size: 10px; }

.regions-card {
  grid-column: 1 / -1; /* Span all columns in the new layout */
  background: linear-gradient(135deg, rgba(247,250,255,.97) 0%, rgba(232,240,255,.96) 48%, rgba(237,230,251,.94) 100%) !important;
  border: 1px solid rgba(255,255,255,.86);
  box-shadow: 0 12px 30px rgba(65,74,130,.1), inset 0 1px 0 rgba(255,255,255,.9);
  margin-top: 10px;
}
.regions-card .region-row {
  border: 1px solid rgba(255,255,255,.72);
  background: rgba(255,255,255,.48);
  box-shadow: 0 5px 14px rgba(76,91,145,.055);
}
.regions-card .region-row:hover {
  background: rgba(255,255,255,.82);
  box-shadow: 0 9px 20px rgba(76,91,145,.11);
}

.discomfort-bar-wrapper {
  margin-top: 30px;
}
.discomfort-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  position: relative;
}
.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #facc15, #ef4444);
  border-radius: 4px;
}
.bar-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 11px;
  color: #64748b;
  text-align: center;
}

</style>
