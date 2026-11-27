<template>
  <div class="legal-container">
    <div class="legal-card">
      <h1>Mentions légales</h1>
      <p class="last-updated">Dernière mise à jour : 27 novembre 2026</p>

      <h2>1. Éditeur du site</h2>
      <p>
        <strong>Dramatoons</strong> (<a href="https://dramatoons.ovh">https://dramatoons.ovh</a>)
        est un site édité à titre non professionnel par un particulier. Conformément à l'article 1-1
        de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, l'éditeur
        préserve son anonymat : son identité a été communiquée à l'hébergeur.
      </p>
      <p>
        Contact :
        <a :href="`mailto:${CONTACT}`">{{ CONTACT }}</a>
      </p>

      <h2>2. Hébergement</h2>
      <p>
        Le site est hébergé par <strong>OVH SAS</strong>, 2 rue Kellermann, 59100 Roubaix, France
        (<a href="https://www.ovhcloud.com/fr/" target="_blank" rel="noopener">www.ovhcloud.com</a
        >).
      </p>

      <h2>3. Contenus et droits d'auteur</h2>
      <p>
        Dramatoons est un outil de suivi de lecture. Il n'héberge aucune œuvre : ni chapitre, ni
        lien vers des chapitres. Les titres et les couvertures des webtoons, ajoutés par les
        lecteurs pour les identifier, restent la propriété de leurs ayants droit.
      </p>

      <section id="retrait">
        <h2>4. Demandes de retrait</h2>
        <p>
          Vous êtes ayant droit d'un webtoon référencé ? Sa couverture est retirée sur simple
          demande justifiée : écrivez à <a :href="`mailto:${CONTACT}`">{{ CONTACT }}</a> en
          indiquant :
        </p>
        <ul>
          <li>le titre du webtoon concerné ;</li>
          <li>votre qualité (auteur, éditeur, représentant…) et de quoi la justifier.</li>
        </ul>
        <p>
          Le titre d'une œuvre n'est cité que pour la désigner. Toute autre demande, par exemple un
          titre ou un contenu trompeur, est examinée au cas par cas. La même adresse permet de
          signaler tout contenu illicite.
        </p>
      </section>

      <h2>5. Données personnelles</h2>
      <p>
        Les données collectées et vos droits sont décrits dans la
        <router-link to="/privacy">politique de confidentialité</router-link>.
      </p>

      <div class="legal-back">
        <router-link to="/" class="btn-secondary">Retour à l'accueil</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const CONTACT = 'dramatoons@mailo.com'
</script>

<style scoped>
.legal-container {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  min-height: 80vh;
}

.legal-card {
  background: #1a1a1a;
  padding: 40px;
  border-radius: 8px;
  max-width: 800px;
  width: 100%;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
  line-height: 1.6;
}

.legal-card h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #ffffff;
}

.last-updated {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 2rem;
}

.legal-card h2 {
  font-size: 1.25rem;
  margin-top: 1.8rem;
  margin-bottom: 0.8rem;
  color: #e50914;
}

.legal-card p,
.legal-card li {
  color: #ccc;
  font-size: 0.95rem;
}

.legal-card ul {
  padding-left: 20px;
  margin-bottom: 1rem;
}

.legal-card a {
  color: #e50914;
  text-decoration: none;
}

.legal-card a:hover {
  text-decoration: underline;
}

.legal-back {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #333;
}
</style>
