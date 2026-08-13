<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const handleGoHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="about-page">
    <header class="about-hero">
      <span class="eyebrow">WEATHER LIFE PLANNER</span>
      <h1>날씨를 확인하고,<br />오늘을 더 편리하게 계획하세요.</h1>
      <p>현재 위치와 전국 주요 지역의 날씨를 한눈에 확인하고, 날씨에 알맞은 활동과 일정을 함께 관리하는 생활 밀착형 날씨 서비스입니다.</p>
    </header>

    <section class="service-grid">
      <article class="service-card">
        <span class="service-icon">📍</span>
        <h2>현재 위치 날씨</h2>
        <p>현재 위치를 기반으로 온도, 체감온도, 습도, 강수량, 풍속과 시간대별 예보를 제공합니다.</p>
      </article>
      <article class="service-card">
        <span class="service-icon">🗺️</span>
        <h2>전국 지역별 날씨</h2>
        <p>서울부터 청주, 제주까지 주요 도시의 날씨를 비교하고 각 지역의 상세 정보를 확인할 수 있습니다.</p>
      </article>
      <article class="service-card">
        <span class="service-icon">🏃</span>
        <h2>맞춤 활동 추천</h2>
        <p>온도, 습도, 강수량과 불쾌지수를 분석해 산책, 운동, 실내 활동 등 오늘 하기 좋은 활동을 추천합니다.</p>
      </article>
      <article class="service-card">
        <span class="service-icon">📅</span>
        <h2>날씨 기반 일정 관리</h2>
        <p>추천 활동을 추천 시간 그대로 일정에 추가하거나, 원하는 일정을 직접 등록하고 삭제할 수 있습니다.</p>
      </article>
      <article class="service-card">
        <span class="service-icon">🌦️</span>
        <h2>실감 나는 날씨 화면</h2>
        <p>맑음, 구름, 비, 눈 등 현재 날씨에 맞춰 배경과 애니메이션이 변경되어 날씨를 직관적으로 전달합니다.</p>
      </article>
      <article class="service-card">
        <span class="service-icon">🔎</span>
        <h2>상세 날씨 정보</h2>
        <p>지역 카드를 선택하면 해당 도시의 기상 상태와 생활 지표를 자세히 살펴볼 수 있습니다.</p>
      </article>
    </section>

    <div class="about-footer">
      <p>날씨 확인부터 활동 선택과 일정 관리까지, 하나의 대시보드에서 이용해보세요.</p>
      <button @click="handleGoHome" class="home-btn">날씨 대시보드 시작하기 <span>→</span></button>
    </div>
  </div>
</template>

<style scoped>
.about-page { max-width: 1080px; margin: 0 auto; padding: 54px 0 70px; color: #172033; }
.about-hero { max-width: 760px; margin-bottom: 38px; }
.eyebrow { color: #2563eb; font-size: 12px; font-weight: 800; letter-spacing: 1.7px; }
.about-hero h1 { margin: 15px 0 18px; color: #172033; font-size: clamp(34px,4.5vw,54px); line-height: 1.17; letter-spacing: -2px; }
.about-hero p { margin: 0; color: #59677c; font-size: 17px; line-height: 1.8; }
.service-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; }
.service-card { padding: 25px; border: 1px solid rgba(255,255,255,.86); border-radius: 22px; background: rgba(255,255,255,.82); box-shadow: 0 8px 25px rgba(31,61,94,.08); backdrop-filter: blur(12px); transition: transform .25s ease,box-shadow .25s ease; }
.service-card:hover { transform: translateY(-4px); box-shadow: 0 14px 32px rgba(31,61,94,.13); }
.service-icon { display: grid; place-items: center; width: 48px; height: 48px; margin-bottom: 19px; border-radius: 15px; background: linear-gradient(135deg,#f7fbff,#e4f0ff); font-size: 25px; }
.service-card h2 { margin: 0 0 10px; color: #1e293b; font-size: 17px; }
.service-card p { margin: 0; color: #64748b; font-size: 13px; line-height: 1.7; }
.about-footer { display: flex; align-items: center; justify-content: space-between; gap: 25px; margin-top: 26px; padding: 24px 28px; border-radius: 20px; background: linear-gradient(135deg,rgba(232,242,255,.94),rgba(247,250,255,.94)); }
.about-footer p { margin: 0; color: #526277; font-size: 14px; }
.home-btn { flex: 0 0 auto; padding: 12px 18px; border: 0; border-radius: 12px; background: #2563eb; box-shadow: 0 6px 15px rgba(37,99,235,.22); color: #fff; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: transform .2s ease,background .2s ease; }
.home-btn:hover { transform: translateY(-2px); background: #1d4ed8; }
.home-btn span { margin-left: 6px; font-size: 16px; }
@media(max-width:850px){.about-page{padding:35px 0 50px}.service-grid{grid-template-columns:1fr 1fr}.about-footer{align-items:flex-start;flex-direction:column}}
@media(max-width:560px){.service-grid{grid-template-columns:1fr}.about-hero h1{letter-spacing:-1px}.home-btn{width:100%}}
</style>
