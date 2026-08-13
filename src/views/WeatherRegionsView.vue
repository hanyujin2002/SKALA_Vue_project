<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { useWeatherStore } from '@/stores/weatherStore'
import { useConfigStore } from '@/stores/configStore'

const router = useRouter()
const weatherStore = useWeatherStore()
const configStore = useConfigStore()
const searchQuery = ref('')

onMounted(() => weatherStore.fetchWeatherForAllCities())

const weatherList = computed(() => {
  const query = searchQuery.value.trim()
  return query
    ? weatherStore.weatherList.filter((item) => item.name.includes(query) || item.status.includes(query))
    : weatherStore.weatherList
})

const formatTemp = (temp) => configStore.unit === 'fahrenheit'
  ? Math.round((temp * 9) / 5 + 32)
  : temp

const weatherEmoji = (status = '') => {
  const value = status.toLowerCase()
  if (/뇌우|천둥|thunder|storm/.test(value)) return '⛈️'
  if (/눈|snow|sleet/.test(value)) return '🌨️'
  if (/비|rain|소나기|drizzle/.test(value)) return '🌧️'
  if (/안개|박무|mist|fog|haze/.test(value)) return '🌫️'
  if (/구름|흐림|cloud|overcast/.test(value)) return '☁️'
  return '☀️'
}

const weatherType = (item) => {
  const value = (item.status || '').toLowerCase()
  if (/뇌우|천둥|thunder|storm/.test(value)) return 'storm'
  if (/눈|snow|sleet/.test(value)) return 'snow'
  if (/비|rain|소나기|drizzle/.test(value) || Number(item.precipitation) > 0) return 'rain'
  if (/안개|박무|mist|fog|haze/.test(value)) return 'fog'
  if (/구름|흐림|cloud|overcast/.test(value)) return 'cloudy'
  return 'sunny'
}
</script>

<template>
  <div class="regions-page" v-loading="weatherStore.isLoading">
    <header>
      <div><p>REGIONAL WEATHER</p><h1>모든 지역 날씨</h1><span>전국 주요 도시의 실시간 날씨를 한눈에 확인하세요.</span></div>
      <el-input v-model="searchQuery" placeholder="지역 또는 날씨 검색" :prefix-icon="Search" clearable />
    </header>

    <div v-if="weatherList.length" class="weather-grid">
      <button v-for="item in weatherList" :key="item.id" type="button" class="weather-card" :class="`card-${weatherType(item)}`" @click="router.push(`/weather/${item.id}`)">
        <span v-if="['rain', 'storm'].includes(weatherType(item))" class="rain-particles" aria-hidden="true">
          <i v-for="drop in 16" :key="drop" :style="{ '--drop': drop }"></i>
        </span>
        <span class="emoji">{{ weatherEmoji(item.status) }}</span>
        <div class="city"><strong>{{ item.name }}</strong><span>{{ item.status }}</span></div>
        <strong class="temperature">{{ formatTemp(item.temp) }}°{{ configStore.unit === 'celsius' ? 'C' : 'F' }}</strong>
        <div class="metrics">
          <span>습도 <b>{{ item.humidity }}%</b></span>
          <span>강수량 <b>{{ item.precipitation }}mm</b></span>
          <span>풍속 <b>{{ item.wind }}m/s</b></span>
        </div>
        <span class="detail-link">상세 날씨 보기 →</span>
      </button>
    </div>
    <el-empty v-else-if="!weatherStore.isLoading" description="검색 결과가 없습니다." />
  </div>
</template>

