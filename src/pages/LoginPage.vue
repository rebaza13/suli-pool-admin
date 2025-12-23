<template>
  <q-page class="login-page flex flex-center">
    <q-card class="login-card">
      <q-card-section class="login-card-header">
        <div class="text-h4 text-center q-mb-md">Suli Pool Admin</div>
        <div class="text-subtitle1 text-center text-grey-7">Sign in to your account</div>
      </q-card-section>

      <q-card-section class="login-card-body">
        <q-form @submit="onSubmit" class="login-form">
          <q-input
            v-model="email"
            type="email"
            label="Email"
            outlined
            dense
            :rules="[val => !!val || 'Email is required', val => /.+@.+\..+/.test(val) || 'Please enter a valid email']"
            class="q-mb-md"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            outlined
            dense
            :rules="[val => !!val || 'Password is required', val => val.length >= 6 || 'Password must be at least 6 characters']"
            class="q-mb-lg"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <div class="row items-center justify-between q-mb-lg">
            <q-checkbox v-model="rememberMe" label="Remember me" dense />
            <q-btn flat no-caps label="Forgot password?" class="text-primary" />
          </div>

          <q-btn
            unelevated
            color="primary"
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

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const rememberMe = ref(false);
const loading = ref(false);

function onSubmit() {
  loading.value = true;
  // TODO: Implement login logic
  setTimeout(() => {
    loading.value = false;
  }, 2000);
}
</script>

<style lang="scss" scoped>
@import '../css/sections/login.scss';
</style>

