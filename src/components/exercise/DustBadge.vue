<script setup>
defineProps({
  dust: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="dust-info">
    <p>미세먼지 상태</p>

    <span v-if="dust === '좋음'" class="badge cool">😊 좋음</span>
    <span v-else-if="dust === '보통'" class="badge normal">🙂 보통</span>
    <span v-else class="badge hot">😷 나쁨</span>
  </div>
</template>

<style scoped>
.dust-info {
  margin-top: 8px;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  color: #fff;
}

.hot {
  background-color: #ff7675;
}

.cool {
  background-color: #74b9ff;
}

.normal {
  background-color: #55b87a;
}
</style>
