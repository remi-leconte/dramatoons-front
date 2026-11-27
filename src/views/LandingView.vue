<script setup lang="ts">
import '@fontsource/caveat/400.css'
import LandingCartes from '@/components/landing/LandingCartes.vue'
import LandingRuban from '@/components/landing/LandingRuban.vue'
import LandingSites from '@/components/landing/LandingSites.vue'
import { fournirWebtoonsDemo } from '@/components/landing/demo'
import { QUESTIONS } from '@/components/landing/faq'

// La bibliothèque d'exemple, partagée par l'aperçu et les extraits de sites, n'existe que le temps de la page
fournirWebtoonsDemo()
</script>

<template>
  <div class="accueil">
    <LandingRuban />

    <section class="bloc accroche" aria-labelledby="titre-accroche">
      <h1 id="titre-accroche">
        Ne perdez plus le <span class="mot-fil" data-fil-depart>fil</span> de vos webtoons
      </h1>
      <p class="chapeau">
        Votre bibliothèque, le dernier chapitre lu et vos notes, quel que soit le site où vous
        lisez.
      </p>
      <router-link to="/register" class="btn-primary btn-grand">Créer un compte</router-link>
      <p class="mention">Gratuit et sans publicité.</p>
    </section>

    <section class="bloc apercu" data-fil="d" aria-label="Aperçu de l'application">
      <LandingCartes
        invitation="Essayez : changez un état, avancez d'un chapitre, ouvrez une fiche et allez voir le suivi en bas !"
      />
    </section>

    <section class="bloc carnet" data-fil="g" aria-labelledby="titre-carnet">
      <h2 id="titre-carnet">Un carnet de lecture, <em>pas</em> un site de lecture</h2>
      <p class="intro">
        Dramatoons n'héberge aucun webtoon : ni chapitre, ni lien vers des chapitres. Vous lisez sur
        les sites de votre choix ; Dramatoons garde le fil.
      </p>
      <dl class="comparaison">
        <div class="colonne est">
          <dt>Dramatoons, c'est</dt>
          <dd>votre bibliothèque</dd>
          <dd>votre progression</dd>
          <dd>vos notes</dd>
        </div>
        <div class="colonne nest-pas">
          <dt>Ce n'est pas</dt>
          <dd>un site de lecture</dd>
          <dd>un hébergeur de chapitres</dd>
          <dd>un annuaire de liens</dd>
        </div>
      </dl>
    </section>

    <section class="bloc suivi" aria-labelledby="titre-suivi">
      <h2 id="titre-suivi" data-fil="d">Retrouvez vos webtoons sur n'importe quel site web</h2>
      <p class="intro centre">
        Activez l'extension Dramatoons sur un onglet : les webtoons de votre bibliothèque y sont
        surlignés de la couleur de leur état, avec votre note et votre dernier chapitre lu.
      </p>
      <LandingSites />
      <p class="mention centre">
        Essayez : changez un état dans la bibliothèque plus haut, et vous verrez votre suivi
        s'actualiser !
      </p>
      <p class="petit centre">
        Firefox, Chrome et les autres navigateurs basés sur Chromium.
        <router-link to="/install-tutorial" class="lien">Installer l'extension</router-link>
      </p>
    </section>

    <section class="bloc faq" aria-labelledby="titre-faq">
      <h2 id="titre-faq" data-fil="g">Questions fréquentes</h2>
      <div class="questions">
        <details v-for="item in QUESTIONS" :key="item.question">
          <summary>{{ item.question }}</summary>
          <p>
            {{ item.reponse }}
            <template v-if="item.lien">
              <router-link v-if="item.lien.to" :to="item.lien.to">{{
                item.lien.texte
              }}</router-link>
              <a v-else :href="item.lien.href">{{ item.lien.texte }}</a>
            </template>
          </p>
        </details>
      </div>
    </section>
  </div>
</template>

