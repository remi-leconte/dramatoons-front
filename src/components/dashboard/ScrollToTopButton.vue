// Le bouton de retour en haut de page
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const showScrollTop = ref(false)
let lastScrollY = 0

const handleScroll = () => {
  const currentScrollY = window.scrollY
  if (currentScrollY < lastScrollY && currentScrollY > 300) {
    showScrollTop.value = true
  } else {
    showScrollTop.value = false
  }
  lastScrollY = currentScrollY
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <Transition name="fade">
    <button 
      v-if="showScrollTop" 
      class="scroll-top-btn" 
      aria-label="Retourner en haut"
      @click="scrollToTop"
    >
      ▲
    </button>
  </Transition>
</template>

<style scoped>
.scroll-top-btn {
  position: fixed;
  bottom: 25px;
  right: 25px;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background-color: #e50914;
  color: #ffffff;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.scroll-top-btn:hover {
  background-color: #b20710;
  transform: scale(1.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>