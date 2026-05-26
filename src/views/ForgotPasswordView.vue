<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Réinitialiser le mot de passe</h2>
      
      <form v-if="!isSent" @submit.prevent="handleResetRequest">
        <p class="auth-description">
          Entrez votre adresse email. Nous vous enverrons un lien pour créer un nouveau mot de passe.
        </p>
        
        <div class="input-group">
          <input 
            v-model="email" 
            type="email" 
            placeholder="votre@email.com" 
            required
          >
        </div>
        
        <button type="submit" class="btn-primary full-width" :disabled="loading">
          {{ loading ? 'Envoi en cours...' : 'Envoyer le lien' }}
        </button>
      </form>

      <!-- Message de succès -->
      <div v-else class="success-message">
        <div class="success-icon">✓</div>
        <p>Si cet email existe dans notre base, un message vient d'être envoyé.</p>
        <router-link to="/login" class="btn-secondary full-width">Retour à la connexion</router-link>
      </div>

      <div class="auth-footer">
        <router-link to="/login">Retour à la connexion</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const loading = ref(false)
const isSent = ref(false)

const handleResetRequest = async () => {
  loading.value = true
  
  try {
    // Ici, tu feras l'appel à ton API Symfony
    // await fetch('http://dramatoons.api.local:8081/api/forgot-password', { ... })
    
    // Simulation d'une attente réseau
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    isSent.value = true
  } catch (error) {
    console.error("Erreur :", error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-description {
  color: #aaaaaa;
  font-size: 0.9rem;
  margin-bottom: 20px;
  line-height: 1.4;
}

.success-message {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  font-size: 3rem;
  color: #44bb44;
  margin-bottom: 15px;
}

.success-message p {
  margin-bottom: 25px;
  color: #ddd;
}
</style>