// ce composant permet de gérer le select custom de l'état du webtoon

<script>
const STATUS_OPTIONS = new Map([
  [null, { label: 'Aucun', class: 'status-none' }],
  ['reading', { label: 'En cours', class: 'status-reading' }],
  ['pause', { label: 'En pause', class: 'status-paused' }],
  ['break', { label: 'Pas intéressé', class: 'status-disinterested' }],
  ['completed', { label: 'Terminé', class: 'status-completed' }]
])
</script>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  state: {
    type: String,
    default: null
  }
})
const emit = defineEmits(['update:state'])

const isOpen = ref(false)
const containerRef = ref(null) // Référence pour le click outside

// Ferme le menu si on clique n'importe où ailleurs sur la page
const closeDropdown = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

// récupération du statut
const currentStatus = computed(() => STATUS_OPTIONS.get(props.state) || STATUS_OPTIONS.get(null))

// update du statut
const selectStatus = (statusId) => {
  emit('update:state', statusId)
  isOpen.value = false
}

onMounted(() => window.addEventListener('click', closeDropdown))
onUnmounted(() => window.removeEventListener('click', closeDropdown))
</script>

<template>
  <div class="custom-select-container" ref="containerRef">
    <button 
      type="button"
      @click.stop="isOpen = !isOpen" 
      class="status-btn" 
      :class="[currentStatus.class, { 'is-active': isOpen }]"
      :title="`Statut : ${currentStatus.label}`"
    >
      <slot :label="currentStatus.label">
        </slot>
      <span class="arrow"></span>
    </button>

    <ul v-if="isOpen" class="status-dropdown">
      <li
        v-for="([id, data], index) in STATUS_OPTIONS"
        :key="index"
        @click.stop="selectStatus(id)"
        :class="data.class"
      >
        {{ data.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.custom-select-container { position: relative; width: 100%; height: 100%; }

.status-btn { 
  border: none; 
  border-radius: 4px; 
  color: #ffffff; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  cursor: pointer; 
  box-shadow: 0 2px 6px rgba(0,0,0,0.4); 
  transition: filter 0.2s ease;
  width: 100%;
  height: 100%;
}

.status-btn .arrow { 
  width: 0; 
  height: 0; 
  border-left: 3.5px solid transparent; 
  border-right: 3.5px solid transparent; 
  border-top: 4.5px solid #ffffff; 
  transition: transform 0.2s ease; 
}
.status-btn.is-active .arrow { transform: rotate(180deg); }

.status-btn:hover,
.status-dropdown li:hover {
  filter: brightness(0.75);
}

.status-none { background-color: rgba(85, 85, 85, 0.9); }
.status-reading { background-color: rgba(33, 150, 243, 0.9); }
.status-paused { background-color: rgba(255, 152, 0, 0.9); }
.status-disinterested { background-color: rgba(229, 9, 20, 0.9); }
.status-completed { background-color: rgba(76, 175, 80, 0.9); }

.status-dropdown { 
  position: absolute; 
  top: 100%; 
  right: 0; 
  width: 110px; 
  margin: 4px 0 0 0; 
  padding: 0; 
  list-style: none; 
  background-color: #1f1f1f; 
  border: 1px solid #333333; 
  border-radius: 4px; 
  z-index: 100; 
  box-shadow: 0 5px 15px rgba(0,0,0,0.6); 
  overflow: hidden; 
}
.status-dropdown li { padding: 6px 8px; font-size: 0.75rem; color: #ffffff; cursor: pointer; transition: filter 0.2s ease; }
</style>