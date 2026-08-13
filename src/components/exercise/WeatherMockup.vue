<script setup>
import { ref } from 'vue'

// 4일차 API 연동을 대비한 가상의 백엔드 데이터 배열 (v-for 및 :key 실습용)
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 31, status: '맑음', dust: '나쁨' },
  { id: 'city_02', name: '수원', temp: 24, status: '비', dust: '보통' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름', dust: '좋음' },
  { id: 'city_04', name: '인천', temp: 27, status: '구름', dust: '보통' },
  { id: 'city_05', name: '대전', temp: 30, status: '맑음', dust: '나쁨' },
  { id: 'city_06', name: '대구', temp: 33, status: '맑음', dust: '나쁨' },
  { id: 'city_07', name: '광주', temp: 29, status: '흐림', dust: '보통' },
  { id: 'city_08', name: '울산', temp: 28, status: '구름', dust: '좋음' },
  { id: 'city_09', name: '제주', temp: 25, status: '비', dust: '좋음' },
])

// 검색어 및 알림창 제어용 데이터
const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')
const selectedCity = ref('')

// 카드 선택 함수
const selectCity = (item) => {
  selectedCity.value = item.id
  selectedCityInfo.value = `${item.name}이 선택되었습니다.`
}

// 알림 대행 함수
const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}
</script>

<template>
  <div class="dashboard-wrapper">
    <section class="search-box">
      <h3>🔍 도시 검색</h3>

      <input type="text" :value="searchQuery" @input="(e) => (searchQuery = e.target.value)" placeholder="검색할 도시 이름 입력" />

      <p>
        검색 중인 도시: <strong>{{ searchQuery }}</strong>
      </p>
    </section>

    <section class="list-box">
      <h3>🏙️ 지역별 날씨 현황</h3>

      <div v-for="item in weatherList" :key="item.id" class="weather-card" :class="{ selected: selectedCity === item.id }" @click="selectCity(item)">
        <h4>{{ item.name }} ({{ item.status }})</h4>

        <p>현재 기온: {{ item.temp }}°C</p>

        <span v-if="item.temp >= 30" class="badge hot">🚨 폭염주의 (30도 이상)</span>
        <span v-else-if="item.temp >= 25" class="badge hot">🔥 더움 (25도 이상)</span>
        <span v-else class="badge cool">❄️ 선선함 (25도 미만)</span>

        <p>미세먼지 상태</p>

        <span v-if="item.dust === '좋음'" class="badge cool">😊 좋음</span>
        <span v-else-if="item.dust === '보통'" class="badge normal">🙂 보통</span>
        <span v-else class="badge hot">😷 나쁨</span>

        <button class="btn-detail" @click.stop="showDetail(item.name, item.status)">상세보기</button>
      </div>
    </section>

    <div class="status-bar">
      {{ selectedCityInfo }}
    </div>
  </div>
</template>
