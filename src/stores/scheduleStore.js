import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'weather-dashboard-schedules'

export const useScheduleStore = defineStore('schedule', () => {
  const schedules = ref(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'))

  const saveSchedules = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules.value))
  }

  const getSchedulesByDate = (dateKey) =>
    [...(schedules.value[dateKey] || [])].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    )

  const addSchedule = (dateKey, schedule) => {
    schedules.value = {
      ...schedules.value,
      [dateKey]: [...(schedules.value[dateKey] || []), schedule],
    }
    saveSchedules()
  }

  const removeSchedule = (dateKey, id) => {
    const remaining = getSchedulesByDate(dateKey).filter((schedule) => schedule.id !== id)
    const nextSchedules = { ...schedules.value }
    if (remaining.length) nextSchedules[dateKey] = remaining
    else delete nextSchedules[dateKey]
    schedules.value = nextSchedules
    saveSchedules()
  }

  return { schedules, saveSchedules, getSchedulesByDate, addSchedule, removeSchedule }
})
