<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import UnitToggler from './components/exercise/UnitToggler.vue'
import RainEffect from './components/RainEffect.vue'
import { useWeatherStore } from '@/stores/weatherStore'

const weatherStore = useWeatherStore()
const route = useRoute()

const weatherTheme = computed(() => {
  const detailWeather = route.name === 'WeatherDetail'
    ? weatherStore.weatherData[route.params.cityId]
    : null
  const weather = detailWeather || weatherStore.currentWeather || weatherStore.weatherData.city_08
  const status = (weather?.status || '').toLowerCase()

  if (/뇌우|천둥|thunder|폭우|storm/.test(status)) return 'storm'
  if (/비|rain|소나기|drizzle/.test(status) || Number(weather?.precipitation) > 0) return 'rain'
  if (/눈|snow|진눈깨비|sleet/.test(status)) return 'snow'
  if (/구름|흐림|cloud|overcast|mist|안개|fog/.test(status)) return 'cloudy'
  return 'sunny'
})
</script>

<template>
  <div class="app-layout" :class="`weather-${weatherTheme}`">
    <div class="weather-background" aria-hidden="true"></div>
    <aside class="sidebar dark-sidebar">
      <div class="logo">
        <span class="logo-text">weather<br />planner</span>
      </div>
      <div class="menu-label">General</div>
      <nav class="navigation-bar">
        <RouterLink to="/" class="nav-item">날씨 대시보드</RouterLink>
        <RouterLink to="/regions" class="nav-item">모든 지역 날씨</RouterLink>
        <RouterLink to="/schedule" class="nav-item">내 스케줄</RouterLink>
        <RouterLink to="/about" class="nav-item">서비스 소개</RouterLink>
      </nav>

      <div class="menu-label" style="margin-top: 40px">Settings</div>
      <div class="actions" style="padding: 0 20px">
        <UnitToggler />
      </div>
    </aside>

    <main class="main-content">
      <RainEffect v-if="weatherTheme === 'rain' || weatherTheme === 'storm'" :storm="weatherTheme === 'storm'" />
      <div class="page-content">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style>
@import '@/assets/exercise.css';

#app {
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

body {
  margin: 0;
  background-color: #f8f9fa; /* Very light gray/white background */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #333;
}

.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
  position: relative;
  isolation: isolate;
  background: #e2e9ef;
}

.dark-sidebar {
  width: 220px;
  height: 100vh;
  box-sizing: border-box;
  background-color: #121212; /* Dark black/gray */
  color: #fff;
  border-radius: 0 30px 30px 0;
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  margin-right: 20px;
  position: sticky;
  top: 0;
  align-self: flex-start;
  z-index: 2;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
}

.logo-text {
  font-size: 28px;
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: -1px;
  color: #ffffff;
  text-align: left;
}

.menu-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 700;
  margin-bottom: 10px;
  padding-left: 25px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.navigation-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 15px;
}

.nav-item {
  text-decoration: none;
  color: #9ca3af;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: 12px;
  transition: all 0.3s;
  font-size: 14px;
}

.nav-item:hover,
.router-link-active {
  background-color: rgba(255, 255, 255, 0.1);
  color: #f9a8d4; /* Pinkish accent like the image */
}

.main-content {
  flex: 1;
  min-width: 0;
  padding: 20px 70px 20px 20px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  z-index: 1;
  transition: background-color 0.8s ease;
}

.page-content {
  flex: 1;
  width: 100%;
  position: relative;
  z-index: 1;
}

.weather-background,
.weather-background::before,
.weather-background::after {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
}

.weather-background {
  position: fixed;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  overflow: hidden;
  opacity: 0.72;
  contain: strict;
  transition: background 1s ease, opacity 1s ease;
}

/* 맑음: 푸른 하늘과 천천히 움직이는 햇빛 */
.weather-sunny .weather-background {
  background: #b9e2ff;
  opacity: .78;
}
.weather-sunny .weather-background::before {
  inset: -10% -14%;
  background: url('/images/weather-card-sunny.png') center/cover;
  filter: saturate(.86) brightness(1.05);
  will-change: transform;
  animation: weather-photo-drift 100s linear infinite alternate;
}
.weather-sunny .weather-background::after {
  background: radial-gradient(circle at 15% 12%,rgba(255,244,175,.35),transparent 36%),linear-gradient(rgba(255,255,255,.08),rgba(234,246,255,.2));
  animation: sun-breathe 8s ease-in-out infinite alternate;
}

