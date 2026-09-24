<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.ts'
import api from '../../services/api'

import type { Progress } from '@/types/progress';

const route = useRoute()
const router = useRouter()
const userId = route.params.id

const user = ref({ 
  login: '', 
  email: '', 
  roles: [] as string[], 
  lastLogin: null as string | null 
})
const initialEmail = ref('')
const selectedRole = ref<string>('ROLE_USER')
const userProgressions = ref<Progress[]>([]);
const loading = ref(true)
const saving = ref(false)

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isAdmin)
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

const getPrimaryRole = (roles: string[] = []): string => {
  if (roles.includes('ROLE_ADMIN')) return 'ROLE_ADMIN'
  if (roles.includes('ROLE_MODO')) return 'ROLE_MODO'
  return 'ROLE_USER'
}

const fetchData = async () => {
  loading.value = true
  try {
    const userRes = await api.get(`/users/${userId}`)
    user.value = userRes.data
    initialEmail.value = userRes.data.email
    selectedRole.value = getPrimaryRole(userRes.data.roles)
    
    const progressRes = await api.get(`/webtoon_users?reader=${userId}`)
    userProgressions.value = progressRes.data['hydra:member'] || progressRes.data.member || []
  } catch (error) {
    console.error('Erreur lors de la récupération du détail :', error)
  } finally {
    loading.value = false
  }
}

const handleUpdate = async () => {
  saving.value = true
  try {
    const emailChanged = user.value.email !== initialEmail.value

    const payload: Record<string, string | string[]> = {
      login: user.value.login,
      email: user.value.email
    }

    if (isAdmin.value) {
      payload.roles = [selectedRole.value]
    }

    await api.patch(`/users/${userId}`, payload, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
    })

    if (emailChanged) {
      await api.post('/users/resend-verification', {
        email: user.value.email
      })
      initialEmail.value = user.value.email
      alert('Modifications enregistrées. Un e-mail de vérification a été renvoyé.')
    } else {
      alert('Modifications enregistrées.')
    }
  } catch (error) {
    console.error('Erreur de mise à jour :', error)
    alert('Une erreur est survenue lors de la mise à jour.')
  } finally {
    saving.value = false
  }
}

const handleDelete = async () => {
  if (!confirm('Confirmer la suppression de cet utilisateur ?')) return
  try {
    await api.delete(`/users/${userId}`)
    router.push('/admin/users')
  } catch (error) {
    console.error('Erreur de suppression :', error)
  }
}

onMounted(() => fetchData())
</script>

<template>
  <div class="admin-page">
    <router-link to="/admin/users" class="back-link">← Retour à la liste</router-link>
    <h1>Détail Utilisateur #{{ userId }}</h1>

    <div v-if="loading">Chargement...</div>

    <template v-else>
      <form @submit.prevent="handleUpdate" class="detail-form">
        <div class="field">
          <label>Login :</label>
          <input v-model="user.login" class="app-input-field" required />
        </div>
        <div class="field">
          <label>Email :</label>
          <input v-model="user.email" type="email" class="app-input-field" required />
        </div>
        
        <!-- Champ affiché uniquement pour les administrateurs -->
        <div v-if="isAdmin" class="field">
          <label>Rôle :</label>
          <select v-model="selectedRole" class="app-input-field">
            <option value="ROLE_USER">Utilisateur</option>
            <option value="ROLE_MODO">Modérateur</option>
            <option value="ROLE_ADMIN">Administrateur</option>
          </select>
        </div>

        <div class="field">
          <label>Dernière connexion :</label>
          <input :value="formatDate(user.lastLogin)" class="app-input-field" disabled />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">Enregistrer</button>
          <button type="button" class="btn btn-secondary danger" @click="handleDelete">Supprimer</button>
        </div>
      </form>

      <h2>Progression des Webtoons ({{ userProgressions.length }})</h2>
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID WebtoonUser</th>
            <th>État</th>
            <th>Note</th>
            <th>Marque-page</th>
            <th>Webtoon</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prog in userProgressions" :key="prog.id">
            <td>{{ prog.id }}</td>
            <td>{{ prog.state || '-' }}</td>
            <td>{{ prog.rate || '-' }}</td>
            <td>{{ prog.bookmark || '-' }}</td>
            <td class="action-col">
                <router-link :to="`/admin/webtoons/${prog.webtoon.id}`">{{prog.webtoon.title}} →</router-link>
            </td>
          </tr>
          <tr v-if="userProgressions.length === 0">
            <td colspan="5" class="empty">Aucune progression enregistrée.</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<style scoped>
.admin-page { padding: 2rem 5%; color: #fff; }
.back-link { color: #888; text-decoration: none; font-size: 0.9rem; }
.detail-form { max-width: 400px; margin: 1.5rem 0 2.5rem 0; display: flex; flex-direction: column; gap: 15px; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 0.85rem; color: #888; }
.field input:disabled { opacity: 0.6; cursor: not-allowed; }
.app-input-field {
  background: #252525;
  border: 1px solid #383838;
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
}
.form-actions { display: flex; gap: 10px; margin-top: 10px; }
.action-col { text-align: right; }
.action-col a { color: #e50914; text-decoration: none; }
.btn-secondary.danger { background: #8b0000; }
.btn-secondary.danger:hover { background: #b20710; }
.admin-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
.admin-table th, .admin-table td { border-bottom: 1px solid #282828; padding: 10px; text-align: left; }
.admin-table th { color: #888; font-size: 0.85rem; }
.empty { text-align: center; color: #666; font-style: italic; }
</style>