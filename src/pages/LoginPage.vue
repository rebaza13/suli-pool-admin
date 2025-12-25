<template>
  <q-page class="login-page flex flex-center">
    <q-card class="login-card">
      <q-card-section class="login-card-header">
        <div class="logo-container">
          <img src="/images/logo.PNG" alt="Suli Pool Logo" />
        </div>
        <div class="text-h4">Suli Pool Admin</div>
        <div class="text-subtitle1">Sign in to your account</div>
      </q-card-section>

      <q-card-section class="login-card-body">
        <q-form @submit="onSubmit" class="login-form">
          <q-input
            v-model="email"
            type="email"
            label="Email"
            outlined
            :rules="[val => !!val || 'Email is required', val => /.+@.+\..+/.test(val) || 'Please enter a valid email']"
            class="q-mb-md"
            :disable="loading"
          >
            <template v-slot:prepend>
              <q-icon name="email" color="secondary" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            outlined
            :rules="[val => !!val || 'Password is required', val => val.length >= 6 || 'Password must be at least 6 characters']"
            class="q-mb-lg"
            :disable="loading"
          >
            <template v-slot:prepend>
              <q-icon name="lock" color="secondary" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                color="secondary"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <div v-if="errorMessage" class="q-mb-md">
            <q-banner rounded class="bg-negative text-white">
              {{ errorMessage }}
            </q-banner>
          </div>

          <div class="row items-center justify-between q-mb-lg">
            <q-checkbox v-model="rememberMe" label="Remember me" dense color="secondary" :disable="loading" />
            <q-btn flat no-caps label="Forgot password?" class="text-secondary" size="sm" :disable="loading" />
          </div>

          <q-btn
            unelevated
            color="secondary"
            size="lg"
            type="submit"
            class="full-width login-submit-btn"
            :loading="loading"
          >
            Sign In
          </q-btn>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth-store';
import { useQuasar } from 'quasar';

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const rememberMe = ref(false);
const loading = ref(false);
const errorMessage = ref('');

async function onSubmit() {
  errorMessage.value = '';
  loading.value = true;

  try {
    await authStore.login(email.value, password.value);
    // Navigation will be handled by the router guard
    await router.push('/');
  } catch (error) {
    const err = error as Error;
    errorMessage.value = err.message || 'Login failed. Please check your credentials.';
    $q.notify({
      type: 'negative',
      message: errorMessage.value,
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
@import '../css/sections/login.scss';
</style>