/* 구름: 실제 구름 사진을 화면보다 크게 배치해 접합부 없이 천천히 이동 */
.weather-cloudy .weather-background {
  background: linear-gradient(155deg, #b9c9d8, #e2e9ef 58%, #f5f7f9);
  opacity: .9;
}
.weather-cloudy .weather-background::before {
  inset: -9% -16%;
  background-image: url('/images/cloudy-sky-background.png');
  background-position: center;
  background-size: cover;
  filter: saturate(.92) contrast(1.06);
  transform-origin: center;
  backface-visibility: hidden;
  perspective: 1000px;
  will-change: transform;
  animation: cloud-photo-drift 120s linear infinite alternate;
}
.weather-cloudy .weather-background::after {
  background: linear-gradient(180deg, rgba(218,231,242,.12), rgba(245,248,251,.3));
}

/* 비/폭풍: 어두운 구름 아래로 사선 빗줄기가 흐름 */
.weather-rain .weather-background,
.weather-storm .weather-background {
  background: #617386;
  opacity: .76;
}
.weather-rain .weather-background::before,
.weather-storm .weather-background::before {
  inset: -10% -14%;
  background: linear-gradient(rgba(17,31,48,.18),rgba(21,38,54,.28)),url('/images/weather-card-rain.png') center/cover;
  filter: saturate(.76) contrast(.92);
  will-change: transform;
  animation: rain-sky-drift 42s ease-in-out infinite alternate;
}
.weather-rain .weather-background::after,
.weather-storm .weather-background::after {
  background: linear-gradient(180deg, rgba(19,34,48,.08), rgba(24,43,58,.2));
}
.weather-storm .weather-background { background: linear-gradient(155deg, #34465a, #718092 52%, #b8c1ca); }
.weather-storm .weather-background::after { animation: lightning 7s steps(1) infinite; }

/* 눈 */
.weather-snow .weather-background { background: #d8e5ef; opacity: .82; }
.weather-snow .weather-background::before {
  inset: -10% -14%;
  background: linear-gradient(rgba(255,255,255,.08),rgba(236,245,251,.2)),url('/images/weather-card-snow.png') center/cover;
  filter: saturate(.72) brightness(1.04);
  will-change: transform;
  animation: weather-photo-drift 90s linear infinite alternate;
}
.weather-snow .weather-background::after {
  background-image: radial-gradient(circle,rgba(255,255,255,.9) 0 2px,transparent 3px),radial-gradient(circle,rgba(255,255,255,.72) 0 1px,transparent 2px);
  background-size: 48px 48px,31px 37px;
  animation: snow-fall 8s linear infinite;
}

@keyframes sun-breathe { to { transform: translate(-30px, 22px) scale(1.14); opacity: .78; } }
@keyframes sky-drift { to { transform: translateX(-37.5%); } }
@keyframes cloud-drift { to { transform: translateX(-44%); } }
@keyframes cloud-photo-drift {
  from { transform: translate3d(-10%, 0, 0) scale(1.08); }
  to { transform: translate3d(10%, 0, 0) scale(1.08); }
}
@keyframes weather-photo-drift {
  from { transform: translate3d(-6%,0,0) scale(1.08); }
  to { transform: translate3d(6%,0,0) scale(1.1); }
}
@keyframes rain-sky-drift {
  from { transform: translate3d(-8%, -1%, 0) scale(1.1); filter: saturate(.76) contrast(.92) brightness(.9); }
  to { transform: translate3d(8%, 1.5%, 0) scale(1.14); filter: saturate(.82) contrast(.96) brightness(1); }
}
@keyframes snow-fall { from { background-position: 0 -80px; } to { background-position: 55px 500px; } }
@keyframes lightning { 0%, 91%, 94%, 100% { filter: brightness(1); } 92%, 93% { filter: brightness(1.8); } }

/* ================================
   모바일 반응형
================================ */
@media (max-width: 768px) {
  .weather-background {
    left: 0;
    width: 100vw;
  }
  /* 전체 레이아웃을 세로형으로 변경 */
  .app-layout {
    display: block;
    width: 100%;
    min-height: 100vh;
  }

  /* 왼쪽 검은 사이드바 */
  .dark-sidebar {
    position: relative;
    top: auto;
    width: 100%;
    height: auto;
    min-height: auto;
    border-radius: 0 0 24px 24px;
    padding: 20px;
    box-sizing: border-box;
  }

  /* 로고 */
  .sidebar-logo {
    margin-bottom: 24px;
    text-align: center;
  }

  /* 메뉴 영역 */
  .sidebar-nav {
    width: 100%;
  }

  /* 설정 영역 */
  .sidebar-settings {
    margin-top: 24px;
  }

  /* 가운데 콘텐츠 */
  .main-content {
    width: 100%;
    min-width: 0;
    padding: 24px 20px;
    box-sizing: border-box;
  }

  .page-content {
    width: 100%;
  }

  /* 오른쪽 캘린더 */
  .right-sidebar {
    position: static;
    width: 100%;
    height: auto;
    min-height: auto;
    margin-top: 20px;
    border-radius: 24px 24px 0 0;
    box-sizing: border-box;
  }
}
</style>
