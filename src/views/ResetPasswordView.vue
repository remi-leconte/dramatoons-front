<template>
  <div class="auth-container">
    <div class="auth-card profile-card">
      <h2>Réinitialisation du mot de passe</h2>

      <div v-if="successMessage" class="alert-success">
        {{ successMessage }}
      </div>

      <div v-if="errorMessage" class="error-alert">
        {{ errorMessage }}
      </div>
      
      <div v-if="!token" class="error-alert">
        Le jeton de réinitialisation est manquant. Veuillez réitérer votre demande.
      </div>

      <form v-else @submit.prevent="handleResetPassword">
        <div class="input-group">
          <label for="password">Nouveau mot de passe</label>
          <input 
            id="password"
            v-model="newPassword" 
            type="password" 
            required
            placeholder="••••••••"
            :disabled="loading"
          >
        </div>

        <div class="input-group">
          <label for="confirmPassword">Confirmez le mot de passe</label>
          <input 
            id="confirmPassword"
            v-model="confirmPassword" 
            type="password" 
            required
            placeholder="••••••••"
            :disabled="loading"
          >
        </div>

        <button type="submit" class="btn-primary full-width" :disabled="loading">
          {{ loading ? 'Modification...' : 'Modifier le mot de passe' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'

const route = useRoute()
const router = useRouter()

const token = route.query.token

const newPassword = ref('')
const confirmPassword = ref('')

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleResetPassword = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = "Les mots de passe ne correspondent pas."
    return
  }

  if (newPassword.value.length < 6) {
    errorMessage.value = "Le mot de passe doit contenir au moins 6 caractères."
    return
  }

  loading.value = true

  try {
    await api.post('/users/reset-password', {
      token: token,
      password: newPassword.value
    })

    router.push({ path: '/login', query: { status: 'resetPassword' } })
  } catch (error) {
    if (error.response) {
      errorMessage.value = "Une erreur est survenue."
    } else {
      errorMessage.value = "Impossible de joindre le serveur."
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.profile-card h2 {
  margin-bottom: 2rem;
  font-size: 1.8rem;
}

.input-group {
  margin-bottom: 1.5rem;
  text-align: left;
}

.input-group label {
  font-size: 0.8rem;
  color: #aaa;
  display: block;
  margin-bottom: 8px;
}

.input-group input {
  width: 100%;
  padding: 12px 15px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: white;
  box-sizing: border-box;
}

.input-group input:focus {
  outline: none;
  border-color: #e50914;
}

.full-width {
  width: 100%;
  margin-top: 1rem;
  padding: 12px;
}

.alert-success {
  background-color: rgba(76, 209, 55, 0.1);
  border: 1px solid #4cd137;
  color: #4cd137;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  text-align: left;
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