<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
import LandingView from './LandingView.vue'
import DashboardView from './DashboardView.vue'

const authStore = useAuthStore()
</script>

<template>
  <DashboardView v-if="authStore.isAuthenticated" />
  <LandingView v-else />
</template>