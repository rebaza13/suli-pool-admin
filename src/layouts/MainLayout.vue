<template>
  <q-layout view="hHh lpR fFf" class="dashboard-layout">
    <q-header  class="dashboard-header">
      <q-toolbar class="header-toolbar">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
          class="q-mr-sm"
        />

        <q-toolbar-title class="header-title">
          <div class="row items-center">
            <img src="/images/logo.PNG" alt="Logo" class="header-logo q-mr-sm" />
            <span>Suli Pool Admin</span>
          </div>
        </q-toolbar-title>

        <q-space />

        <div class="row items-center q-gutter-sm">
          <div v-if="authStore.userEmail" class="user-email text-body2 text-grey-7 q-mr-sm">
            {{ authStore.userEmail }}
          </div>
          <q-btn
            flat
            dense
            round
            icon="notifications"
            aria-label="Notifications"
            class="header-icon-btn"
          />
          <q-btn
            flat
            dense
            round
            icon="logout"
            aria-label="Logout"
            class="header-icon-btn logout-btn"
            @click="handleLogout"
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :mini="miniState"
      :breakpoint="1024"
      :overlay="false"
      bordered
      class="dashboard-drawer"
      :width="280"
      :mini-width="70"
    >
      <div class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-title">
            <img src="/images/logo.PNG" alt="Logo" />
            <span v-if="!miniState">Menu</span>
          </div>
          <q-btn
            flat
            dense
            round
            :icon="miniState ? 'chevron_right' : 'chevron_left'"
            class="sidebar-toggle-btn"
            @click="toggleMini"
          />
        </div>

        <div class="sidebar-content">
          <ul class="sidebar-menu">
            <li
              v-for="item in menuItems"
              :key="item.path"
              class="sidebar-menu-item"
            >
              <router-link
                :to="item.path"
                class="menu-link"
                @click="handleMenuClick"
              >
                <q-icon :name="item.icon" class="menu-icon" />
                <span class="menu-label">{{ item.label }}</span>
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth-store';
import { useQuasar } from 'quasar';

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();

const leftDrawerOpen = ref(false);
const miniState = ref(false);

const menuItems = [
  { label: 'Hero', icon: 'home', path: '/' },
  { label: 'Installation', icon: 'construction', path: '/installation' },
  { label: 'Why We Different', icon: 'verified', path: '/why-we-different' },
  { label: 'Company Stats', icon: 'bar_chart', path: '/company-statistics' },
  { label: 'About', icon: 'info', path: '/about' },
  { label: 'Features', icon: 'star', path: '/features' },
  { label: 'Projects', icon: 'folder', path: '/projects' },
  { label: 'Locations', icon: 'place', path: '/locations' },
  { label: 'Timeline', icon: 'timeline', path: '/timeline' },
  { label: 'Social Media', icon: 'share', path: '/social-media' },
];

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function toggleMini() {
  miniState.value = !miniState.value;
}

function handleMenuClick() {
  // Close drawer on mobile after menu click
  if ($q.screen.lt.md) {
    leftDrawerOpen.value = false;
  }
}

function handleLogout() {
  $q.dialog({
    title: 'Logout',
    message: 'Are you sure you want to logout?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void authStore.logout().then(() => {
      void router.push('/login');
      $q.notify({
        type: 'positive',
        message: 'Logged out successfully',
        position: 'top',
      });
    }).catch(() => {
      $q.notify({
        type: 'negative',
        message: 'Error logging out',
        position: 'top',
      });
    });
  });
}
</script>

<style lang="scss" scoped>
@import '../css/sections/dashboard.scss';
@import '../css/variables.scss';

.header-toolbar {
  padding: 0 $space-16;
  min-height: 64px;
}

.header-title {
  font-weight: 600;
  font-size: $font-size-lg;
  color: $color-primary;
}

.header-logo {
  height: 32px;
  width: auto;
}

.user-email {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-icon-btn {
  color: $color-text-soft;
  transition: all 0.2s ease;

  &:hover {
    color: $color-secondary;
    background-color: rgba($color-secondary, 0.1);
  }
}

.logout-btn {
  &:hover {
    color: #c10015;
    background-color: rgba(193, 0, 21, 0.1);
  }
}

// Responsive adjustments
@media (max-width: $bp-sm) {
  .user-email {
    display: none;
  }

  .header-title {
    font-size: $font-size-md;
  }

  .header-logo {
    height: 24px;
  }
}

// Mobile hamburger menu button - always visible and prominent
@media (max-width: 1024px) {
  .header-toolbar {
    .q-btn[aria-label="Menu"] {
      background-color: rgba($color-secondary, 0.1);
      color: $color-secondary;
      
      &:hover {
        background-color: rgba($color-secondary, 0.2);
      }
    }
  }
}
</style>
