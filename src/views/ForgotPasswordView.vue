<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Réinitialiser le mot de passe</h2>
      
      <div v-if="errorMessage" class="error-alert">
        {{ errorMessage }}
      </div>
      
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
            :disabled="loading"
          >
        </div>
        
        <button type="submit" class="btn-primary full-width" :disabled="loading">
          {{ loading ? 'Envoi en cours...' : 'Envoyer le lien' }}
        </button>
      </form>

      <div v-else class="success-message">
        <div class="success-icon">✓</div>
        <p>Si cet email existe dans notre base, un message vient d'être envoyé.</p>
        <router-link to="/login" class="btn-secondary full-width">Retour à la connexion</router-link>
      </div>

      <div class="auth-footer" v-if="!isSent">
        <router-link to="/login">Retour à la connexion</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../services/api'

const email = ref('')
const loading = ref(false)
const isSent = ref(false)
const errorMessage = ref('')

const handleResetRequest = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    await api.post('/users/forgot-password', {
      email: email.value
    })
    
    isSent.value = true
  } catch (error) {
    if (error.response) {
      if (error.response.status === 422) {
        errorMessage.value = "Email incorrects. Veuillez réessayer."
      } else {
        errorMessage.value = "Une erreur est survenue."
      }
    } else {
      errorMessage.value = "Impossible de joindre le serveur."
    }
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

.error-alert {
  background-color: rgba(229, 9, 20, 0.1);
  border: 1px solid #e50914;
  color: #e50914;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  text-align: left;
}
</style>