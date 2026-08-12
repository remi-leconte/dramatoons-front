<template>
  <div class="auth-container">
    <div class="auth-card text-center">
      <h2>Vérification de votre compte</h2>
      
      <div v-if="loading" class="status-container">
        <p class="loading-text">Validation du jeton en cours, veuillez patienter...</p>
      </div>

      <div v-else-if="successMessage" class="status-container">
        <p class="alert-success">{{ successMessage }}</p>
        <div class="auth-footer">
          <router-link to="/login" class="btn-primary-link">Aller à la page de connexion</router-link>
        </div>
      </div>

      <div v-else-if="errorMessage" class="status-container">
        <p class="alert-error">{{ errorMessage }}</p>
        <div class="auth-footer">
          <p>Le lien a expiré ou est invalide.</p>
          <router-link to="/register">Créer un nouveau compte</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../services/api'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')

onMounted(async () => {
  const token = route.query.token

  if (!token) {
    errorMessage.value = "Le jeton de vérification est manquant."
    loading.value = false
    return
  }

  try {
    await api.post('/users/verify', {
      token: token
    })
    
    router.push({ path: '/login', query: { status: 'verified' } })

  } catch (error) {
    if (error.response) {
      errorMessage.value = "Une erreur est survenue."
    } else {
      errorMessage.value = "Impossible de joindre le serveur."
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.auth-card h2 {
  margin-bottom: 2rem;
  font-size: 1.8rem;
  font-weight: 800;
}

.text-center {
  text-align: center;
}

.status-container {
  margin: 2rem 0;
  font-size: 1.1rem;
}

.loading-text {
  color: #aaa;
}

.alert-success {
  color: #4cd137;
  font-weight: bold;
}

.alert-error {
  color: #e50914;
  font-weight: bold;
}

.btn-primary-link {
  display: inline-block;
  background: #e50914;
  color: white;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  margin-top: 1rem;
}

.btn-primary-link:hover {
  background: #b80710;
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