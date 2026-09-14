<template>
  <div class="app-container">
    <header class="navbar">
      <router-link to="/" class="logo">
        <span class="logo-text">DRAMA<span class="highlight">TOONS</span></span>
        <span class="logo-badge">.OVH</span>
      </router-link>

      <!-- Formulaire de recherche -->
      <form v-if="authStore.isAuthenticated" class="search-form" @submit.prevent="handleSearch">
        <input 
          v-model="searchTitle" 
          type="text" 
          placeholder="Rechercher un titre..." 
          class="search-input"
        />

        <button type="submit" class="search-btn" aria-label="Rechercher">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>

        <button 
          v-if="searchTitle" 
          type="button" 
          class="clear-btn" 
          aria-label="Effacer la recherche"
          @click="clearSearch"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </form>
      
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
import { ref, watch } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const searchTitle = ref(route.query.title || '')

// Synchronise le champ si la query URL change
watch(() => route.query.title, (newTitle) => {
  searchTitle.value = newTitle || ''
})

const handleSearch = () => {
  router.push({
    path: '/',
    query: { ...route.query, title: searchTitle.value || undefined }
  })
}

// Réinitialise le titre et relance la recherche
const clearSearch = () => {
  searchTitle.value = ''
  handleSearch()
}

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

/* Barre de recherche */
.search-form {
  display: flex;
  align-items: center;
  background: #252525;
  border: 1px solid #383838;
  border-radius: 4px;
  overflow: hidden;
  margin: 0 15px;
  flex: 0 1 300px;
}

.search-input {
  background: transparent;
  border: none;
  padding: 8px 12px;
  color: #fff;
  font-size: 0.9rem;
  width: 100%;
}

.search-input:focus {
  outline: none;
}

.clear-btn,
.search-btn {
  background: transparent;
  border: none;
  color: #aaa;
  padding: 8px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.clear-btn:hover,
.search-btn:hover {
  color: #e50914;
}

.search-btn {
  padding-right: 12px;
}

/* Responsive Mobile */
@media (max-width: 750px) {
  .navbar {
    padding: 0.8rem 3%;
    flex-wrap: wrap;
    gap: 12px 0;
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

  .search-form {
    order: 3;
    flex: 1 1 100%;
    margin: 4px 0 0 0;
  }
}
</style>