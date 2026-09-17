<template>
  <div class="privacy-container">
    <div class="privacy-card">
      <h1>Politique de Confidentialité</h1>
      <p class="last-updated">Dernière mise à jour : 17 septembre 2026</p>

      <p>
        <strong>Dramatoons</strong> (<a href="https://dramatoons.ovh" target="_blank" rel="noopener">https://dramatoons.ovh</a>) est un projet personnel de suivi et de gestion de webtoons.
      </p>

      <h2>1. Données collectées</h2>
      <p>Nous collectons uniquement les informations nécessaires au fonctionnement du service :</p>
      <ul>
        <li><strong>Informations de compte :</strong> Identifiants de connexion (adresse e-mail, nom d'utilisateur) lors de l'inscription.</li>
        <li><strong>Données d'utilisation :</strong> Progression de lecture (statut de lecture, chapitres sauvegardés, notes personnelles et préférences d'affichage).</li>
      </ul>

      <h2>2. Utilisation des données</h2>
      <p>Les données collectées sont strictement utilisées pour :</p>
      <ul>
        <li>Permettre la création et la gestion de votre compte utilisateur.</li>
        <li>Synchroniser vos préférences de tri, vos notes et votre avancement de lecture sur la plateforme et via l'extension navigateur.</li>
      </ul>

      <h2>3. Partage des données</h2>
      <p>
        Aucune donnée personnelle n'est vendue, louée ou transmise à des tiers à des fins commerciales ou publicitaires.
      </p>

      <h2>4. Extension Navigateur (Chrome / Edge)</h2>
      <p>
        L'extension navigateur Dramatoons n'interagit qu'avec l'API officielle de <code>dramatoons.ovh</code> pour lire et mettre à jour votre progression de lecture. Elle ne collecte ni ne transmet aucun historique de navigation ou donnée personnelle issue d'autres sites web.
      </p>

      <h2>5. Vos droits et contact</h2>
      <p>
        Conformément à la réglementation sur la protection des données (RGPD), vous disposez d'un droit d'accès, de modification et de suppression de vos données. Pour toute demande, vous pouvez contacter l'administrateur du site à l'adresse suivante : <strong>dramatoons@mailo.com</strong>.
      </p>

      <div class="privacy-back">
        <router-link to="/" class="btn-secondary">Retour à l'accueil</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.privacy-container {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  min-height: 80vh;
}

.privacy-card {
  background: #1a1a1a;
  padding: 40px;
  border-radius: 8px;
  max-width: 800px;
  width: 100%;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
  line-height: 1.6;
}

.privacy-card h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #ffffff;
}

.last-updated {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 2rem;
}

.privacy-card h2 {
  font-size: 1.25rem;
  margin-top: 1.8rem;
  margin-bottom: 0.8rem;
  color: #e50914;
}

.privacy-card p, .privacy-card li {
  color: #ccc;
  font-size: 0.95rem;
}

.privacy-card ul {
  padding-left: 20px;
  margin-bottom: 1rem;
}

.privacy-card code {
  background: #252525;
  padding: 2px 6px;
  border-radius: 4px;
  color: #e50914;
}

.privacy-card a {
  color: #e50914;
  text-decoration: none;
}

.privacy-card a:hover {
  text-decoration: underline;
}

.privacy-back {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #333;
}
</style>