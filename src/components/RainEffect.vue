<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({ storm: Boolean })
const canvas = ref(null)

let frameId
let resizeObserver
let context
let width = 0
let height = 0
let drops = []
let ripples = []
let lastTime = 0

const random = (min, max) => min + Math.random() * (max - min)

function createDrop(initial = false) {
  const depth = Math.pow(Math.random(), 1.7)
  return {
    x: random(-width * 0.08, width),
    y: initial ? random(-height * 0.15, height) : random(-height * 0.22, -20),
    depth,
    speed: random(620, 980) + depth * 820 + (props.storm ? 320 : 0),
    length: random(9, 20) + depth * 34,
    width: random(0.45, 0.9) + depth * 1.15,
    wind: random(72, 115) + (props.storm ? 45 : 0),
    alpha: random(0.12, 0.3) + depth * 0.42,
  }
}

function resetDrops() {
  const density = props.storm ? 0.105 : 0.072
  const count = Math.min(260, Math.max(80, Math.round(width * density)))
  drops = Array.from({ length: count }, () => createDrop(true))
}

function resize() {
  const element = canvas.value
  if (!element) return
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  width = element.parentElement?.clientWidth || window.innerWidth
  height = element.parentElement?.clientHeight || window.innerHeight
  element.width = width * ratio
  element.height = height * ratio
  element.style.width = `${width}px`
  element.style.height = `${height}px`
  context = element.getContext('2d')
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  resetDrops()
}

function createRipple(drop) {
  if (ripples.length > 32 || Math.random() > 0.34) return
  ripples.push({
    x: drop.x,
    y: height - random(8, 48),
    radius: 1,
    life: 1,
    speed: random(18, 34),
  })
}

function drawRain(delta) {
  context.clearRect(0, 0, width, height)

  const veil = context.createLinearGradient(0, height * 0.35, 0, height)
  veil.addColorStop(0, 'rgba(172, 199, 218, 0)')
  veil.addColorStop(1, `rgba(177, 205, 224, ${props.storm ? 0.1 : 0.065})`)
  context.fillStyle = veil
  context.fillRect(0, 0, width, height)

  context.lineCap = 'round'
  for (let index = 0; index < drops.length; index += 1) {
    const drop = drops[index]
    drop.y += drop.speed * delta
    drop.x += drop.wind * delta

    if (drop.y > height + drop.length || drop.x > width + 80) {
      if (drop.y > height) createRipple(drop)
      drops[index] = createDrop()
      continue
    }

    const lean = drop.length * (drop.wind / drop.speed)
    const gradient = context.createLinearGradient(drop.x - lean, drop.y - drop.length, drop.x, drop.y)
    gradient.addColorStop(0, 'rgba(225, 242, 252, 0)')
    gradient.addColorStop(0.55, `rgba(216, 237, 250, ${drop.alpha * 0.56})`)
    gradient.addColorStop(1, `rgba(247, 252, 255, ${drop.alpha})`)
    context.strokeStyle = gradient
    context.lineWidth = drop.width
    context.beginPath()
    context.moveTo(drop.x - lean, drop.y - drop.length)
    context.quadraticCurveTo(drop.x - lean * 0.42, drop.y - drop.length * 0.45, drop.x, drop.y)
    context.stroke()

    if (drop.depth > 0.72) {
      context.fillStyle = `rgba(245, 251, 255, ${drop.alpha * 0.72})`
      context.beginPath()
      context.ellipse(drop.x, drop.y, drop.width * 0.72, drop.width * 1.7, 0.2, 0, Math.PI * 2)
      context.fill()
    }
  }

  ripples = ripples.filter((ripple) => {
    ripple.life -= delta * 1.8
    ripple.radius += ripple.speed * delta
    if (ripple.life <= 0) return false
    context.strokeStyle = `rgba(226, 242, 252, ${ripple.life * 0.42})`
    context.lineWidth = 0.8
    context.beginPath()
    context.ellipse(ripple.x, ripple.y, ripple.radius * 2.6, ripple.radius * 0.48, 0, 0, Math.PI * 2)
    context.stroke()
    return true
  })
}

function animate(time) {
  const delta = Math.min((time - lastTime) / 1000 || 0, 0.035)
  lastTime = time
  if (context) drawRain(delta)
  frameId = requestAnimationFrame(animate)
}

watch(() => props.storm, resetDrops)

onMounted(() => {
  resize()
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(document.documentElement)
  frameId = requestAnimationFrame(animate)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId)
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="rain-effect" :class="{ 'is-storm': storm }" aria-hidden="true">
    <canvas ref="canvas"></canvas>
    <div class="rain-haze"></div>
    <div class="lens-drops"></div>
  </div>
</template>

<style scoped>
.rain-effect { position: fixed; inset: 0 0 0 240px; z-index: 0; overflow: hidden; pointer-events: none; }
canvas { position: absolute; inset: 0; width: 100%; height: 100%; filter: drop-shadow(0 0 1px rgba(224,242,252,.22)); }
.rain-haze { position: absolute; inset: 48% 0 0; background: linear-gradient(180deg, transparent, rgba(188,211,226,.1)); animation: rain-haze 6s ease-in-out infinite alternate; }
.lens-drops { position: absolute; inset: 0; opacity: .16; background-image: radial-gradient(ellipse at 18% 25%,transparent 0 3px,rgba(226,241,250,.38) 4px,transparent 7px),radial-gradient(ellipse at 72% 38%,rgba(228,243,252,.28) 0 2px,transparent 6px),radial-gradient(ellipse at 42% 72%,transparent 0 4px,rgba(218,237,249,.3) 5px,transparent 9px); background-size: 210px 270px,310px 360px,390px 440px; animation: lens-flow 15s ease-in-out infinite alternate; }
.is-storm .rain-haze { background: linear-gradient(180deg,transparent,rgba(165,194,213,.16)); }
.is-storm .lens-drops { opacity: .24; }
@keyframes rain-haze { to { transform: translateY(-4%); opacity: .72; } }
@keyframes lens-flow { to { background-position: 4px 18px,-5px 26px,3px 20px; } }
@media (max-width: 768px) { .rain-effect { inset: 0; } }
</style>
