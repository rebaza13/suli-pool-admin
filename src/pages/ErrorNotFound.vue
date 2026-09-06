<template>
  <div class="not-found-page fullscreen text-center q-pa-md flex flex-center">
    <div>
      <q-icon name="error_outline" class="not-found-icon" />
      <div class="not-found-code">404</div>
      <div class="not-found-message">This page doesn't exist</div>

      <q-btn
        class="q-mt-xl"
        color="secondary"
        unelevated
        to="/"
        label="Back to Dashboard"
        no-caps
      />
    </div>
  </div>
</template>

<script setup lang="ts">
//
</script>

<style lang="scss" scoped>
@import '../css/variables.scss';

.not-found-page {
  background: $color-bg;
  color: $color-primary;
}

.not-found-icon {
  font-size: 4rem;
  color: $color-secondary;
  margin-bottom: $space-16;
}

.not-found-code {
  font-size: $font-size-8xl;
  font-weight: 700;
  color: $color-primary;
  line-height: 1;
}

.not-found-message {
  font-size: $font-size-lg;
  color: $color-text-soft;
  margin-top: $space-8;
}
</style>
