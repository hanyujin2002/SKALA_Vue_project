<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useWeatherStore } from '@/stores/weatherStore'
import { useRecommendationStore } from '@/stores/recommendationStore'
import { useScheduleStore } from '@/stores/scheduleStore'

const weatherStore = useWeatherStore()
const recommendationStore = useRecommendationStore()
const scheduleStore = useScheduleStore()

const getKoreaDateKey = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

const selectedDate = ref(getKoreaDateKey())
const hourlyScrollRef = ref(null)
const form = ref({ title: '', startTime: '09:00', endTime: '10:00' })
const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444']

const currentWeather = computed(() =>
  weatherStore.currentWeather || weatherStore.weatherData.city_08 || weatherStore.weatherList[0],
)
const weatherEmoji = computed(() => {
  const status = (currentWeather.value?.status || '').toLowerCase()
  if (/뇌우|천둥|thunder|storm/.test(status)) return '⛈️'
  if (/눈|snow|sleet|진눈깨비/.test(status)) return '🌨️'
  if (/비|rain|소나기|drizzle/.test(status)) return '🌧️'
  if (/안개|박무|mist|fog|haze/.test(status)) return '🌫️'
  if (/구름|흐림|cloud|overcast/.test(status)) return '☁️'
  return '☀️'
})
const selectedSchedules = computed(() => scheduleStore.getSchedulesByDate(selectedDate.value))
const recommendations = computed(() => recommendationStore.getRecommendations(currentWeather.value, 4))
const hourlyForecast = computed(() => {
  const currentHour = new Date().getHours()
  const baseTemp = currentWeather.value?.temp ?? 24
  const status = (currentWeather.value?.status || '').toLowerCase()
  const icon = /비|rain|소나기/.test(status) ? '🌧️' : /구름|흐림|cloud/.test(status) ? '⛅' : '☀️'

  return Array.from({ length: 24 }, (_, index) => {
    const hour = (currentHour + index) % 24
    return {
      time: `${hour}시`,
      temp: baseTemp + Math.round(Math.sin((hour - 8) / 4) * 4),
      icon,
    }
  })
})
const chartPoints = computed(() => {
  const temps = hourlyForecast.value.map((item) => item.temp)
  const maxTemp = Math.max(...temps)
  const minTemp = Math.min(...temps)
  const range = maxTemp - minTemp || 1
  return hourlyForecast.value.map((item, index) => ({
    x: index * 76 + 38,
    y: 75 - ((item.temp - minTemp) / range) * 42,
  }))
})
const chartPolyline = computed(() => chartPoints.value.map(({ x, y }) => `${x},${y}`).join(' '))
const dateLabel = computed(() => {
  const [year, month, day] = selectedDate.value.split('-').map(Number)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  }).format(new Date(year, month - 1, day))
})

onMounted(async () => {
  await weatherStore.fetchWeatherForAllCities()
  await weatherStore.fetchCurrentLocationWeather()
})

const addSchedule = () => {
  const title = form.value.title.trim()
  if (!title) return ElMessage.warning('일정 이름을 입력해주세요.')
  if (form.value.startTime >= form.value.endTime) {
    return ElMessage.warning('종료 시간은 시작 시간보다 늦어야 합니다.')
  }
  scheduleStore.addSchedule(selectedDate.value, {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    startTime: form.value.startTime,
    endTime: form.value.endTime,
    color: colors[selectedSchedules.value.length % colors.length],
  })
  form.value = { title: '', startTime: '09:00', endTime: '10:00' }
  ElMessage.success('일정을 추가했습니다.')
}

const addRecommendation = (activity) => {
  const exists = selectedSchedules.value.some((item) => item.activityId === activity.id)
  if (exists) return ElMessage.info('이미 이 날짜에 추가된 추천 활동입니다.')
  scheduleStore.addSchedule(selectedDate.value, {
    id: `activity-${activity.id}-${Date.now()}`,
    activityId: activity.id,
    title: activity.title,
    startTime: activity.startTime,
    endTime: activity.endTime,
    displayTime: activity.time,
    color: colors[selectedSchedules.value.length % colors.length],
  })
  ElMessage.success(`${activity.title} 활동을 추가했습니다.`)
}

const scrollHourly = (direction) => {
  hourlyScrollRef.value?.scrollBy({ left: direction * 380, behavior: 'smooth' })
}
</script>