<style scoped>
.accueil {
  position: relative;
  padding: 0 20px 40px;
  background:
    radial-gradient(800px 420px at 50% -80px, rgba(229, 9, 20, 0.1), transparent 70%), #121214;
  color: #f2f2f2;
  overflow-x: clip;
}

.bloc {
  position: relative;
  z-index: 1;
  max-width: 980px;
  margin: 0 auto;
}

.accroche {
  padding: 88px 0 72px;
  text-align: center;
}

h1 {
  max-width: 13em;
  margin: 0 auto;
  font-size: clamp(2.3rem, 7vw, 4.2rem);
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: -0.035em;
}

.mot-fil {
  color: #e50914;
}

.chapeau {
  max-width: 32rem;
  margin: 24px auto 34px;
  font-size: clamp(1.02rem, 2.4vw, 1.18rem);
  line-height: 1.6;
  color: #b8b8bd;
}

.btn-grand {
  padding: 13px 28px;
  font-size: 1rem;
  border-radius: 999px;
}

.btn-grand:focus-visible,
.lien:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

.mention {
  margin: 14px 0 0;
  font-family: 'Caveat', cursive;
  font-size: 1.35rem;
  color: #c9c9ce;
}

.apercu {
  max-width: 940px;
  padding-bottom: 120px;
}

h2 {
  margin: 0 0 16px;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  line-height: 1.15;
  font-weight: 750;
  letter-spacing: -0.025em;
}

.carnet {
  max-width: 760px;
  padding-bottom: 130px;
}

.carnet em {
  font-style: normal;
  color: #e50914;
}

.intro {
  max-width: 36rem;
  margin: 0 0 32px;
  line-height: 1.65;
  color: #b8b8bd;
}

.comparaison {
  display: grid;
  gap: 24px;
  margin: 0;
}

.colonne dt {
  margin-bottom: 10px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #8e8e93;
}

.colonne dd {
  margin: 0 0 6px;
  font-size: 1.05rem;
}

.est dd::before {
  content: '✓  ';
  color: #6fcf73;
  font-weight: 700;
}

.nest-pas dd {
  color: #9d9da3;
  text-decoration: line-through;
  text-decoration-color: rgba(229, 9, 20, 0.7);
  text-decoration-thickness: 2px;
}

.suivi {
  padding-bottom: 120px;
}

.suivi h2 {
  text-align: center;
  max-width: 16em;
  margin: 0 auto 18px;
}

.centre {
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.suivi .intro {
  margin-bottom: 40px;
}

.suivi .mention {
  margin-top: 40px;
}

.suivi .petit {
  margin-top: 18px;
}

.petit {
  font-size: 0.88rem;
  color: #8e8e93 !important;
}

.lien {
  color: #ff5a62;
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid rgba(255, 90, 98, 0.4);
}

.faq {
  padding-bottom: 60px;
}

.faq h2 {
  text-align: center;
  margin-bottom: 40px;
}

.questions {
  max-width: 760px;
  margin: 0 auto;
}

details {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 18px 4px;
  cursor: pointer;
  list-style: none;
  font-weight: 600;
  color: #f2f2f2;
}

summary::-webkit-details-marker {
  display: none;
}

summary::after {
  content: '+';
  flex-shrink: 0;
  font-size: 1.3rem;
  font-weight: 300;
  color: #e50914;
  transition: transform 0.2s ease;
}

details[open] summary::after {
  transform: rotate(45deg);
}

summary:focus-visible {
  outline: 2px solid #e50914;
  outline-offset: 2px;
  border-radius: 4px;
}

details p {
  margin: 0 0 18px;
  padding: 0 4px;
  color: #b8b8bd;
  line-height: 1.65;
}

details a {
  color: #ff5a62;
}

@media (min-width: 700px) {
  .comparaison {
    grid-template-columns: 1fr 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  summary::after {
    transition: none;
  }
}
</style>
