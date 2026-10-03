<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { COVER_BASE_URL } from '../../services/api'

const props = defineProps({
  imagePath: { type: String, default: '' },
  isEditable: { type: Boolean, default: false },
  title: { type: String, default: '' }
})

const emit = defineEmits<{
  (e: 'file-selected', file: File): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const previewImage = ref<string | null>(null)
const hasImageError = ref(false)

watch(() => props.imagePath, () => {
  hasImageError.value = false
})

const currentImageUrl = computed(() => {
  if (previewImage.value) return previewImage.value
  if (props.imagePath) return `${COVER_BASE_URL}${props.imagePath}`
  return null
})

const handleClick = () => {
  if (props.isEditable && fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    hasImageError.value = false
    previewImage.value = URL.createObjectURL(file)
    emit('file-selected', file)
  }
}
</script>

<template>
  <div class="modal-left">
    <div 
      class="image-container"
      :class="{ 'is-clickable': isEditable }"
      @click="handleClick"
    >
      <img
        v-if="currentImageUrl && !hasImageError"
        :src="currentImageUrl"
        :alt="title || 'Webtoon cover'"
        @error="hasImageError = true"
      >
      <div v-else class="cover-placeholder">
        <span class="placeholder-text">{{ title || 'Sans image' }}</span>
      </div>

      <div v-if="isEditable" class="image-overlay">
        <span>{{ currentImageUrl && !hasImageError ? "Changer l'image" : "Ajouter une image" }}</span>
      </div>
    </div>

    <input 
      v-if="isEditable"
      ref="fileInputRef"
      type="file" 
      accept="image/*" 
      style="display: none;" 
      @change="handleFileChange"
    >
  </div>
</template>

<style scoped>
.modal-left { align-self: center; width: 140px; }
.image-container { position: relative; width: 100%; aspect-ratio: 2 / 3; border-radius: 6px; overflow: hidden; background: #252525; }
.image-container img { width: 100%; height: 100%; object-fit: cover; display: block; }
.image-container.is-clickable { cursor: pointer; }
.image-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.2s ease;
  text-align: center;
  padding: 5px;
}
.image-container.is-clickable:hover .image-overlay { opacity: 1; }
</style>