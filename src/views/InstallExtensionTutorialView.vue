<template>
  <div class="tutorial-container">
    <div class="tutorial-card">
      <h1>Installer l'extension Dramatoons</h1>

      <!-- Section des stores officiels -->
      <section class="store-section">
        <h2>Stores officiels</h2>
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

          <a 
            href="https://microsoftedge.microsoft.com/addons/detail/cjnoabamjhohobpnmmkjfhipfhcjadeb" 
            target="_blank" 
            rel="noopener" 
            class="store-btn edge"
          >
            <span>Obtenir pour <strong>Microsoft Edge</strong></span>
          </a>
        </div>
      </section>

      <hr class="divider" />

      <!-- Section installation manuelle (Chromium / Brave / Chrome) -->
      <section class="manual-section">
        <h2>Installation manuelle (Google Chrome / Brave)</h2>

        <div class="info-note">
          <p>
            <strong>Pourquoi une installation manuelle ?</strong><br />
            La publication d'extensions sur le Chrome Web Store requiert un compte développeur payant. S'agissant d'un projet personnel et gratuit, l'extension est mise à disposition gratuitement en installation manuelle direct via GitHub.
          </p>
        </div>

        <h3>Étape 1 : Télécharger l'extension</h3>
        <ol class="steps-list">
          <li>
            Accédez au dépôt 
            <a href="https://github.com/remi-leconte/dramatoons-extension-chromium" target="_blank" rel="noopener">GitHub</a> 
            ou téléchargez directement l'archive 
            <a href="https://github.com/remi-leconte/dramatoons-extension-chromium/archive/refs/heads/main.zip" target="_blank" rel="noopener">.zip</a>.
          </li>
          <li>
            Une fois le fichier téléchargé, faites un clic droit dessus et sélectionnez « Extraire tout » pour décompresser le dossier.
          </li>
        </ol>

        <h3>Étape 2 : Activer l'extension dans le navigateur</h3>
        <p>Ouvrez votre navigateur (Chrome ou Brave) puis :</p>
        
        <p>Dans la barre d'adresse, saisissez :</p>
        <ul>
          <li><code>chrome://extensions</code> (sur Chrome)</li>
          <li><code>brave://extensions</code> (sur Brave)</li>
        </ul>

        <ol start="3" class="steps-list">
          <li>En haut à droite de la page, activez le commutateur <strong>« Mode développeur »</strong>.</li>
          <li>En haut à gauche, cliquez sur le bouton <strong>« Charger l'extension non empaquetée »</strong>.</li>
          <li>Sélectionnez le dossier dézippé à l'étape 1.</li>
        </ol>

        <div class="completion-box">
          <p>
            🎉 <strong>Installation terminée !</strong> L'extension est prête. Vous pouvez l'épingler dans votre barre d'outils via l'icône en forme de puzzle.
          </p>
        </div>
      </section>

      <div class="tutorial-back">
        <router-link to="/" class="btn-secondary">Retour à l'accueil</router-link>
      </div>
    </div>
  </div>
</template>

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

.tutorial-card p, .tutorial-card li {
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
  transition: background-color 0.2s ease, transform 0.15s ease;
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

.store-btn.edge {
  background-color: #005a9e;
}
.store-btn.edge:hover {
  background-color: #004578;
}

.divider {
  border: 0;
  height: 1px;
  background: #282828;
  margin: 2rem 0;
}

/* Listes et Étapes */
.steps-list, .manual-section ul {
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