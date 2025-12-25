import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from 'src/boot/supabase';
import type { User } from '@supabase/supabase-js';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const loading = ref(true);

  // Getters
  const isAuthenticated = computed(() => !!user.value);
  const userEmail = computed(() => user.value?.email || null);

  // Actions
  async function init() {
    try {
      const { data } = await supabase.auth.getSession();
      user.value = data.session?.user || null;

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user || null;
      });

      loading.value = false;
    } catch (error) {
      console.error('Auth init error:', error);
      loading.value = false;
    }
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async function logout() {
    await supabase.auth.signOut();
    user.value = null;
  }

  return {
    // State
    user,
    loading,
    // Getters
    isAuthenticated,
    userEmail,
    // Actions
    init,
    login,
    logout,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