<template>
  <div class="schedule-page" v-loading="weatherStore.isLoading">
    <header class="page-header">
      <div>
        <p>WEATHER PLANNER</p>
        <h1>내 스케줄</h1>
        <span>날씨를 확인하고 하루 일정을 계획해보세요.</span>
      </div>
      <label class="date-picker">관리할 날짜<input v-model="selectedDate" type="date" /></label>
    </header>

    <section class="weather-summary">
      <div class="weather-location">
        <span class="summary-icon-shell">
          <span class="summary-icon-fallback">{{ weatherEmoji }}</span>
          <img
            v-if="currentWeather?.icon"
            :src="currentWeather.icon"
            :alt="currentWeather.status"
            @error="$event.currentTarget.style.display = 'none'"
          />
        </span>
        <div><span>{{ currentWeather?.name || '현재 위치' }}</span><strong>{{ currentWeather?.temp ?? '-' }}°C</strong></div>
      </div>
      <div class="weather-stat"><span>날씨</span><strong>{{ currentWeather?.status || '-' }}</strong></div>
      <div class="weather-stat"><span>습도</span><strong>{{ currentWeather?.humidity ?? '-' }}%</strong></div>
      <div class="weather-stat"><span>강수량</span><strong>{{ currentWeather?.precipitation ?? 0 }} mm</strong></div>
      <div class="weather-stat"><span>풍속</span><strong>{{ currentWeather?.wind ?? '-' }} m/s</strong></div>
    </section>

    <div class="schedule-layout">
      <section class="panel schedule-panel">
        <div class="panel-title"><div><p>SELECTED DAY</p><h2>{{ dateLabel }}</h2></div><span>{{ selectedSchedules.length }}개 일정</span></div>
        <div v-if="selectedSchedules.length" class="timeline">
          <article v-for="item in selectedSchedules" :key="item.id" class="timeline-item">
            <i :style="{ background: item.color }"></i>
            <time>{{ item.displayTime || `${item.startTime} - ${item.endTime}` }}</time>
            <strong>{{ item.title }}</strong>
            <button type="button" @click="scheduleStore.removeSchedule(selectedDate, item.id)">삭제</button>
          </article>
        </div>
        <div v-else class="empty-state">이 날짜에는 아직 일정이 없습니다.</div>

        <form class="add-form" @submit.prevent="addSchedule">
          <h3>새 일정 추가</h3>
          <input v-model="form.title" placeholder="일정 이름" maxlength="30" />
          <div><input v-model="form.startTime" type="time" /><span>—</span><input v-model="form.endTime" type="time" /></div>
          <button type="submit">일정 추가</button>
        </form>
      </section>

      <section class="panel recommendation-panel">
        <div class="panel-title"><div><p>WEATHER PICKS</p><h2>날씨 맞춤 추천</h2></div></div>
        <p class="recommendation-desc">현재 위치의 날씨를 바탕으로 추천했어요. 원하는 활동을 눌러 일정에 추가하세요.</p>
        <button v-for="activity in recommendations" :key="activity.id" type="button" class="recommendation-row" @click="addRecommendation(activity)">
          <span class="recommendation-icon">{{ activity.icon }}</span>
          <span><strong>{{ activity.title }}</strong><small>{{ activity.time }} · 추천 {{ activity.score }}</small></span>
          <b>＋</b>
        </button>
      </section>
    </div>

    <section class="panel hourly-panel">
      <div class="panel-title hourly-title">
        <div><p>HOURLY WEATHER</p><h2>시간대별 날씨</h2></div>
        <div class="hourly-controls">
          <button type="button" aria-label="이전 시간대" @click="scrollHourly(-1)">‹</button>
          <button type="button" aria-label="다음 시간대" @click="scrollHourly(1)">›</button>
        </div>
      </div>
      <div ref="hourlyScrollRef" class="schedule-hourly-scroll">
        <div class="schedule-hourly-content" :style="{ width: `${hourlyForecast.length * 76}px` }">
          <svg :width="hourlyForecast.length * 76" height="90" aria-hidden="true">
            <line v-for="(point, index) in chartPoints" :key="`line-${index}`" :x1="point.x" :y1="point.y" :x2="point.x" y2="90" stroke="#edf2f7" stroke-width="2" />
            <polyline :points="chartPolyline" fill="none" stroke="#94a3b8" stroke-width="3" />
            <circle v-for="(point, index) in chartPoints" :key="`dot-${index}`" :cx="point.x" :cy="point.y" r="4" fill="#3b82f6" stroke="#fff" stroke-width="2" />
          </svg>
          <div class="schedule-hourly-items">
            <div v-for="(item, index) in hourlyForecast" :key="`${item.time}-${index}`" class="schedule-hourly-item">
              <strong :style="{ top: `${chartPoints[index].y - 25}px` }">{{ item.temp }}°</strong>
              <span>{{ item.icon }}</span>
              <small>{{ item.time }}</small>
            </div>
          </div>
        </div>
      </div>
      <div class="hourly-summary">
        <div><span>현재 기온</span><strong>{{ currentWeather?.temp ?? '-' }}°C</strong></div>
        <div><span>체감 온도</span><strong>{{ currentWeather?.feelsLike ?? '-' }}°C</strong></div>
        <div><span>습도</span><strong>{{ currentWeather?.humidity ?? '-' }}%</strong></div>
        <div><span>풍속</span><strong>{{ currentWeather?.wind ?? '-' }} m/s</strong></div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.schedule-page { max-width: 1080px; margin: 0 auto; padding: 24px 0 50px; color: #172033; }
.page-header { display: flex; justify-content: space-between; align-items: end; margin-bottom: 28px; }
.page-header p,.panel-title p { margin: 0 0 6px; color: #3b82f6; font-size: 11px; font-weight: 800; letter-spacing: 1.4px; }
.page-header h1 { margin: 0 0 8px; font-size: 34px; }
.page-header span { color: #718096; }
.date-picker { display: flex; flex-direction: column; gap: 7px; color: #64748b; font-size: 12px; font-weight: 700; }
.date-picker input,.add-form input { padding: 11px 13px; border: 1px solid #dfe5ee; border-radius: 10px; background: #fff; font: inherit; }
.weather-summary { display: grid; grid-template-columns: 1.6fr repeat(4,1fr); gap: 1px; padding: 18px; border: 1px solid rgba(255,255,255,.92); border-radius: 20px; background: linear-gradient(135deg,rgba(255,255,255,.97),rgba(242,248,255,.96) 52%,rgba(226,240,255,.94)); box-shadow: 0 10px 28px rgba(49,91,138,.12),inset 0 1px 0 rgba(255,255,255,.96); }
.weather-location,.weather-stat { display: flex; align-items: center; padding: 8px 18px; border-right: 1px solid rgba(148,163,184,.2); }
.summary-icon-shell { position: relative; flex: 0 0 68px; width: 68px; height: 68px; margin-right: 10px; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid rgba(255,255,255,.98); border-radius: 50%; background: radial-gradient(circle at 38% 30%,#fff,#f7fbff 48%,#dcecff); box-shadow: 0 7px 18px rgba(63,112,163,.17),inset 0 0 15px rgba(255,255,255,.94); }
.summary-icon-shell img { position: absolute; inset: 0; width: 68px; height: 68px; object-fit: contain; filter: saturate(1.22) contrast(1.12) drop-shadow(0 3px 5px rgba(42,72,105,.22)); transform: scale(1.1); }
.summary-icon-fallback { font-size: 39px; line-height: 1; filter: drop-shadow(0 3px 4px rgba(30,64,95,.16)); }
.weather-location div,.weather-stat { flex-direction: column; align-items: flex-start; gap: 5px; }
.weather-location > div {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
.weather-location span,.weather-stat span { color: #64748b; font-size: 12px; }
.weather-location strong { font-size: 25px; }.weather-stat strong { font-size: 14px; }
.schedule-layout { display: grid; grid-template-columns: 1.35fr .85fr; gap: 22px; margin-top: 22px; }
.panel { padding: 27px; border-radius: 22px; background: #fff; box-shadow: 0 7px 25px rgba(15,23,42,.06); }
.panel-title { display: flex; justify-content: space-between; align-items: center; }.panel-title h2 { margin: 0; font-size: 20px; }.panel-title > span { color: #3b82f6; font-size: 13px; font-weight: 700; }
.timeline { display: flex; flex-direction: column; gap: 9px; margin: 24px 0; }
.timeline-item { display: grid; grid-template-columns: 9px 145px 1fr auto; align-items: center; gap: 12px; padding: 15px; border-radius: 13px; background: #f8fafc; }
.timeline-item i { width: 8px; height: 8px; border-radius: 50%; }.timeline-item time { color: #64748b; font-size: 13px; }.timeline-item strong { font-size: 14px; }.timeline-item button { border: 0; background: transparent; color: #ef4444; cursor: pointer; }
.empty-state { margin: 24px 0; padding: 38px; border-radius: 14px; background: #f8fafc; color: #94a3b8; text-align: center; }
.add-form { display: grid; grid-template-columns: 1.5fr 1.2fr auto; gap: 10px; padding-top: 22px; border-top: 1px solid #edf0f4; }.add-form h3 { grid-column: 1/-1; margin: 0 0 3px; font-size: 15px; }.add-form > div { display: flex; align-items: center; gap: 5px; }.add-form > div input { min-width: 0; width: 100%; }.add-form button { border: 0; border-radius: 10px; padding: 0 17px; background: #2563eb; color: #fff; font-weight: 700; cursor: pointer; }
.recommendation-desc { color: #64748b; font-size: 13px; line-height: 1.6; }
.recommendation-row { display: grid; grid-template-columns: 44px 1fr auto; align-items: center; gap: 12px; width: 100%; margin-top: 10px; padding: 13px; border: 1px solid #edf0f4; border-radius: 13px; background: #fff; text-align: left; cursor: pointer; }.recommendation-row:hover { border-color: #93c5fd; background: #f8fbff; }.recommendation-icon { font-size: 26px; }.recommendation-row > span:nth-child(2) { display: flex; flex-direction: column; gap: 4px; }.recommendation-row strong { font-size: 14px; }.recommendation-row small { color: #64748b; }.recommendation-row b { color: #3b82f6; font-size: 20px; }
.hourly-panel { margin-top: 22px; overflow: hidden; }
.hourly-title { margin-bottom: 12px; }
.hourly-controls { display: flex; gap: 8px; }
.hourly-controls button { width: 34px; height: 34px; border: 1px solid #e2e8f0; border-radius: 50%; background: #fff; color: #64748b; font-size: 23px; line-height: 1; cursor: pointer; }
.hourly-controls button:hover { color: #2563eb; border-color: #93c5fd; }
.schedule-hourly-scroll { overflow-x: auto; overflow-y: hidden; scrollbar-width: none; }
.schedule-hourly-scroll::-webkit-scrollbar { display: none; }
.schedule-hourly-content { position: relative; height: 175px; padding-top: 8px; }
.schedule-hourly-content svg { position: absolute; top: 8px; left: 0; }
.schedule-hourly-items { position: absolute; top: 8px; left: 0; display: flex; height: 165px; }
.schedule-hourly-item { position: relative; width: 76px; flex: 0 0 76px; text-align: center; }
.schedule-hourly-item strong { position: absolute; left: 0; width: 100%; color: #1e293b; font-size: 14px; }
.schedule-hourly-item span { position: absolute; top: 101px; left: 0; width: 100%; font-size: 25px; }
.schedule-hourly-item small { position: absolute; top: 140px; left: 0; width: 100%; color: #94a3b8; font-weight: 700; }
.hourly-summary { display: grid; grid-template-columns: repeat(4,1fr); margin-top: 5px; padding: 16px; border-radius: 13px; background: #f8fafc; }
.hourly-summary div { display: flex; flex-direction: column; gap: 5px; padding: 0 18px; border-right: 1px solid #e9edf2; }
.hourly-summary div:last-child { border: 0; }
.hourly-summary span { color: #94a3b8; font-size: 11px; }
.hourly-summary strong { font-size: 14px; }
@media(max-width:900px){.weather-summary{grid-template-columns:1fr 1fr}.weather-location{grid-column:1/-1}.schedule-layout{grid-template-columns:1fr}.add-form{grid-template-columns:1fr}.page-header{align-items:flex-start;gap:20px}.timeline-item{grid-template-columns:9px 1fr auto}.timeline-item time{grid-column:2}.timeline-item strong{grid-column:2}.timeline-item button{grid-column:3;grid-row:1/3}}
</style>
