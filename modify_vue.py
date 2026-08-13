import re

with open('src/views/WeatherHomeView.vue', 'r') as f:
    content = f.read()

# 1. Add computed properties
script_addition = """
const recommendedActivities = computed(() => {
  if (!currentLocation.value) return []
  const temp = currentLocation.value.temp
  const status = (currentLocation.value.status || '').toLowerCase()
  
  if (status.includes('비') || status.includes('rain') || status.includes('snow')) {
    return [
      { title: '실내 독서', time: '오후 2시 - 4시', score: '90%', type: '추천', icon: '📚' },
      { title: '홈 트레이닝', time: '오후 6시 - 7시', score: '85%', type: '추천', icon: '🧘' },
      { title: '실내 카페 투어', time: '오후 1시 - 3시', score: '80%', type: '추천', icon: '☕' }
    ]
  } else if (temp > 30) {
    return [
      { title: '실내 수영', time: '오전 10시 - 12시', score: '95%', type: '추천', icon: '🏊' },
      { title: '에어컨 아래 휴식', time: '오후 2시 - 5시', score: '90%', type: '추천', icon: '❄️' },
      { title: '야외 활동 자제', time: '오후 12시 - 3시', score: '20%', type: '주의', icon: '⚠️' }
    ]
  } else {
    return [
      { title: '조깅 / 러닝', time: '오전 6시 - 9시', score: '90%', type: '추천', icon: '🏃' },
      { title: '자전거 타기', time: '오전 9시 - 11시', score: '85%', type: '추천', icon: '🚴' },
      { title: '야외 사진 촬영', time: '오후 3시 - 6시', score: '60%', type: '보통', icon: '📷' },
      { title: '피크닉', time: '오후 12시 - 3시', score: '80%', type: '추천', icon: '🧺' },
      { title: '캠핑', time: '오후 3시 이후', score: '30%', type: '주의', icon: '⛺' }
    ]
  }
})

const mySchedule = computed(() => {
  return recommendedActivities.value.map(a => ({ title: a.title, time: a.time, icon: a.icon }))
})

"""
content = content.replace("const hourlyForecast = ref((() => {", script_addition + "const hourlyForecast = ref((() => {")

# 2. Rewrite cards-grid
cards_grid_pattern = re.compile(r'<div class="cards-grid">.*?(?=    <!-- Right Sidebar -->)', re.DOTALL)

new_grid = """<div class="cards-grid new-layout">
      <!-- 1. Top Card (Combined) -->
      <div class="card top-card">
        <div class="main-info">
          <p class="location-label">현재 위치</p>
          <h2 class="location-name">{{ currentLocation?.name || '울산광역시' }} <el-icon><Location /></el-icon></h2>
          <div class="weather-brief">
            <span class="main-icon">☀️</span>
            <h1 class="main-temp">{{ currentLocation ? formatTemp(currentLocation.temp) : 30 }}°C</h1>
          </div>
          <p class="weather-status">맑음 | 체감 32°C</p>
          <p class="extra-info">습도 {{ currentLocation?.humidity || 62 }}% | 강수확률 0% | 미세먼지 좋음</p>
        </div>
        
        <div class="hourly-part">
          <button class="scroll-btn left" @click="scrollLeft">&lt;</button>
          <button class="scroll-btn right" @click="scrollRight">&gt;</button>
          <div class="hourly-scroll" ref="hourlyScrollRef">
            <div class="hourly-content" :style="{ width: (hourlyForecast.length * 70) + 'px' }">
              <svg class="chart-svg" :width="hourlyForecast.length * 70" height="90">
                <line v-for="(p, i) in points" :key="'l' + i" :x1="p.x" :y1="p.y" :x2="p.x" :y2="90" stroke="#f1f5f9" stroke-width="2" />
                <polyline :points="polylinePoints" class="temp-line" fill="none" stroke="#cbd5e1" stroke-width="3" />
                <circle v-for="(p, i) in points" :key="'c' + i" :cx="p.x" :cy="p.y" r="4" fill="#e2e8f0" stroke="#ffffff" stroke-width="2" />
              </svg>
              <div class="forecast-items">
                <div class="forecast-item" v-for="(item, idx) in hourlyForecast" :key="idx" :style="{ width: '70px' }">
                  <span class="temp-label" :style="{ top: points[idx]?.y - 25 + 'px' }">{{ item.temp }}°</span>
                  <div class="icon-label">{{ item.icon }}</div>
                  <div class="time-label">{{ item.time }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="daily-stats">
            <div class="stat-col"><span>최저 / 최고</span><strong>28° / 33°</strong></div>
            <div class="stat-col"><span>습도</span><strong>62%</strong></div>
            <div class="stat-col"><span>풍속</span><strong>2.1 m/s</strong></div>
            <div class="stat-col"><span>일출 / 일몰</span><strong>05:21 / 19:45</strong></div>
          </div>
        </div>
      </div>

      <!-- 2. Middle Row -->
      <div class="card activity-card">
        <div class="card-header">
          <h3>오늘의 활동 추천</h3>
          <a href="#">전체 보기 ></a>
        </div>
        <p class="sub-desc">현재 날씨와 기온을 고려한 추천 활동이에요</p>
        <div class="activity-list">
          <div class="activity-item" v-for="(act, idx) in recommendedActivities" :key="idx">
            <div class="act-badge" :class="act.type === '추천' ? 'good' : (act.type === '보통' ? 'normal' : 'bad')">{{ act.type }}</div>
            <div class="act-icon">{{ act.icon }}</div>
            <div class="act-title">{{ act.title }}</div>
            <div class="act-time">{{ act.time }}</div>
            <div class="act-score">추천 지수 <strong>{{ act.score }}</strong></div>
          </div>
        </div>
      </div>

      <!-- 3. Schedule Card -->
      <div class="card schedule-card">
        <div class="card-header">
          <h3>오늘의 내 스케줄</h3>
          <span>+</span>
        </div>
        <div class="schedule-list">
          <div class="schedule-item" v-for="(sched, idx) in mySchedule" :key="idx">
            <div class="sched-icon">{{ sched.icon }}</div>
            <div class="sched-info">
              <strong>{{ sched.title }}</strong>
              <span>{{ sched.time }}</span>
            </div>
          </div>
        </div>
        <button class="more-btn">전체 스케줄 보기 ></button>
      </div>

      <!-- 4. Bottom Row -->
      <div class="bottom-wrapper">
        <div class="card dust-card">
          <div class="card-header">
            <h3>미세먼지 농도</h3>
            <span class="status-good">좋음 12 μg/m³</span>
          </div>
          <div class="dust-stats">
            <div class="dust-col"><span>미세먼지 (PM10)</span><strong>12 <small>μg/m³</small></strong><span class="status-good">좋음</span></div>
            <div class="dust-col"><span>초미세먼지 (PM2.5)</span><strong>6 <small>μg/m³</small></strong><span class="status-good">좋음</span></div>
            <div class="dust-col"><span>이산화질소 (NO₂)</span><strong>8 <small>ppb</small></strong><span class="status-good">좋음</span></div>
          </div>
        </div>

        <div class="card discomfort-card">
          <div class="card-header">
            <h3>불쾌지수</h3>
            <span class="status-ok">75 Okay</span>
          </div>
          <div class="discomfort-bar-wrapper">
             <div class="discomfort-bar">
               <div class="bar-fill" style="width: 75%"></div>
             </div>
             <div class="bar-labels">
               <span>Great<br>0-75</span>
               <span>Okay<br>75-80</span>
               <span>Bad<br>80+</span>
             </div>
          </div>
        </div>
      </div>
    </div>
"""
content = cards_grid_pattern.sub(new_grid, content)

