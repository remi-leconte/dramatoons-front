<script setup>
import { ref } from 'vue'

const isLoggedIn = ref(false)

const logout = () => {
  isLoggedIn.value = false
  // Ici, il faudra aussi supprimer le token du localStorage
}
</script>

<template>
  <div class="app-container">
    <header class="navbar">
      <router-link to="/" class="logo">DRAMATOONS<span>.OVH</span></router-link>
      
      <div class="nav-actions">
        <!-- Connecté -->
        <template v-if="isLoggedIn">
          <router-link to="/profile" class="btn-secondary" @click="goToProfile">Mon Profil</router-link>
          <button class="btn-primary" @click="logout">Déconnexion</button>
        </template>

        <!-- Non connecté -->
        <template v-else>
          <router-link to="/register" class="btn-secondary" @click="goToRegister">Créer un compte</router-link>
          <router-link to="/login" class="btn-primary" @click="goToLogin">Connexion</router-link>
        </template>
      </div>
    </header>

    <router-view />
  </div>
</template>

<style>
body {
  margin: 0;
  background-color: #0f0f0f;
  font-family: 'Inter', sans-serif;
  color: #ffffff;
}

.app-container {
  min-height: 100vh;
}

/* header */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 5%;
  background: #1a1a1a;
  border-bottom: 2px solid #e50914;
}

.nav-actions {
  display: flex;
  gap: 15px;
}

.logo {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -1px;
}

.logo span { color: #e50914; }

/* boutons */
.btn-primary, .btn-secondary {
  padding: 8px 18px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #e50914;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #b20710;
}

.btn-secondary {
  background-color: transparent;
  color: white;
  border: 1px solid #444;
}

.btn-secondary:hover {
  border-color: #e50914;
  color: #e50914;
}
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}

.auth-card {
  background: #1a1a1a;
  padding: 40px;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
}

/* form auth */
.auth-card h2 { margin-bottom: 25px; font-size: 1.8rem; }

.input-group { margin-bottom: 15px; }

.auth-card input {
  width: 100%;
  padding: 12px;
  background: #333;
  border: 1px solid transparent;
  border-radius: 4px;
  color: white;
  box-sizing: border-box;
}

.auth-card input:focus {
  outline: none;
  border-color: #e50914;
}

.full-width { width: 100%; margin-top: 10px; }

.auth-options { margin-top: 15px; text-align: center; }

.forgot-link, .auth-footer a {
  color: #aaa;
  font-size: 0.85rem;
  text-decoration: none;
}

.forgot-link:hover, .auth-footer a:hover { color: #e50914; }

.auth-footer { margin-top: 20px; text-align: center; color: #666; }

</style>