<style scoped>
.regions-page { max-width: 1080px; margin: 0 auto; padding: 24px 0 60px; color: #172033; }
header { display: flex; align-items: end; justify-content: space-between; gap: 30px; margin-bottom: 28px; }
header p { margin: 0 0 7px; color: #3b82f6; font-size: 11px; font-weight: 800; letter-spacing: 1.4px; }
header h1 { margin: 0 0 8px; font-size: 34px; } header span { color: #64748b; }
header .el-input { width: 290px; --el-input-border-radius: 12px; }
.weather-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; }
.weather-card { position: relative; isolation: isolate; overflow: hidden; display: flex; flex-direction: column; align-items: center; min-height: 300px; padding: 25px; border: 1px solid rgba(255,255,255,.75); border-radius: 22px; background: rgba(255,255,255,.8); box-shadow: 0 7px 22px rgba(15,23,42,.06); color: inherit; cursor: pointer; transition: transform .3s ease, border-color .3s ease, box-shadow .3s ease, background .45s ease, color .3s ease; backdrop-filter: blur(10px); }
.weather-card > :not(.rain-particles) { position: relative; z-index: 2; }
.weather-card::before,.weather-card::after { position: absolute; z-index: -1; content: ''; opacity: 0; pointer-events: none; transition: opacity .45s ease; }
.weather-card::before { inset: -14px; background-position: center; background-size: cover; filter: blur(2.6px) saturate(.82) contrast(.9); transform: translate3d(-2%,0,0) scale(1.08); will-change: transform; }
.weather-card::after { inset: 0; background: rgba(244,248,252,.34); }
.weather-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,.85); box-shadow: 0 14px 30px rgba(30,64,175,.18); }
.weather-card:hover::before { opacity: 1; animation: card-photo-drift 18s linear infinite alternate; }
.weather-card:hover::after { opacity: 1; }
.weather-card.card-sunny::before { background: linear-gradient(rgba(35,114,190,.08),rgba(255,255,255,.08)),url('/images/weather-card-sunny.png') center/cover; }
.weather-card.card-sunny::after { background: linear-gradient(rgba(255,255,255,.25),rgba(239,248,255,.42)),radial-gradient(circle at 18% 12%,rgba(255,246,183,.48),transparent 38%); }
.weather-card.card-cloudy::before { background: linear-gradient(rgba(73,91,108,.12),rgba(255,255,255,.12)),url('/images/cloudy-sky-background.png') center/cover; }
.weather-card.card-cloudy::after { background: rgba(242,246,249,.4); }
.weather-card.card-rain::before,.weather-card.card-storm::before { background: linear-gradient(rgba(20,35,52,.22),rgba(15,23,42,.3)),url('/images/weather-card-rain.png') center/cover; }
.weather-card.card-rain::after { background: rgba(25,42,59,.34); }
.weather-card.card-storm::after { background: rgba(17,31,48,.4); animation: card-lightning 6s steps(1) infinite; }
.weather-card.card-snow::before { background: linear-gradient(rgba(192,216,235,.06),rgba(255,255,255,.12)),url('/images/weather-card-snow.png') center/cover; }
.weather-card.card-snow::after { background: rgba(245,249,252,.38); }
.weather-card.card-fog::before { background: linear-gradient(rgba(230,237,242,.35),rgba(255,255,255,.35)),url('/images/cloudy-sky-background.png') center/cover; filter: grayscale(.35) contrast(.78); }
.weather-card.card-fog::after { background: rgba(239,244,247,.58); }
.weather-card.card-rain:hover,.weather-card.card-storm:hover { color: #fff; }
.weather-card.card-rain:hover .city span,.weather-card.card-storm:hover .city span,.weather-card.card-rain:hover .metrics span,.weather-card.card-storm:hover .metrics span { color: rgba(255,255,255,.72); }
.weather-card.card-rain:hover .metrics b,.weather-card.card-storm:hover .metrics b,.weather-card.card-rain:hover .detail-link,.weather-card.card-storm:hover .detail-link { color: #fff; }
.weather-card.card-rain:hover .metrics,.weather-card.card-storm:hover .metrics { border-color: rgba(255,255,255,.28); }
.rain-particles { position: absolute; inset: 0; z-index: 1; overflow: hidden; opacity: 0; pointer-events: none; transition: opacity .35s ease; }
.weather-card:hover .rain-particles { opacity: .78; }
.rain-particles i { --x: calc((var(--drop) * 37) % 100); position: absolute; top: -50px; left: calc(var(--x) * 1%); width: 1.5px; height: calc(18px + (var(--drop) % 5) * 5px); border-radius: 99px; background: linear-gradient(to bottom,transparent,rgba(225,241,255,.92)); box-shadow: 0 0 2px rgba(255,255,255,.45); transform: rotate(9deg); animation: rain-drop-fall calc(0.68s + (var(--drop) % 4) * .13s) linear infinite; animation-delay: calc(var(--drop) * -.11s); }
.card-storm .rain-particles i { height: calc(24px + (var(--drop) % 5) * 6px); animation-duration: calc(.52s + (var(--drop) % 4) * .1s); }
@keyframes card-photo-drift { from { transform: translate3d(-2%,0,0) scale(1.08); } to { transform: translate3d(2%,0,0) scale(1.11); } }
@keyframes card-lightning { 0%,88%,91%,100% { background-color: rgba(17,31,48,.4); } 89%,90% { background-color: rgba(238,244,255,.08); } }
@keyframes rain-drop-fall { from { translate: -10px -50px; } to { translate: 18px 390px; } }
.emoji { font-size: 50px; filter: drop-shadow(0 5px 6px rgba(30,41,59,.1)); }.city { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-top: 13px; }.city strong { font-size: 19px; }.city span { color: #64748b; font-size: 13px; }
.temperature { margin: 15px 0; font-size: 33px; letter-spacing: -1px; }
.metrics { display: grid; grid-template-columns: repeat(3,1fr); width: 100%; padding: 13px 0; border-top: 1px solid #edf1f5; border-bottom: 1px solid #edf1f5; }.metrics span { display: flex; flex-direction: column; gap: 4px; color: #94a3b8; font-size: 10px; }.metrics b { color: #475569; font-size: 12px; }
.detail-link { margin-top: auto; padding-top: 16px; color: #3b82f6; font-size: 12px; font-weight: 700; }
@media(max-width:900px){header{align-items:flex-start;flex-direction:column}header .el-input{width:100%}.weather-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.weather-grid{grid-template-columns:1fr}}
</style>
