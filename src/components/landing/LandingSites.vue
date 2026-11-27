<script setup lang="ts">
import { computed } from 'vue'
import { isEmptyProgress, type ProgressState } from '@/types/progress'
import libraire from '@/assets/landing/couverture-libraire.svg'
import { COUVERTURES, utiliserWebtoonsDemo } from './demo'

// Teintes du surlignage de l'extension (contenu.js), une par état
const TEINTES: Record<string, string> = {
  reading: 'rgba(33, 150, 243, 0.9)',
  pause: 'rgba(255, 152, 0, 0.9)',
  break: 'rgba(229, 9, 20, 0.9)',
  completed: 'rgba(76, 175, 80, 0.9)',
  aucun: 'rgba(85, 85, 85, 0.9)',
}

const LIBELLES: Record<string, string> = {
  reading: 'en cours',
  pause: 'en pause',
  break: 'pas intéressé',
  completed: 'terminé',
  aucun: 'sans état',
}

// Des extraits de sites quelconques où passent les titres : recommandations, forum, blog, réseau social…
const EXTRAITS = [
  {
    id: 1,
    source: 'Le Coin des lecteurs · Recommandations',
    texte: 'Un sabreur, neuf lunes et une vengeance qui prend son temps.',
  },
  {
    id: 2,
    source: 'Forum Romance · Vos coups de cœur',
    texte: 'Un bal masqué, une duchesse et des secrets qui brûlent.',
  },
  {
    id: 3,
    source: 'Blog · Top 10 des chasseurs',
    texte: "Une porte s'ouvre au milieu de la ville. Personne n'en revient.",
  },
  {
    id: 4,
    source: 'Lettre d’information · Séries terminées',
    texte: "Quatre élèves, le toit d'un lycée et des soirées qui comptent.",
  },
  {
    id: 5,
    source: 'Réseau social · #feelgood',
    texte: "Un café qui n'ouvre que les nuits de comète.",
  },
  {
    id: 0,
    titre: "L'Ombre du libraire",
    source: 'Agenda · Nouveautés du mois',
    texte: 'Un libraire qui range aussi les souvenirs des autres.',
  },
]

const webtoons = utiliserWebtoonsDemo()

// Comme l'extension : seul un webtoon suivi (suivi non vide) est surligné, de la couleur de son état
const extraits = computed(() =>
  EXTRAITS.map((extrait) => {
    const webtoon = webtoons.value.find((w) => w.id === extrait.id)
    const suivi = webtoon?.userProgress
    const surligne = !!suivi && !isEmptyProgress(suivi)
    const etat: ProgressState | 'aucun' = suivi?.state || 'aucun'
    const infos = [
      typeof suivi?.rate === 'number' ? `⭐ ${suivi.rate}` : '',
      suivi?.bookmark ? `📌 ${suivi.bookmark}` : '',
    ]
      .filter(Boolean)
      .join(' ')
    return {
      ...extrait,
      titre: webtoon?.title.title ?? extrait.titre ?? '',
      couverture: COUVERTURES[extrait.id] ?? libraire,
      surligne,
      teinte: TEINTES[etat],
      etat: LIBELLES[etat],
      infos,
      note: suivi?.rate,
      chapitre: suivi?.bookmark,
    }
  }),
)
</script>

<template>
  <div class="sites">
    <ul class="legende" aria-label="Couleurs du surlignage">
      <li v-for="(teinte, etat) in TEINTES" :key="etat">
        <span class="pastille-couleur" :style="{ background: teinte }"></span>{{ LIBELLES[etat] }}
      </li>
      <li><span class="pastille-couleur non-suivi"></span>non suivi</li>
    </ul>

    <ul class="extraits">
      <li
        v-for="(extrait, index) in extraits"
        :key="extrait.titre"
        class="extrait"
        :class="index % 2 === 0 ? 'gauche' : 'droite'"
        :data-fil="index % 2 === 0 ? 'd' : 'g'"
      >
        <p class="source">{{ extrait.source }}</p>
        <div class="corps">
          <img :src="extrait.couverture" alt="" class="couverture" />
          <div>
            <p class="titre">
              <template v-if="extrait.surligne">
                <span class="surligne" :style="{ background: extrait.teinte }">{{
                  extrait.titre
                }}</span>
                <span v-if="extrait.infos" class="pastille" aria-hidden="true">{{
                  extrait.infos
                }}</span>
                <span class="sr-only"
                  >(dans votre bibliothèque : {{ extrait.etat
                  }}<template v-if="typeof extrait.note === 'number'"
                    >, noté {{ extrait.note }}</template
                  ><template v-if="extrait.chapitre"
                    >, dernier chapitre lu {{ extrait.chapitre }}</template
                  >)</span
                >
              </template>
              <template v-else>{{ extrait.titre }}</template>
            </p>
            <p class="texte">{{ extrait.texte }}</p>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.legende {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 18px;
  margin: 0 0 48px;
  padding: 0;
  list-style: none;
  font-size: 0.82rem;
  color: #b8b8bd;
}

.legende li {
  display: flex;
  align-items: center;
  gap: 7px;
}

.pastille-couleur {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.non-suivi {
  background: transparent;
  box-shadow: inset 0 0 0 1.5px #77777c;
}

.extraits {
  display: flex;
  flex-direction: column;
  gap: 28px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Un extrait de page tierce : clair, comme la plupart des sites */
.extrait {
  max-width: 440px;
  padding: 14px 16px 16px;
  border-radius: 10px;
  background: #f4f2ee;
  color: #2a2a2a;
  box-shadow: 0 18px 34px -18px rgba(0, 0, 0, 0.9);
}

.source {
  margin: 0 0 10px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7a7570;
}

.corps {
  display: flex;
  gap: 14px;
}

.couverture {
  flex-shrink: 0;
  width: 52px;
  height: 78px;
  border-radius: 4px;
  object-fit: cover;
}

.titre {
  margin: 0 0 6px;
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.7;
}

/* Surlignage et pastille repris de l'extension */
.surligne {
  padding: 1px 4px;
  border-radius: 2px;
  color: #fff;
}

.pastille {
  display: inline-block;
  margin-left: 4px;
  padding: 0 7px;
  border-radius: 30px;
  background: #fff;
  color: #000;
  font-size: 0.8rem;
  font-weight: 400;
  line-height: 1.6;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
}

.texte {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #55504b;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* En quinconce sur grand écran : le ruban passe entre les deux colonnes */
@media (min-width: 760px) {
  .extrait {
    max-width: min(440px, 46%);
  }

  .extrait.droite {
    align-self: flex-end;
  }

  .extrait + .extrait {
    margin-top: -46px;
  }
}
</style>
