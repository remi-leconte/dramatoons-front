<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Créer un compte</h2>
      
      <div v-if="successMessage" class="alert-success">
        {{ successMessage }}
      </div>

      <div v-if="errorMessage" class="alert-error">
        {{ errorMessage }}
      </div>
      
      <form @submit.prevent="handleRegister">
        <div class="input-group">
          <label for="username">Nom d'utilisateur</label>
          <input 
            id="username"
            v-model="form.username" 
            type="text" 
            placeholder="Votre pseudo" 
            required
            :disabled="loading"
          >
        </div>

        <div class="input-group">
          <label for="email">Adresse Email</label>
          <input 
            id="email"
            v-model="form.email" 
            type="email" 
            placeholder="votre@email.com" 
            required
            :disabled="loading"
          >
        </div>

        <div class="input-group">
          <label for="password">Mot de passe</label>
          <input 
            id="password"
            v-model="form.password" 
            type="password" 
            placeholder="••••••••" 
            required
            :disabled="loading"
          >
        </div>

        <button type="submit" class="btn-primary full-width" :disabled="loading">
          {{ loading ? 'Création en cours...' : 'S\'inscrire' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>Déjà un compte ? <router-link to="/login">Connectez-vous</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = ref({
  username: '',
  email: '',
  password: ''
})

const handleRegister = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    await api.post('/users', {
      email: form.value.email,
      password: form.value.password,
      login: form.value.username
    })
    
    router.push({ path: '/login', query: { status: 'registered' } })

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
.auth-card h2 {
  margin-bottom: 2rem;
  font-size: 1.8rem;
  font-weight: 800;
}

/* Styles pour les messages de confirmation et d'erreur */
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

.alert-error {
  background-color: rgba(229, 9, 20, 0.1);
  border: 1px solid #e50914;
  color: #e50914;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  text-align: left;
  white-space: pre-line;
}

.input-group {
  margin-bottom: 1.2rem;
  text-align: left;
}

.input-group label {
  display: block;
  font-size: 0.8rem;
  color: #aaa;
  margin-bottom: 5px;
  margin-left: 2px;
}

.input-group input {
  width: 100%;
  padding: 12px 15px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: white;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.2s;
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

.auth-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: #888;
}

.auth-footer a {
  color: #fff;
  text-decoration: none;
  font-weight: bold;
}

.auth-footer a:hover {
  text-decoration: underline;
  color: #e50914;
}
</style>