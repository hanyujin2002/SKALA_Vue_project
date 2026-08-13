<script setup>
import { useConfigStore } from '@/stores/configStore'
const configStore = useConfigStore()
</script>

<template>
  <div class="unit-toggler">
    <button 
      class="unit-btn" 
      :class="{ active: configStore.unit === 'celsius' }"
      @click="configStore.toggleUnit()"
    >°C</button>
    <button 
      class="unit-btn" 
      :class="{ active: configStore.unit === 'fahrenheit' }"
      @click="configStore.toggleUnit()"
    >°F</button>
  </div>
</template>

<style scoped>
.unit-toggler {
  display: flex;
  background: white;
  border-radius: 20px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  gap: 4px;
}
.unit-btn {
  border: none;
  background: transparent;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.unit-btn.active {
  background: #f1f5f9;
  color: #0f172a;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
</style>
