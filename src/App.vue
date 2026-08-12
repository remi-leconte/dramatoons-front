<template>
  <div class="app-container">
    <header class="navbar">
      <router-link to="/" class="logo">
        <span class="logo-text">DRAMA<span class="highlight">TOONS</span></span>
        <span class="logo-badge">.OVH</span>
      </router-link>
      
      <div class="nav-actions">
        <template v-if="authStore.isAuthenticated">
          <router-link to="/profile" class="btn-secondary">Mon Profil</router-link>
          <button class="btn-primary" @click="handleLogout">Déconnexion</button>
        </template>

        <template v-else>
          <router-link to="/register" class="btn-secondary">Créer un compte</router-link>
          <router-link to="/login" class="btn-primary">Connexion</router-link>
        </template>
      </div>
    </header>

    <router-view />
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout() 
  router.push('/')
}
</script>

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

/* Header */
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
  align-items: center;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  transition: transform 0.2s ease;
}

.logo:hover {
  transform: translateY(-1px);
}

.logo-text {
  font-size: 1.35rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.5px;
}

.logo-text .highlight {
  color: #e50914;
}

.logo-badge {
  font-size: 0.65rem;
  font-weight: 700;
  background: #252525;
  color: #aaa;
  padding: 3px 6px;
  border-radius: 4px;
  border: 1px solid #383838;
  letter-spacing: 0.5px;
}

/* Boutons */
.btn-primary, .btn-secondary {
  padding: 8px 18px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
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

/* Responsive Mobile */
@media (max-width: 600px) {
  .navbar {
    padding: 0.8rem 3%;
  }

  .logo-text {
    font-size: 1.1rem;
  }

  .logo-badge {
    display: none;
  }

  .nav-actions {
    gap: 8px;
  }

  .btn-primary, .btn-secondary {
    padding: 6px 10px;
    font-size: 0.8rem;
  }
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

/* Form Auth */
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