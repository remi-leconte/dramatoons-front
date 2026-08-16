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
            :disabled="loading || deleting"
          >
        </div>

        <div class="input-group">
          <label for="email">Adresse Email</label>
          <input 
            id="email"
            v-model="form.email" 
            type="email" 
            required
            :disabled="loading || deleting"
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
                :disabled="sendingVerification || loading || deleting"
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
            :disabled="loading || deleting"
          >
        </div>

        <button type="submit" class="btn-primary full-width" :disabled="loading || deleting">
          {{ loading ? 'Enregistrement en cours...' : 'Enregistrer les modifications' }}
        </button>
      </form>

      <hr class="divider">

      <div class="danger-zone">
        <button 
          type="button" 
          class="btn-danger full-width" 
          :disabled="loading || deleting"
          @click="showDeleteModal = true"
        >
          Supprimer mon compte
        </button>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content">
        <h3>Confirmation de suppression</h3>
        <p>Êtes-vous sûr de vouloir supprimer votre compte et toute votre progression de lecture ? Cette action est irréversible.</p>
        
        <div class="modal-actions">
          <button 
            type="button" 
            class="btn-secondary" 
            :disabled="deleting"
            @click="showDeleteModal = false"
          >
            Non, annuler
          </button>
          <button 
            type="button" 
            class="btn-danger" 
            :disabled="deleting"
            @click="handleDeleteAccount"
          >
            {{ deleting ? 'Suppression...' : 'Oui, supprimer' }}
          </button>
        </div>
      </div>
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
const deleting = ref(false)
const showDeleteModal = ref(false)
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

onMounted(async () => {
  try {
    const response = await api.get(`/users/${authStore.userId}`)

    const data = response.data
    form.value.id = data.id
    form.value.username = data.login
    form.value.email = data.email
    form.value.verified = data.verified
  } catch (error) {
    if (error.response) {
      errorMessage.value = "Une erreur est survenue."
    } else {
      errorMessage.value = "Impossible de joindre le serveur."
    }
  }
})

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

    const response = await api.patch(`/users/${form.value.id}`, payload, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
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
      errorMessage.value = "Une erreur est survenue."
    } else {
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
    await api.post('/users/resend-verification', {
      email: form.value.email
    })

    infoMessage.value = "Un nouveau lien de validation a été envoyé sur votre adresse email."
  } catch (error) {
    if (error.response) {
      errorMessage.value = "Une erreur est survenue."
    } else {
      errorMessage.value = "Impossible de joindre le serveur."
    }
  } finally {
    sendingVerification.value = false
  }
}

const handleDeleteAccount = async () => {
  deleting.value = true
  errorMessage.value = ''
  
  try {
    await api.delete(`/users/${form.value.id}`)
    showDeleteModal.value = false
    authStore.logout()
    router.push('/')
  } catch (error) {
    showDeleteModal.value = false
    if (error.response) {
      errorMessage.value = "Erreur lors de la suppression du compte."
    } else {
      errorMessage.value = "Impossible de joindre le serveur."
    }
  } finally {
    deleting.value = false
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

.danger-zone {
  margin-top: 1rem;
}

.btn-danger {
  background-color: #e50914;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  padding: 10px 16px;
}

.btn-danger:hover:not(:disabled) {
  background-color: #b80710;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 600;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #555;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1f1f1f;
  padding: 2rem;
  border-radius: 8px;
  max-width: 450px;
  width: 90%;
  color: white;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  text-align: left;
}

.modal-content h3 {
  margin-top: 0;
  color: #e50914;
  font-size: 1.4rem;
}

.modal-content p {
  margin: 1.5rem 0;
  color: #ccc;
  line-height: 1.4;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>