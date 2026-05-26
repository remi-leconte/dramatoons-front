<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Créer un compte</h2>
      
      <form @submit.prevent="handleRegister">
        <div class="input-group">
          <label for="username">Nom d'utilisateur</label>
          <input 
            id="username"
            v-model="form.username" 
            type="text" 
            placeholder="Votre pseudo" 
            required
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

const router = useRouter()
const loading = ref(false)

const form = ref({
  username: '',
  email: '',
  password: ''
})

const handleRegister = async () => {
  loading.value = true
  
  try {
    // Plus tard, ici on fera l'appel API vers Symfony :
    // const response = await fetch('http://dramatoons.api.local:8081/api/users', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/ld+json' },
    //   body: JSON.stringify(form.value)
    // })

    console.log("Données envoyées :", form.value)
    
    // Simulation d'attente
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Redirection vers la connexion après succès
    router.push('/connexion')
    
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error)
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