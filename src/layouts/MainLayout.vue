<template>
  <q-layout view="hHh lpR fFf" class="dashboard-layout">
    <q-header elevated class="dashboard-header">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>Suli Pool Admin</q-toolbar-title>

        <q-space />

        <q-btn flat dense round icon="notifications" aria-label="Notifications" />
        <q-btn flat dense round icon="account_circle" aria-label="Account" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="dashboard-drawer">
      <q-list>
        <q-item-label header>Navigation</q-item-label>
        <!-- Navigation items will be added later -->
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>

<style lang="scss" scoped>
@import '../css/sections/dashboard.scss';
</style>
