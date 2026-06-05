<template>
  <div class="auth-container">
    <div class="auth-card profile-card">
      <h2>Mon Profil</h2>

      <div v-if="infoMessage" class="alert-success">
        {{ infoMessage }}
      </div>

      <div v-if="errorMessage" class="error-alert">
        {{ errorMessage }}
      </div>
      
      <form @submit.prevent="handleUpdateProfile">
        <div class="input-group">
          <label for="username">Nom d'utilisateur</label>
          <input 
            id="username"
            v-model="form.username" 
            type="text" 
            required
          >
        </div>

        <div class="input-group">
          <label for="email">Adresse Email</label>
          <input 
            id="email"
            v-model="form.email" 
            type="email" 
            required
          >
          
          <div class="email-status">
            <span v-if="form.verified" class="badge verified">
              ✓ Email vérifié
            </span>
            <div v-else class="unverified-container">
              <span class="badge unverified">⚠ Email non vérifié</span>
              <button 
                type="button" 
                class="btn-link" 
                :disabled="sendingVerification"
                @click="handleResendVerification"
              >
                {{ sendingVerification ? 'Envoi...' : "Renvoyer le lien de validation" }}
              </button>
            </div>
          </div>
        </div>

        <hr class="divider">

        <div class="input-group">
          <label for="newPassword">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
          <input 
            id="newPassword"
            v-model="form.newPassword" 
            type="password" 
            placeholder="••••••••" 
          >
        </div>

        <button type="submit" class="btn-primary full-width" :disabled="loading">
          {{ loading ? 'Enregistrement en cours...' : 'Enregistrer les modifications' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

const authStore = useAuthStore()

const router = useRouter()
const loading = ref(false)
const sendingVerification = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

const form = ref({
  id: null,
  username: '',
  email: '',
  verified: false,
  newPassword: ''
})

const getHeaders = (isPatch = false) => {
  return {
    'Accept': 'application/ld+json',
    'Content-Type': isPatch ? 'application/merge-patch+json' : 'application/json',
    'Authorization': `Bearer ${authStore.token}`
  }
}

onMounted(async () => {
  try {
    const response = await api.get(`http://dramatoons.api.local:8081/users/${authStore.userId}`, {
      headers: getHeaders()
    })

    const data = response.data
    form.value.id = data.id
    form.value.username = data.login
    form.value.email = data.email
    form.value.verified = data.verified
  } catch (error) {
    if (error.response) {
      errorMessage.value = "Impossible de charger les informations de votre profil."
    } else {
      errorMessage.value = "Erreur de connexion avec le serveur."
    }
  }
})

// Mise à jour du profil (PATCH)
const handleUpdateProfile = async () => {
  loading.value = true
  errorMessage.value = ''
  infoMessage.value = ''
  
  try {
    const payload = {
      login: form.value.username,
      email: form.value.email
    }

    if (form.value.newPassword) {
      payload.password = form.value.newPassword
    }

    const loginChanged = authStore.login !== form.value.username

    const response = await api.patch(`http://dramatoons.api.local:8081/users/${form.value.id}`, payload, {
      headers: getHeaders(true)
    })
    
    const updatedUser = response.data
    form.value.verified = updatedUser.verified
    form.value.username = updatedUser.login
    form.value.email = updatedUser.email

    if (loginChanged) {
      authStore.logout()
      router.push({ path: '/login', query: { status: 'modifiedLogin' } })
    } else {
      infoMessage.value = "Profil mis à jour avec succès !"
      form.value.newPassword = "" 
    }

  } catch (error) {
    if (error.response) {
      errorMessage.value = error.response.data['hydra:description'] || "Une erreur est survenue lors de la mise à jour."
    } else {
      console.log(error)
      errorMessage.value = "Impossible de joindre le serveur."
    }
  } finally {
    loading.value = false
  }
}

// Demande de renvoi de l'e-mail de validation
const handleResendVerification = async () => {
  sendingVerification.value = true
  errorMessage.value = ''
  infoMessage.value = ''

  try {
    await api.post('http://dramatoons.api.local:8081/users/resend-verification', {
      email: form.value.email
    }, {
      headers: getHeaders()
    })

    infoMessage.value = "Un nouveau lien de validation a été envoyé sur votre adresse email."
  } catch (error) {
    if (error.response) {
      errorMessage.value = "Impossible d'envoyer le lien de validation pour le moment."
    } else {
      errorMessage.value = "Erreur réseau avec le serveur."
    }
  } finally {
    sendingVerification.value = false
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

.divider {
  border: 0;
  border-top: 1px solid #333;
  margin: 2rem 0;
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

.email-status {
  margin-top: 8px;
  font-size: 0.85rem;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.8rem;
}

.badge.verified {
  background: rgba(76, 209, 55, 0.1);
  color: #4cd137;
  border: 1px solid rgba(76, 209, 55, 0.3);
}

.badge.unverified {
  background: rgba(230, 126, 34, 0.15);
  color: #e67e22;
  border: 1px solid rgba(230, 126, 34, 0.3);
}

.unverified-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-link {
  background: none;
  border: none;
  color: #e50914;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: 0.85rem;
  font-family: inherit;
}

.btn-link:hover:not(:disabled) {
  color: #b80710;
}

.btn-link:disabled {
  color: #666;
  text-decoration: none;
  cursor: not-allowed;
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