<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Connexion</h2>

      <div v-if="infoMessage" class="alert-success">
        {{ infoMessage }}
      </div>

      <div v-if="errorMessage" class="error-alert">
        {{ errorMessage }}
      </div>
      
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label for="identifier">Nom d'utilisateur</label>
          <input 
            id="identifier"
            v-model="form.identifier" 
            type="text" 
            placeholder="login" 
            required
          >
        </div>

        <div class="input-group">
          <div class="label-wrapper">
            <label for="password">Mot de passe</label>
            <router-link to="/forgot-password" class="forgot-link">Mot de passe oublié ?</router-link>
          </div>
          <input 
            id="password"
            v-model="form.password" 
            type="password" 
            placeholder="••••••••" 
            required
          >
        </div>

        <button type="submit" class="btn-primary full-width" :disabled="loading">
          {{ loading ? 'Connexion en cours...' : 'Se connecter' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>Nouveau sur Dramatoons ? <router-link to="/register">Créer un compte</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth' // Store Pinia
import axios from 'axios' // Axios pour l'appel HTTP

const router = useRouter()
const route = useRoute() // Activation de l'accès aux paramètres de l'URL
const authStore = useAuthStore() // Activation de ton store Pinia

const loading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

const form = ref({
  identifier: '',
  password: ''
})

watch(
  () => route?.query?.status,
  (newStatus) => {
    if (newStatus === 'registered') {
      infoMessage.value = "Votre compte a bien été créé ! Un e-mail de vérification vous a été envoyé. Vous pouvez vous connecter."
    } else if (newStatus === 'verified') {
      infoMessage.value = "Votre adresse e-mail a été validée avec succès ! Vous pouvez maintenant vous connecter."
    } else if (newStatus === 'modifiedLogin') {
      infoMessage.value = "Votre nom d'utilisateur a changé. Veuillez vous reconnecter."
    } else if (newStatus === 'resetPassword') {
      infoMessage.value = "Votre mot de passe a été modifié avec succès."
    }
  },
  { immediate: true }
)

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    // Appel API avec Axios
    const response = await axios.post('http://dramatoons.api.local:8081/login', {
      login: form.value.identifier,
      password: form.value.password
    })

    // Récupération du token (Axios met la réponse directement dans .data)
    const { token, refresh_token, user } = response.data

    // Stockage du token dans Pinia
    authStore.setUserSession(token, refresh_token, user.id, user.login, user.roles)

    // Redirection vers l'accueil
    router.push('/')
    
  } catch (error) {
    // Gestion des erreurs avec Axios
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage.value = "Identifiants incorrects. Veuillez réessayer."
      } else {
        errorMessage.value = "Une erreur serveur est survenue."
      }
    } else if (error.request) {
      // La requête a été envoyée mais pas de réponse (ex: serveur éteint)
      errorMessage.value = "Impossible de joindre le serveur."
    } else {
      // Erreur de configuration de la requête
      errorMessage.value = error.message
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
}

.input-group {
  margin-bottom: 1.5rem;
  text-align: left;
}

.label-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.input-group label {
  font-size: 0.8rem;
  color: #aaa;
}

.forgot-link {
  font-size: 0.75rem;
  color: #e50914;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
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

.auth-footer {
  margin-top: 2rem;
  text-align: center;
  color: #888;
  font-size: 0.9rem;
}

.auth-footer a {
  color: #fff;
  text-decoration: none;
  font-weight: bold;
}

.auth-footer a:hover {
  color: #e50914;
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
</style>