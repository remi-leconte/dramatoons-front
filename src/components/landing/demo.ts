import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'
import type { Webtoon } from '@/types'
import type { Progress } from '@/types/progress'
import lune from '@/assets/landing/couverture-lune.svg'
import bal from '@/assets/landing/couverture-bal.svg'
import porte from '@/assets/landing/couverture-porte.svg'
import club from '@/assets/landing/couverture-club.svg'
import comete from '@/assets/landing/couverture-comete.svg'

// Webtoons et couvertures inventés : la page d'accueil ne montre aucune œuvre réelle, et n'appelle pas l'API
export const COUVERTURES: Record<number, string> = { 1: lune, 2: bal, 3: porte, 4: club, 5: comete }

const exemple = (
  id: number,
  titre: string,
  suivi: Progress,
  autres: Partial<Webtoon> = {},
): Webtoon => ({
  id,
  title: { title: titre },
  secondaryTitles: [],
  status: 'ongoing',
  publish: true,
  canEdit: false,
  userProgress: { ...suivi },
  ...autres,
})

// Un webtoon par cas de surlignage de l'extension : en cours, en pause, sans état, terminé, pas intéressé
function creerWebtoonsDemo(): Ref<Webtoon[]> {
  return ref([
    exemple(
      1,
      'Le Sabre des neuf lunes',
      { state: 'reading', bookmark: 48, rate: 9 },
      {
        averageRating: 8.6,
        readersCount: 124,
        secondaryTitles: [
          { id: 11, title: 'The Nine Moons Blade' },
          { id: 12, title: 'Neuf lunes' },
        ],
      },
    ),
    exemple(
      2,
      'Le Bal des cendres',
      { state: 'pause', bookmark: 112, rate: 7 },
      { averageRating: 7.9, readersCount: 58 },
    ),
    exemple(
      3,
      'Porte nº 0',
      { state: null, bookmark: 23, rate: 8 },
      { averageRating: 8.2, readersCount: 87 },
    ),
    exemple(
      4,
      'Le Club de minuit',
      { state: 'completed', bookmark: 87, rate: 8 },
      { averageRating: 8.4, readersCount: 203, status: 'completed' },
    ),
    exemple(
      5,
      'Le Café des comètes',
      { state: 'break', bookmark: 31, rate: 5 },
      { averageRating: 9.1, readersCount: 176 },
    ),
  ])
}

const CLE: InjectionKey<Ref<Webtoon[]>> = Symbol('webtoons-demo')

// Une page crée sa bibliothèque d'exemple : ses composants la partagent, et elle disparaît avec la page
export function fournirWebtoonsDemo(): Ref<Webtoon[]> {
  const webtoons = creerWebtoonsDemo()
  provide(CLE, webtoons)
  return webtoons
}

export function utiliserWebtoonsDemo(): Ref<Webtoon[]> {
  return inject(CLE, creerWebtoonsDemo, true)
}
