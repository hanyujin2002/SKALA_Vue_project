import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  // 페이지를 이동할 때 이전 화면의 스크롤 위치를 이어받지 않는다.
  scrollBehavior() {
    return { top: 0, left: 0, behavior: 'auto' }
  },

  routes: [
    // 메인 날씨 대시보드
    {
      path: '/',
      name: 'WeatherHome',
      component: () => import('../views/WeatherHomeView.vue'),
    },

    // 서비스 소개
    {
      path: '/about',
      name: 'WeatherAbout',
      component: () => import('../views/WeatherAboutView.vue'),
    },

    // 날씨 기반 내 일정 관리
    {
      path: '/schedule',
      name: 'Schedule',
      component: () => import('../views/ScheduleView.vue'),
    },

    // 전체 지역 날씨 목록
    {
      path: '/regions',
      name: 'WeatherRegions',
      component: () => import('../views/WeatherRegionsView.vue'),
    },

    // 도시별 상세 날씨 페이지
    {
      path: '/weather/:cityId',
      name: 'WeatherDetail',
      component: () => import('../views/WeatherDetailView.vue'),
    },

    // 본인 추가 View - 미세먼지 정보
    {
      path: '/dust-info',
      name: 'DustInfo',
      component: () => import('../views/DustInfoView.vue'),
    },

    // 정의되지 않은 모든 경로 처리 - 반드시 마지막
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

export default router