# 3. Add CSS for new layout
css_addition = """
.new-layout {
  display: grid !important;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}
.top-card {
  grid-column: 1 / 3;
  display: flex;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6effa 100%) !important;
  padding: 30px;
  gap: 30px;
}
.main-info {
  flex: 1;
}
.hourly-part {
  flex: 2;
  position: relative;
  display: flex;
  flex-direction: column;
}
.daily-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  background: rgba(255,255,255,0.5);
  padding: 15px;
  border-radius: 12px;
}
.daily-stats .stat-col {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #64748b;
}
.daily-stats .stat-col strong {
  font-size: 14px;
  color: #1e293b;
  margin-top: 5px;
}

.activity-card {
  grid-column: 1;
  background-color: #f8fafc !important;
}
.activity-list {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  margin-top: 15px;
  padding-bottom: 10px;
}
.activity-item {
  min-width: 120px;
  background: #ffffff;
  padding: 15px;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  text-align: center;
  position: relative;
}
.act-badge {
  position: absolute;
  top: -10px;
  right: 10px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  color: white;
  font-weight: bold;
}
.act-badge.good { background: #22c55e; }
.act-badge.normal { background: #facc15; }
.act-badge.bad { background: #ef4444; }
.act-icon { font-size: 32px; margin: 10px 0; }
.act-title { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
.act-time { font-size: 12px; color: #64748b; }
.act-score { font-size: 11px; margin-top: 10px; color: #94a3b8; }

.schedule-card {
  grid-column: 2;
  grid-row: 2 / 4;
  background: linear-gradient(135deg, #faf5ff, #f3e8ff) !important;
  display: flex;
  flex-direction: column;
}
.schedule-list {
  flex: 1;
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.schedule-item {
  display: flex;
  align-items: center;
  background: #ffffff;
  padding: 15px;
  border-radius: 12px;
  gap: 15px;
}
.sched-icon { font-size: 24px; }
.sched-info { display: flex; flex-direction: column; }
.sched-info strong { font-size: 14px; color: #1e293b; }
.sched-info span { font-size: 12px; color: #64748b; margin-top: 4px; }

.bottom-wrapper {
  grid-column: 1;
  display: flex;
  gap: 20px;
}
.dust-card, .discomfort-card {
  flex: 1;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header h3 { margin: 0; font-size: 16px; color: #1e293b; }
.card-header a { font-size: 13px; color: #64748b; text-decoration: none; }
.status-good { color: #3b82f6; font-weight: bold; font-size: 13px; }
.status-ok { color: #d97706; font-weight: bold; font-size: 18px; }

.dust-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}
.dust-col {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #64748b;
}
.dust-col strong { font-size: 18px; color: #1e293b; margin: 5px 0; }

.discomfort-bar-wrapper {
  margin-top: 30px;
}
.discomfort-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  position: relative;
}
.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #facc15, #ef4444);
  border-radius: 4px;
}
.bar-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 11px;
  color: #64748b;
  text-align: center;
}
"""

content = content.replace("</style>", css_addition + "\n</style>")

with open('src/views/WeatherHomeView.vue', 'w') as f:
    f.write(content)

print("Done")
