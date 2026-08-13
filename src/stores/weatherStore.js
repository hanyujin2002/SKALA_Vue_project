import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useWeatherStore = defineStore('weather', () => {
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

  const ensureApiKey = () => {
    if (!API_KEY) {
      throw new Error('VITE_OPENWEATHER_API_KEY 환경 변수가 설정되지 않았습니다.')
    }
  }

  const cities = ref([
    { id: 'city_01', name: '서울', english: 'Seoul' },
    { id: 'city_02', name: '수원', english: 'Suwon' },
    { id: 'city_03', name: '부산', english: 'Busan' },
    { id: 'city_04', name: '인천', english: 'Incheon' },
    { id: 'city_05', name: '대전', english: 'Daejeon' },
    { id: 'city_06', name: '대구', english: 'Daegu' },
    { id: 'city_07', name: '광주', english: 'Gwangju' },
    { id: 'city_08', name: '울산', english: 'Ulsan' },
    { id: 'city_09', name: '제주', english: 'Jeju' },
    { id: 'city_10', name: '세종', english: 'Sejong' },
    { id: 'city_11', name: '청주', english: 'Cheongju' },
    { id: 'city_12', name: '춘천', english: 'Chuncheon' },
    { id: 'city_13', name: '강릉', english: 'Gangneung' },
    { id: 'city_14', name: '전주', english: 'Jeonju' },
    { id: 'city_15', name: '목포', english: 'Mokpo' },
    { id: 'city_16', name: '포항', english: 'Pohang' },
    { id: 'city_17', name: '창원', english: 'Changwon' },
    { id: 'city_18', name: '여수', english: 'Yeosu' },
  ])

  const weatherData = ref({})
  const currentWeather = ref(null)
  const isLoading = ref(false)

  const weatherList = computed(() => {
    return Object.values(weatherData.value)
  })

  const normalizeWeather = (data, fallback = {}) => ({
    id: fallback.id || 'current',
    name: fallback.name || data.name,
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    precipitation: Number(data.rain?.['1h'] || data.snow?.['1h'] || 0),
    wind: data.wind.speed,
    status: data.weather[0].description,
    icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
    latitude: data.coord?.lat,
    longitude: data.coord?.lon,
  })

  const getAirQualityStatus = (pm10) => {
    if (pm10 <= 30) return '좋음'
    if (pm10 <= 80) return '보통'
    if (pm10 <= 150) return '나쁨'
    return '매우 나쁨'
  }

  // Open-Meteo Air Quality API: OpenWeatherMap이 제공한 좌표로 실시간 대기질을 결합한다.
  const fetchAirQuality = async (latitude, longitude) => {
    if (latitude == null || longitude == null) return null

    try {
      const response = await axios.get('https://air-quality-api.open-meteo.com/v1/air-quality', {
        params: {
          latitude,
          longitude,
          current: 'pm10,pm2_5,nitrogen_dioxide,us_aqi',
          timezone: 'Asia/Seoul',
        },
      })
      const air = response.data.current
      const pm10 = Math.round(air?.pm10 ?? 0)

      return {
        pm10,
        pm25: Math.round(air?.pm2_5 ?? 0),
        no2: Math.round(air?.nitrogen_dioxide ?? 0),
        aqi: Math.round(air?.us_aqi ?? 0),
        status: getAirQualityStatus(pm10),
        measuredAt: air?.time || null,
      }
    } catch (error) {
      console.warn('대기질 데이터를 가져오지 못했습니다.', error)
      return null
    }
  }

  const fetchWeatherForAllCities = async () => {
    if (weatherList.value.length === cities.value.length) return // Already fetched

    isLoading.value = true
    try {
      ensureApiKey()
      const requests = cities.value.map(city => 
        axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city.english}&appid=${API_KEY}&units=metric&lang=kr`)
      )
      
      const responses = await Promise.all(requests)
      
      const newWeatherData = {}
      responses.forEach((res, index) => {
        const city = cities.value[index]
        newWeatherData[city.id] = normalizeWeather(res.data, city)
      })

      const airQualityResults = await Promise.all(
        Object.values(newWeatherData).map((weather) =>
          fetchAirQuality(weather.latitude, weather.longitude),
        ),
      )
      Object.keys(newWeatherData).forEach((cityId, index) => {
        newWeatherData[cityId].airQuality = airQualityResults[index]
      })
      weatherData.value = newWeatherData
    } catch (error) {
      console.error('날씨 데이터 가져오기 실패:', error)
    } finally {
      isLoading.value = false
    }
  }

  const getPosition = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저는 위치 정보를 지원하지 않습니다.'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 10 * 60 * 1000,
    })
  })

  const fetchCurrentLocationWeather = async () => {
    try {
      ensureApiKey()
      const position = await getPosition()
      const { latitude, longitude } = position.coords
      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: { lat: latitude, lon: longitude, appid: API_KEY, units: 'metric', lang: 'kr' },
      })
      const normalizedWeather = normalizeWeather(response.data)
      normalizedWeather.airQuality = await fetchAirQuality(latitude, longitude)
      currentWeather.value = normalizedWeather
    } catch (error) {
      console.warn('현재 위치 날씨를 가져오지 못해 울산 날씨를 사용합니다.', error)
      const ulsan = weatherData.value.city_08
      currentWeather.value = ulsan ? { ...ulsan, id: 'current' } : null
    }
  }

  return {
    cities, weatherData, weatherList, currentWeather, isLoading,
    fetchWeatherForAllCities, fetchCurrentLocationWeather, fetchAirQuality,
  }
})
