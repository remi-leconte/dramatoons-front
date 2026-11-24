<template>
  <div class="tutorial-container">
    <div class="tutorial-card">
      <h1>Installer l'extension Dramatoons</h1>

      <section class="store-section">
        <h2>Store officiel</h2>
        <p class="section-intro">
          Pour une installation en un clic avec mises à jour automatiques :
        </p>
        <div class="store-buttons">
          <a
            href="https://addons.mozilla.org/fr/firefox/addon/dramatoons-highlighter/"
            target="_blank"
            rel="noopener"
            class="store-btn firefox"
          >
            <span>Obtenir pour <strong>Firefox</strong></span>
          </a>
        </div>
      </section>

      <hr class="divider" />

      <section class="manual-section">
        <h2>Installation manuelle (Chrome et les autres navigateurs basés sur Chromium)</h2>

        <div class="info-note">
          <p>
            <strong>Pourquoi une installation manuelle ?</strong><br />
            La publication d'extensions sur le Chrome Web Store requiert un compte développeur
            payant. S'agissant d'un projet personnel et gratuit, l'extension est mise à disposition
            gratuitement en installation manuelle directe via GitHub. Elle fonctionne sur Google
            Chrome et les autres navigateurs basés sur Chromium.
          </p>
        </div>

        <h3>Étape 1 : Télécharger l'extension</h3>
        <ol class="steps-list">
          <li>
            Ouvrez la
            <a :href="DERNIERE_RELEASE" target="_blank" rel="noopener" data-test="telechargement"
              >dernière version de l'extension</a
            >
            sur GitHub, puis téléchargez le fichier
            <code>dramatoons-highlighter-X.Y.Z.zip</code> de la section « Assets ».
          </li>
          <li>
            Décompressez-le dans un dossier à lui (clic droit, « Extraire tout ») et gardez ce
            dossier : le navigateur charge l'extension depuis celui-ci, elle disparaît s'il est
            supprimé.
          </li>
        </ol>

        <h3>Étape 2 : Activer l'extension dans le navigateur</h3>
        <p>
          Ouvrez votre navigateur puis, dans la barre d'adresse, saisissez
          <code>chrome://extensions</code>, ou ouvrez la page des extensions depuis le menu de votre
          navigateur.
        </p>

        <ol start="3" class="steps-list">
          <li>
            Activez le commutateur <strong>« Mode développeur »</strong> de cette page (en haut à
            droite sur Chrome).
          </li>
          <li>
            Cliquez sur le bouton <strong>« Charger l'extension non empaquetée »</strong> (en haut à
            gauche sur Chrome).
          </li>
          <li>Sélectionnez le dossier décompressé à l'étape 1.</li>
        </ol>

        <div class="completion-box">
          <p>
            🎉 <strong>Installation terminée !</strong> L'extension est prête. Vous pouvez
            l'épingler dans votre barre d'outils via l'icône en forme de puzzle.
          </p>
        </div>

        <h3>Mettre à jour l'extension</h3>
        <p>
          Installée manuellement, l'extension ne se met pas à jour seule. Pour passer à une nouvelle
          version :
        </p>
        <ol class="steps-list">
          <li>téléchargez le nouveau fichier <code>.zip</code> depuis la même page ;</li>
          <li>remplacez le contenu du dossier de l'extension par celui du nouveau fichier ;</li>
          <li>
            sur la page des extensions, cliquez sur <strong>« Recharger »</strong> (↻) sous
            Dramatoons Highlighter.
          </li>
        </ol>
        <p>Le dossier restant le même, vous restez connecté.</p>
      </section>

      <div class="tutorial-back">
        <router-link to="/" class="btn-secondary">Retour à l'accueil</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const DERNIERE_RELEASE =
  'https://github.com/remi-leconte/dramatoons-browser-extension/releases/latest'
</script>

<style scoped>
.tutorial-container {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  min-height: 80vh;
}

.tutorial-card {
  background: #1a1a1a;
  padding: 40px;
  border-radius: 8px;
  max-width: 800px;
  width: 100%;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
  line-height: 1.6;
}

/* Titres plus doux */
.tutorial-card h1 {
  font-size: 1.8rem;
  margin-bottom: 2rem;
  color: #ffffff;
  border-bottom: 1px solid #282828;
  padding-bottom: 1rem;
}

.tutorial-card h2 {
  font-size: 1.25rem;
  margin-top: 1rem;
  margin-bottom: 0.8rem;
  color: #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tutorial-card h2::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 1.1rem;
  background-color: #e50914;
  border-radius: 2px;
}

.tutorial-card h3 {
  font-size: 1.05rem;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: #dddddd;
}

.section-intro {
  color: #aaa;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.tutorial-card p,
.tutorial-card li {
  color: #ccc;
  font-size: 0.95rem;
}

/* Note d'explication Chrome payant */
.info-note {
  background: #222222;
  border-left: 3px solid #666666;
  padding: 12px 16px;
  border-radius: 0 4px 4px 0;
  margin: 1rem 0 1.5rem 0;
}

.info-note p {
  margin: 0;
  font-size: 0.88rem;
  color: #bbb;
}

.info-note strong {
  color: #eee;
}

/* Boutons Stores adoucis */
.store-section {
  margin-bottom: 1.5rem;
}

.store-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  margin-top: 1rem;
}

/* Boutons Stores */
.store-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border-radius: 6px;
  color: #ffffff !important;
  text-decoration: none;
  font-size: 0.9rem;
  transition:
    background-color 0.2s ease,
    transform 0.15s ease;
  flex: 1 1 200px;
  text-align: center;
}

.store-btn span,
.store-btn strong {
  color: #ffffff;
}

.store-btn:hover {
  transform: translateY(-1px);
}

.store-btn.firefox {
  background-color: #d9531e;
}
.store-btn.firefox:hover {
  background-color: #bf4514;
}

.divider {
  border: 0;
  height: 1px;
  background: #282828;
  margin: 2rem 0;
}

/* Listes et Étapes */
.steps-list,
.manual-section ul {
  padding-left: 20px;
  margin-bottom: 1rem;
}

.tutorial-card li {
  margin-bottom: 0.5rem;
}

.tutorial-card code {
  background: #252525;
  padding: 2px 8px;
  border-radius: 4px;
  color: #ddd;
  border: 1px solid #333;
  font-family: monospace;
}

.tutorial-card a {
  color: #e50914;
  text-decoration: none;
  font-weight: 500;
}

.tutorial-card a:hover {
  text-decoration: underline;
}

.completion-box {
  margin-top: 2rem;
  padding: 15px 20px;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid #333;
  border-radius: 6px;
}

.completion-box p {
  margin: 0;
  color: #eee;
}

.tutorial-back {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #282828;
}

@media (max-width: 600px) {
  .store-buttons {
    flex-direction: column;
  }
}
</style>
