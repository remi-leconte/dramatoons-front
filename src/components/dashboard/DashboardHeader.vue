// Gère l'en-tête de la page avec la gestion des onglets ("Bibliothèque" / "Catalogue") et les actions principales (Créer un webtoon, liens Admin)
<script setup lang="ts">
defineProps<{
  activeTab: 'bibliotheque' | 'catalogue'
  isAdmin: boolean
}>()

const emit = defineEmits<{
  (e: 'selectTab', tab: 'bibliotheque' | 'catalogue'): void
  (e: 'openCreateModal'): void
}>()
</script>

<template>
  <div class="dashboard-header">
    <div class="tabs-container">
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'bibliotheque' }" 
        title="Affiche les webtoons pour lesquels vous avez enregistré soit un état, une note et/ou une page."
        @click="emit('selectTab', 'bibliotheque')"
      >
        Bibliothèque
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'catalogue' }" 
        title="Affiche tous les webtoons du site."
        @click="emit('selectTab', 'catalogue')"
      >
        Catalogue
      </button>
    </div>

    <div class="header-actions">
      <button class="btn-create" @click="emit('openCreateModal')">
        <span>+</span> Créer un Webtoon
      </button>
      
      <div v-if="isAdmin" class="admin-dropdown">
        <router-link to="/admin/users" class="admin-pill" title="Gestion des utilisateurs">Users</router-link>
        <router-link to="/admin/webtoons" class="admin-pill" title="Gestion des webtoons">Webtoons</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 1.5rem;
}

.tabs-container {
  display: inline-flex;
  background: #1a1a1a;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid #282828;
}

.tab-button {
  background: transparent;
  border: none;
  color: #888;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.tab-button:hover {
  color: #fff;
}

.tab-button.active {
  background-color: #282828;
  color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-create {
  background-color: #e50914;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 0.88rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s ease;
}

.btn-create:hover {
  background-color: #b20710;
}

.admin-dropdown {
  display: flex;
  gap: 6px;
  background: #1a1a1a;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #282828;
}

.admin-pill {
  color: #888;
  text-decoration: none;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.2s ease;
}

.admin-pill:hover {
  color: #e50914;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
  }

  .tabs-container {
    width: 100%;
    justify-content: center;
  }

  .header-actions {
    justify-content: space-between;
  }
}
</style>