<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import type { User } from '@/types/user'

const users = ref<User[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const itemsPerPage = ref(20)

// Filtres
const searchFilters = ref({
  id: '',
  login: '',
  email: '',
  role: ''
})

// Tri
const sortKey = ref<'id' | 'login' | 'email' | 'roles' | 'lastLogin'>('id')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Modale de confirmation
const isModalOpen = ref(false)
const confirmActionType = ref<'reset_password' | 'toggle_status' | null>(null)
const selectedUser = ref<User | null>(null)
const actionLoading = ref(false)

const getDisplayRole = (roles: string[] = []): string => {
  if (roles.includes('ROLE_ADMIN')) return 'Admin'
  if (roles.includes('ROLE_MODO')) return 'Modo'
  return 'User'
}

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(dateString))
}

const fetchUsers = async (page = 1) => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('itemsPerPage', itemsPerPage.value.toString())

    if (searchFilters.value.id) params.append('id', searchFilters.value.id.trim())
    if (searchFilters.value.login) params.append('login', searchFilters.value.login.trim())
    if (searchFilters.value.email) params.append('email', searchFilters.value.email.trim())
    if (searchFilters.value.role) {
      const roleMap: Record<string, string> = {
        admin: 'ROLE_ADMIN',
        modo: 'ROLE_MODO',
        user: 'ROLE_USER'
      }
      const mappedRole = roleMap[searchFilters.value.role]
      if (mappedRole) {
        params.append('roles', mappedRole)
      }
    }

    params.append(`order[${sortKey.value}]`, sortOrder.value)

    const response = await api.get(`/users?${params.toString()}`)
    const data = response.data
    users.value = data['hydra:member'] || data.member || []
    
    const totalItems = data['hydra:totalItems'] || data.totalItems || 0
    totalPages.value = Math.max(1, Math.ceil(totalItems / itemsPerPage.value))
    console.log(totalPages.value)
    currentPage.value = page
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs :', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchUsers(1)
}

const resetFilters = () => {
  searchFilters.value = {
    id: '',
    login: '',
    email: '',
    role: ''
  }
  itemsPerPage.value = 20
  fetchUsers(1)
}

const handleSort = (key: 'id' | 'login' | 'email' | 'roles' | 'lastLogin') => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
  fetchUsers(currentPage.value)
}

const openConfirmModal = (user: User, action: 'reset_password' | 'toggle_status') => {
  selectedUser.value = user
  confirmActionType.value = action
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedUser.value = null
  confirmActionType.value = null
}

const handleConfirmAction = async () => {
  if (!selectedUser.value || !confirmActionType.value) return

  actionLoading.value = true
  try {
    if (confirmActionType.value === 'reset_password') {
      await api.post('/users/forgot-password', {
        email: selectedUser.value.email
      })
      alert(`Un email de réinitialisation de mot de passe a été envoyé à ${selectedUser.value.login}.`)
    } else if (confirmActionType.value === 'toggle_status') {
      const updatedStatus = !selectedUser.value.publish
      await api.patch(`/users/${selectedUser.value.id}`, {
        publish: updatedStatus
      }, {
        headers: { 'Content-Type': 'application/merge-patch+json' }
      })
      selectedUser.value.publish = updatedStatus
    }
  } catch (error) {
    console.error('Erreur lors de l\'action :', error)
    alert('Une erreur est survenue lors du traitement.')
  } finally {
    actionLoading.value = false
    closeModal()
  }
}

onMounted(() => fetchUsers())
</script>

