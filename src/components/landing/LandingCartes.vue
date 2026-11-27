<script setup lang="ts">
import { defineAsyncComponent, onUnmounted, ref } from 'vue'
import type { Webtoon } from '@/types'
import type { ProgressState } from '@/types/progress'
import { lockScroll, unlockScroll } from '@/services/scrollLock'
import WebtoonCard from '@/components/dashboard/WebtoonCard.vue'
import { COUVERTURES, utiliserWebtoonsDemo } from './demo'

// Chargée au premier clic sur une carte : un visiteur n'ouvrira peut-être jamais de fiche
const WebtoonModal = defineAsyncComponent(() => import('@/components/dashboard/WebtoonModal.vue'))

// Invitation manuscrite sous l'aperçu, propre à chaque page
defineProps<{ invitation?: string }>()

const webtoons = utiliserWebtoonsDemo()

const ouvert = ref<Webtoon | null>(null)

// Les changements ne vivent que dans cette page : rien n'est envoyé, tout est oublié en la quittant
function modifier(
  id: number | undefined,
  suivi: { state?: ProgressState | null; bookmark?: number },
) {
  const webtoon = webtoons.value.find((w) => w.id === id)
  if (webtoon) webtoon.userProgress = { ...webtoon.userProgress, ...suivi }
}

function ouvrir(webtoon: Webtoon) {
  ouvert.value = webtoon
  lockScroll()
}

// Page quittée fiche ouverte (bouton Précédent) : le défilement n'est plus figé, sans ramener la page suivante
onUnmounted(() => {
  if (ouvert.value) unlockScroll(false)
})

function fermer() {
  ouvert.value = null
  unlockScroll()
}

function enregistrer(modifie: Webtoon) {
  const index = webtoons.value.findIndex((w) => w.id === modifie.id)
  if (index !== -1) webtoons.value[index] = modifie
  ouvert.value = modifie
}
</script>

<template>
  <figure class="cartes">
    <div class="cartes-cadre">
      <div class="cartes-onglets" aria-hidden="true">
        <span class="onglet actif">Bibliothèque</span>
        <span class="onglet">Catalogue</span>
      </div>
      <div class="webtoon-grid">
        <WebtoonCard
          v-for="webtoon in webtoons"
          :key="webtoon.id"
          :webtoon="webtoon"
          :cover="COUVERTURES[webtoon.id!]"
          demo
          @click="ouvrir(webtoon)"
          @status-change="(state: ProgressState | null) => modifier(webtoon.id, { state })"
          @bookmark-change="(bookmark: number) => modifier(webtoon.id, { bookmark })"
        />
      </div>
    </div>
    <figcaption class="cartes-legende">
      Webtoons et couvertures fictifs, créés pour l'exemple.
      <span v-if="invitation" class="invitation">{{ invitation }}</span>
    </figcaption>
  </figure>

  <!-- Hors de l'aperçu, que la page peut incliner : la fenêtre couvre tout l'écran -->
  <Teleport to="body">
    <WebtoonModal
      v-if="ouvert"
      :webtoon="ouvert"
      :cover="COUVERTURES[ouvert.id!]"
      demo
      @close="fermer"
      @saved="enregistrer"
    />
  </Teleport>
</template>

<style scoped>
.cartes {
  margin: 0;
}

.cartes-cadre {
  padding: 14px 16px 22px;
  border-radius: 10px;
  background: #181818;
  border: 1px solid #2a2a2a;
  box-shadow: 0 24px 50px -24px rgba(0, 0, 0, 0.9);
}

.cartes-onglets {
  display: flex;
  gap: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid #2a2a2a;
  font-size: 0.8rem;
  font-weight: 600;
}

.onglet {
  padding: 6px 0 8px;
  color: #8a8a8a;
}

/* Le catalogue n'existe pas dans l'aperçu : l'onglet est éteint, pour ne pas inviter au clic */
.onglet:not(.actif) {
  color: #4a4a4a;
  cursor: not-allowed;
  user-select: none;
}

.onglet.actif {
  color: #fff;
  box-shadow: inset 0 -2px 0 #e50914;
}

/* Grille du tableau de bord (DashboardView) */
.webtoon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 20px 12px;
}

@media (min-width: 480px) {
  .webtoon-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 25px 15px;
  }
}

.invitation {
  display: block;
  margin-top: 10px;
  font-family: 'Caveat', cursive;
  font-size: 1.35rem;
  color: #c9c9ce;
}

.cartes-legende {
  margin-top: 10px;
  font-size: 0.75rem;
  color: #8e8e93;
  text-align: center;
}
</style>
