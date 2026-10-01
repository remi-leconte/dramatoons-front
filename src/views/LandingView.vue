<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import CanvasBoard from '../components/CanvasBoard.vue'

const authStore = useAuthStore()
const showLegalBanner = ref(true)

onMounted(() => {
  if (authStore.isAuthenticated) {
    const dismissed = localStorage.getItem('legal_banner_dismissed')
    if (dismissed === 'true') {
      showLegalBanner.value = false
    }
  }
})

/*const dismissLegalBanner = () => {
  showLegalBanner.value = false
  localStorage.setItem('legal_banner_dismissed', 'true')
}*/
</script>

<template>
  <div v-if="showLegalBanner" class="legal-banner">
    <p class="legal-banner-text">Ce site n’héberge aucun contenu protégé par le droit d'auteur et ne fournit aucun lien vers des plateformes de diffusion non autorisées.</p>
    <p class="legal-banner-text">This site does not host any copyrighted content, nor does it provide links to unauthorized distribution platforms.</p>
    <!--<button class="legal-banner-btn" @click="dismissLegalBanner">
      J'ai compris
    </button>-->
  </div>

  <CanvasBoard />

  <section id="faq">
    <h2 style="border-bottom: solid 0.2rem #bdd8fb;">FAQ</h2>
    <h3 style="border-bottom: dotted 1px var(--border-color-base,#a2a9b1);margin: 0;">Le Webtoon que je suis en train de lire n'existe pas sur le site !</h3>
    <p style="margin-top: 0;">
      Vous pouvez créer votre propre Webtoon.<br>
      Par contre, sachez qu'à tout moment votre Webtoon pourra être repris et publié à l'ensemble des utilisateurs par un modérateur (l'image et le titre pourraient changer si l'administrateur le souhaite).
    </p>

    <h3 style="border-bottom: dotted 1px var(--border-color-base,#a2a9b1);margin: 0;">J'aimerais bien devenir modérateur.</h3>
    <p style="margin-top: 0;">Je vais bientôt ouvrir un serveur Discord, ça sera la première étape pour venir en discuter.</p>

    <h3 style="border-bottom: dotted 1px var(--border-color-base,#a2a9b1);margin: 0;">J'ai plein d'idées pour améliorer le site / J'aimerais bien participer au développement du site.</h3>
    <p style="margin-top: 0;">Je vais bientôt ouvrir un serveur Discord, ça sera la première étape pour venir en discuter.</p>
  </section>

  <section id="evo">
    <h2 style="border-bottom: solid 0.2rem #bdd8fb;">Futures évolutions / bugs connus</h2>
    <h3 style="border-bottom: dotted 1px var(--border-color-base,#a2a9b1);margin: 0;">Le Webtoon que je suis en train de lire existe sur le site, mais le titre/l'image ne correspond pas !</h3>
    <p style="margin-top: 0;">Deux évolutions vont arriver : un serveur discord où vous pourrez directement venir nous le dire, ainsi qu'un bouton directement sur la fiche du Webtoon pour nous avertir.</p>

    <h3 style="border-bottom: dotted 1px var(--border-color-base,#a2a9b1);margin: 0;">Le Webtoon que je suis en train de lire existe sur le site, mais le titre du site sur lequel je le lis n'est pas le même !</h3>
    <p style="margin-top: 0;">Parfois, un Webtoon a des titres différents ou est tout simplement traduit. Une évolution du site permettra de renseigner des titres secondaires.</p>
  </section>
</template>

<style scoped>
#faq, #evo {
  overflow: hidden;
  width: 697px;
  margin: 0 auto;
}

/* Bandeau Légal */
.legal-banner {
  background-color: #2f3542;
  color: #fff;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  max-width: 697px;
  margin: 0 auto 20px auto;
  border-radius: 0px 0px 6px 6px;
  font-family: sans-serif;
}

.legal-banner-text {
  margin: 0;
  font-size: 0.9rem;
}

.legal-banner-btn {
  background-color: #eccc68;
  color: #1e1e24;
  border: none;
  padding: 6px 14px;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}

.legal-banner-btn:hover {
  background-color: #ff7f50;
  color: #fff;
}

/* Responsive */
@media (max-width: 768px) and (min-width: 420px) {
  #faq, #evo, .legal-banner {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .legal-banner {
    padding: 20px;
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 419px) {
  #faq, #evo, .legal-banner {
    width: 420px;
    box-sizing: border-box;
  }

  .legal-banner {
    padding: 20px;
    flex-direction: column;
    text-align: center;
  }
}
</style>