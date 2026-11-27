export interface QuestionFaq {
  question: string
  reponse: string
  liens?: { texte: string; to?: string; href?: string }[]
}

export const QUESTIONS: QuestionFaq[] = [
  {
    question: 'Puis-je lire des webtoons sur Dramatoons ?',
    reponse:
      'Non. Dramatoons ne contient aucun chapitre, ni aucun lien vers des chapitres. Vous lisez sur les sites de votre choix.',
  },
  {
    question: "Le webtoon que je lis n'est pas sur le site ?",
    reponse:
      'Ajoutez-le vous-même : il apparaît aussitôt dans votre bibliothèque. Un modérateur peut ensuite le publier au catalogue pour tous les lecteurs, en ajustant au besoin son titre ou sa couverture.',
  },
  {
    question: 'Il porte un autre titre sur le site où je le lis ?',
    reponse:
      "Un webtoon peut avoir plusieurs titres : traductions, titres alternatifs. La recherche et l'extension les reconnaissent tous.",
  },
  {
    question: "Sur quels navigateurs fonctionne l'extension ?",
    reponse:
      'Sur Firefox, depuis son store, et sur Chrome et les autres navigateurs basés sur Chromium, en installation manuelle.',
    liens: [{ texte: "Voir comment l'installer", to: '/install-tutorial' }],
  },
  {
    question: 'Est-ce gratuit ?',
    reponse: 'Oui, entièrement, et sans publicité.',
  },
  {
    question: "Vous êtes ayant droit d'un webtoon référencé ?",
    reponse:
      'Sa couverture est retirée sur simple demande justifiée. Écrivez-nous en indiquant le titre concerné et votre qualité (auteur, éditeur…) :',
    liens: [
      { texte: 'dramatoons@mailo.com', href: 'mailto:dramatoons@mailo.com' },
      { texte: 'Détails dans les mentions légales', to: '/mentions-legales#retrait' },
    ],
  },
]