<template>
  <div class="admin-page">
    <h1>Utilisateurs</h1>

    <!-- Formulaire de recherche -->
    <form @submit.prevent="handleSearch" class="search-bar">
      <input v-model="searchFilters.id" type="text" placeholder="ID..." class="search-input input-id" />
      <input v-model="searchFilters.login" type="text" placeholder="Login..." class="search-input" />
      <input v-model="searchFilters.email" type="text" placeholder="Email..." class="search-input" />
      <select v-model="searchFilters.role" class="search-select">
        <option value="">Tous les rôles</option>
        <option value="user">User</option>
        <option value="modo">Modo</option>
        <option value="admin">Admin</option>
      </select>

      <select v-model="itemsPerPage" @change="handleSearch" class="search-select">
        <option :value="10">10 / page</option>
        <option :value="20">20 / page</option>
        <option :value="50">50 / page</option>
        <option :value="100">100 / page</option>
      </select>

      <button type="submit" class="btn btn-primary">Rechercher</button>
      <button type="button" class="btn btn-secondary" @click="resetFilters">Réinitialiser</button>
    </form>

    <div v-if="loading" class="loading">Chargement...</div>

    <table v-else class="admin-table">
      <thead>
        <tr>
          <th class="sortable" @click="handleSort('id')">
            ID <span v-if="sortKey === 'id'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
          </th>
          <th class="sortable" @click="handleSort('login')">
            Login <span v-if="sortKey === 'login'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
          </th>
          <th class="sortable" @click="handleSort('email')">
            Email <span v-if="sortKey === 'email'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
          </th>
          <th class="sortable" @click="handleSort('roles')">
            Rôle <span v-if="sortKey === 'roles'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
          </th>
          <th class="sortable" @click="handleSort('lastLogin')">
            Dernière connexion <span v-if="sortKey === 'lastLogin'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
          </th>
          <th class="action-col">Mot de passe</th>
          <th class="action-col">Statut</th>
          <th class="action-col"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.login }}</td>
          <td>
            <div class="email-cell">
              <span 
                class="status-dot" 
                :class="user.verified ? 'verified' : 'unverified'"
                :title="user.verified ? 'Email vérifié' : 'Email non vérifié'"
              ></span>
              {{ user.email }}
            </div>
          </td>
          <td>{{ getDisplayRole(user.roles) }}</td>
          <td>{{ formatDate(user.lastLogin) }}</td>
          <td class="action-col">
            <button class="action-btn" @click="openConfirmModal(user, 'reset_password')">
              Envoyer mail
            </button>
          </td>
          <td class="action-col">
            <button class="action-btn toggle-btn" @click="openConfirmModal(user, 'toggle_status')">
              <span 
                class="status-dot" 
                :class="user.publish ? 'verified' : 'unverified'"
                :title="user.publish ? 'Publié' : 'Non publié'"
              ></span>
              {{ user.publish ? 'Dépublier' : 'Publier' }}
            </button>
          </td>
          <td class="action-col">
            <router-link :to="`/admin/users/${user.id}`">Détail →</router-link>
          </td>
        </tr>
        <tr v-if="users.length === 0">
          <td colspan="8" class="empty">Aucun utilisateur ne correspond à la recherche.</td>
        </tr>
      </tbody>
    </table>

    <div class="pagination" v-if="totalPages > 1">
      <button :disabled="currentPage <= 1" @click="fetchUsers(currentPage - 1)">Précédent</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button :disabled="currentPage >= totalPages" @click="fetchUsers(currentPage + 1)">Suivant</button>
    </div>

    <!-- Modale de Confirmation -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>Confirmation</h3>
        <div v-if="selectedUser" class="user-info">
          <p>Utilisateur : <strong>{{ selectedUser.login }}</strong></p>
          <p>Email : <strong>{{ selectedUser.email }}</strong></p>
        </div>

        <p v-if="confirmActionType === 'reset_password'">
          Voulez-vous vraiment envoyer le mail de réinitialisation de mot de passe ?
        </p>
        <p v-else-if="confirmActionType === 'toggle_status'">
          Voulez-vous vraiment {{ selectedUser?.publish ? 'dépublier' : 'publier' }} cet utilisateur ?
        </p>

        <div class="modal-actions">
          <button class="btn btn-secondary" :disabled="actionLoading" @click="closeModal">Non</button>
          <button class="btn btn-primary" :disabled="actionLoading" @click="handleConfirmAction">
            {{ actionLoading ? 'Patientez...' : 'Oui' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page { padding: 2rem 5%; color: #fff; }

.search-bar { display: flex; gap: 10px; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center; }
.search-input, .search-select {
  background: #252525;
  border: 1px solid #383838;
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
}
.search-input.input-id { width: 80px; }
.search-input { flex: 1; min-width: 150px; }
.search-select { min-width: 110px; }

.admin-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
.admin-table th, .admin-table td { border-bottom: 1px solid #282828; padding: 10px; text-align: left; }
.admin-table th { color: #888; font-size: 0.85rem; }
.admin-table th.sortable { cursor: pointer; user-select: none; }
.admin-table th.sortable:hover { color: #fff; }

.email-cell { display: flex; align-items: center; gap: 8px; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
.status-dot.verified { background-color: #4cd137; box-shadow: 0 0 6px rgba(76, 209, 55, 0.4); }
.status-dot.unverified { background-color: #e50914; box-shadow: 0 0 6px rgba(229, 9, 20, 0.4); }

.action-col { text-align: right; }
.action-col a { color: #e50914; text-decoration: none; }
.action-btn { background: none; border: none; color: #e50914; cursor: pointer; text-decoration: underline; font-size: 0.9rem; padding: 0; }

.pagination { display: flex; gap: 10px; align-items: center; justify-content: center; margin-top: 1.5rem; }
.pagination button { background: #252525; border: 1px solid #383838; color: #fff; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.loading, .empty { text-align: center; color: #888; margin-top: 1rem; font-style: italic; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: #1a1a1a; padding: 1.5rem 2rem; border-radius: 8px; border: 1px solid #333; max-width: 420px; width: 90%; }
.modal-content h3 { margin-top: 0; color: #fff; }
.user-info { margin: 10px 0; padding: 10px; background: #252525; border-radius: 4px; border-left: 3px solid #e50914; }
.user-info p { margin: 4px 0; color: #ccc; font-size: 0.9rem; }
.modal-content p { color: #ccc; margin: 10px 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 1.5rem; }
.btn { padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: bold; }
.btn-primary { background: #e50914; color: #fff; }
.btn-secondary { background: #333; color: #fff; }
.toggle-btn { display: inline-flex; align-items: center; gap: 8px; }
</style>