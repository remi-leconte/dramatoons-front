<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 1. On définit les données reçues du parent (le statut actuel)
const props = defineProps({
  modelValue: {
    type: String,
    default: null
  }
})

// 2. On définit l'événement qu'on va renvoyer au parent lors d'un changement
const emit = defineEmits(['update:modelValue'])

// Gestion de l'ouverture locale du menu (plus besoin d'index, chaque composant gère son propre état !)
const isOpen = ref(false)

// Options de statuts identiques
const statusOptions = [
  { id: null, label: 'Aucun', class: 'status-none' },
  { id: 'reading', label: 'En cours', class: 'status-reading' },
  { id: 'pause', label: 'En pause', class: 'status-paused' },
  { id: 'break', label: 'Pas intéressé', class: 'status-disinterested' },
  { id: 'completed', label: 'Terminé', class: 'status-completed' }
]

// Calcule la classe CSS actuelle basée sur la prop reçue
const currentStatusClass = computed(() => {
  const option = statusOptions.find(o => o.id === props.modelValue)
  return option ? option.class : 'status-none'
})

// Calcule le texte actuel basé sur la prop reçue
const currentStatusLabel = computed(() => {
  const option = statusOptions.find(o => o.id === props.modelValue)
  return option ? option.label : 'Aucun'
})

// Déclenche le changement et informe le parent via l'emit
const selectStatus = (statusId) => {
  emit('update:modelValue', statusId)
  isOpen.value = false
}

// Ferme le menu si on clique n'importe où ailleurs sur la page
const closeDropdown = (e) => {
  if (!e.target.closest('.custom-select-container')) {
    isOpen.value = false
  }
}

onMounted(() => window.addEventListener('click', closeDropdown))
onUnmounted(() => window.removeEventListener('click', closeDropdown))
</script>

<template>
  <div class="custom-select-container">
    <button 
      type="button"
      @click.stop="isOpen = !isOpen" 
      class="status-btn" 
      :class="[currentStatusClass, { 'is-active': isOpen }]"
      :title="`Statut : ${currentStatusLabel}`"
    >
      <slot :label="currentStatusLabel">
        </slot>
      <span class="arrow"></span>
    </button>

    <ul v-if="isOpen" class="status-dropdown">
      <li 
        v-for="option in statusOptions" 
        :key="option.id"
        @click.stop="selectStatus(option.id)"
        :class="option.class"
      >
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* --- DESIGN DU SÉLECTEUR CUSTOM (Isolé grâce à scoped) --- */
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

/* Couleurs */
.status-none { background-color: rgba(85, 85, 85, 0.9); }
.status-reading { background-color: rgba(33, 150, 243, 0.9); }
.status-paused { background-color: rgba(255, 152, 0, 0.9); }
.status-disinterested { background-color: rgba(229, 9, 20, 0.9); }
.status-completed { background-color: rgba(76, 175, 80, 0.9); }

.status-btn:hover,
.status-dropdown li:hover {
  filter: brightness(0.75);
}

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