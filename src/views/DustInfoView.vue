<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="dust-info-view">
    <h3>😷 미세먼지 정보</h3>
    <hr />

    <div class="dust-guide">
      <p>날씨 대시보드에서 사용하는 미세먼지 상태를 안내합니다.</p>

      <div class="dust-item">
        <span class="badge good">😊 좋음</span>
        <span>대기 상태가 양호합니다.</span>
      </div>

      <div class="dust-item">
        <span class="badge normal">🙂 보통</span>
        <span>일반적인 대기 상태입니다.</span>
      </div>

      <div class="dust-item">
        <span class="badge bad">😷 나쁨</span>
        <span>외출 시 미세먼지에 주의가 필요합니다.</span>
      </div>
    </div>

    <button class="home-btn" @click="goHome">대시보드 홈으로 이동</button>
  </div>
</template>

<style scoped>
.dust-info-view {
  padding: 20px;
  background: white;
  border-radius: 8px;
}

.dust-guide {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
}

.dust-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px 0;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
}

.good {
  background-color: #74b9ff;
}

.normal {
  background-color: #55b87a;
}

.bad {
  background-color: #ff7675;
}

.home-btn {
  margin-top: 15px;
  padding: 10px 15px;
  cursor: pointer;
}
</style>
