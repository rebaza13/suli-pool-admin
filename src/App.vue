<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from 'src/stores/auth-store';

const authStore = useAuthStore();

onMounted(() => {
  // Initialize auth store on app mount
  void authStore.init();
});
</script>
