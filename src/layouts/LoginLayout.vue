<template>
  <q-layout view="hHh lpR fFf" class="login-layout">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
// Login Layout - Simple layout for authentication pages
</script>

<style lang="scss" scoped>
@import '../css/variables.scss';

.login-layout {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}
</style>

