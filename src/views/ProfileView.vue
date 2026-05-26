<template>
  <div class="auth-container">
    <div class="auth-card profile-page">
      <h2>Mon Profil</h2>
      
      <form @submit.prevent="handleUpdateProfile">
        <div class="input-group">
          <label for="username">Nom d'utilisateur</label>
          <input 
            id="username"
            v-model="user.username" 
            type="text" 
          >
        </div>

        <div class="input-group">
          <label for="email">Adresse Email</label>
          <input 
            id="email"
            v-model="user.email" 
            type="email" 
          >
        </div>

        <hr class="divider">

        <div class="input-group">
          <label for="newPassword">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
          <input 
            id="newPassword"
            v-model="user.newPassword" 
            type="password" 
            placeholder="••••••••"
          >
        </div>

        <div class="button-group">
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Enregistrement...' : 'Enregistrer les modifications' }}
          </button>
        </div>
      </form>

      <div v-if="message" :class="['status-message', messageType]">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const loading = ref(false)
const message = ref('')
const messageType = ref('')

// On simule les données récupérées depuis ton API Symfony
const user = ref({
  username: 'DramatoonFan',
  email: 'fan@example.com',
  newPassword: ''
})

const handleUpdateProfile = async () => {
  loading.value = true
  message.value = ''
  
  try {
    // Appel API simulé (PATCH ou PUT vers /api/users/{id})
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    message.value = "Profil mis à jour avec succès !"
    messageType.value = "success"
    user.value.newPassword = "" // On vide le champ password après succès
  } catch (error) {
    message.value = "Une erreur est survenue lors de la mise à jour."
    messageType.value = "error"
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 500px;
}

.divider {
  border: 0;
  border-top: 1px solid #333;
  margin: 2rem 0;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 8px;
}

.input-group input {
  width: 100%;
  padding: 12px;
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

.button-group {
  margin-top: 2rem;
}

.status-message {
  margin-top: 1.5rem;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9rem;
}

.status-message.success {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
  border: 1px solid #2ecc71;
}

.status-message.error {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid #e74c3c;
}

.btn-primary {
  width: 100%;
  padding: 14px;
}
</style>