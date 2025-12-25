<template>
  <q-page class="why-page">
    <div class="why-header">
      <h1 class="why-title">Why We Different</h1>
      <q-btn color="secondary" icon="add" label="Add Item" @click="openCreateDialog" />
    </div>

    <!-- Loading -->
    <div v-if="whyStore.loading" class="text-center q-pa-xl">
      <q-spinner color="secondary" size="3em" />
      <p class="q-mt-md text-grey-7">Loading items...</p>
    </div>

    <!-- Error -->
    <q-banner v-else-if="whyStore.error" rounded class="bg-negative text-white q-mb-md">
      {{ whyStore.error }}
    </q-banner>

    <!-- Empty -->
    <div v-else-if="whyStore.items.length === 0" class="why-empty">
      <q-icon name="emoji_events" class="empty-icon" />
      <h2 class="empty-title">No Items Yet</h2>
      <p class="empty-text">Create your first item to get started</p>
      <q-btn color="secondary" icon="add" label="Add Item" @click="openCreateDialog" />
    </div>

    <!-- List -->
    <div v-else class="why-list">
      <div v-for="item in whyStore.items" :key="item.id" class="why-card">
        <div class="card-header">
          <div class="left">
            <div class="order-badge">{{ item.sort_order }}</div>
            <div class="status" :class="item.is_enabled ? 'active' : 'inactive'">
              <q-icon :name="item.is_enabled ? 'check_circle' : 'cancel'" />
              <span>{{ item.is_enabled ? 'Active' : 'Inactive' }}</span>
            </div>
            <div v-if="item.icon" class="icon-preview">
              <q-icon :name="item.icon" size="18px" />
              <span class="icon-name">{{ item.icon }}</span>
            </div>
          </div>

          <div class="actions">
            <q-btn flat dense round icon="edit" color="secondary" @click="openEditDialog(item)" />
            <q-btn flat dense round icon="delete" color="negative" @click="confirmDelete(item)" />
          </div>
        </div>

        <div class="card-content">
          <div class="translations">
            <h3 class="section-title">Translations</h3>
            <div v-if="item.translations.length > 0" class="translations-list">
              <div v-for="t in item.translations" :key="t.id" class="translation-item">
                <div class="translation-header">
                  <span class="locale-badge">{{ t.locale }}</span>
                </div>
                <div class="translation-fields">
                  <div><strong>Title:</strong> {{ t.title }}</div>
                  <div v-if="t.description"><strong>Description:</strong> {{ t.description }}</div>
                </div>
              </div>
            </div>
            <div v-else class="text-body2 text-grey-7 q-pa-md">No translations added</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card class="why-form-card" style="min-width: 820px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ isEditing ? 'Edit' : 'Create' }} Item</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form class="why-form" @submit.prevent="handleSubmit">
            <div class="form-section">
              <h3 class="section-title">Basic Information</h3>
              <div class="form-row">
                <q-input
                  v-model.number="formData.sort_order"
                  type="number"
                  label="Sort Order"
                  outlined
                  :rules="[val => val >= 0 || 'Order must be 0 or greater']"
                />
                <div class="why-icon-field">
                  <div class="icon-preview-line">
                    <q-chip
                      square
                      color="primary"
                      text-color="white"
                      class="icon-chip"
                    >
                      <q-icon :name="formData.icon || 'emoji_events'" class="q-mr-sm" />
                      <span class="chip-text">{{ formData.icon || 'emoji_events' }}</span>
                    </q-chip>
                    <div class="icon-hint">Preview</div>
                  </div>

                  <q-input
                    v-model="formData.icon"
                    label="Icon (Material Icon name)"
                    outlined
                    hint="Example: star, emoji_events, verified"
                    clearable
                  />
                </div>
                <q-toggle v-model="formData.is_enabled" label="Enabled" color="secondary" />
              </div>
            </div>

            <div class="form-section">
              <h3 class="section-title">Translations</h3>
              <div v-for="(t, index) in formData.translations" :key="index" class="translation-item q-mb-md">
                <div class="translation-header">
                  <span class="locale-badge">{{ t.locale }}</span>
                </div>
                <div class="translation-fields">
                  <q-input
                    v-model="t.title"
                    label="Title"
                    outlined
                    :rules="[val => !!val || 'Title is required']"
                    class="q-mb-md"
                  />
                  <q-input
                    v-model="t.description"
                    label="Description"
                    type="textarea"
                    outlined
                    rows="4"
                    class="q-mb-md"
                  />
                </div>
              </div>
            </div>

            <div class="q-mt-lg row justify-end q-gutter-sm">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn
                type="submit"
                color="secondary"
                :label="isEditing ? 'Update' : 'Create'"
                :loading="whyStore.loading"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  useWhyWeDifferentStore,
  type WhyWeDifferentFull,
  type WhyWeDifferentFormData,
} from 'src/stores/why-we-different-store';

const whyStore = useWhyWeDifferentStore();
const $q = useQuasar();

const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);

const formData = ref<WhyWeDifferentFormData>({
  sort_order: 0,
  icon: null,
  is_enabled: true,
  translations: [
    { locale: 'en', title: '', description: null },
    { locale: 'ar', title: '', description: null },
    { locale: 'ckb', title: '', description: null },
  ],
});

onMounted(() => {
  void whyStore.fetchItems();
});

function resetForm() {
  formData.value = {
    sort_order: 0,
    icon: null,
    is_enabled: true,
    translations: [
      { locale: 'en', title: '', description: null },
      { locale: 'ar', title: '', description: null },
      { locale: 'ckb', title: '', description: null },
    ],
  };
}

function openCreateDialog() {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  showDialog.value = true;
}

function openEditDialog(item: WhyWeDifferentFull) {
  isEditing.value = true;
  editingId.value = item.id;

  const map = new Map(
    item.translations.map((t) => [t.locale, { locale: t.locale, title: t.title || '', description: t.description || null }])
  );

  const requiredLocales = ['en', 'ar', 'ckb'];
  const translations = requiredLocales.map((locale) => {
    return map.get(locale) || { locale, title: '', description: null };
  });

  formData.value = {
    sort_order: item.sort_order,
    icon: item.icon || null,
    is_enabled: item.is_enabled,
    translations,
  };

  showDialog.value = true;
}

async function handleSubmit() {
  try {
    if (isEditing.value && editingId.value) {
      await whyStore.updateItem(editingId.value, formData.value);
      $q.notify({ type: 'positive', message: 'Item updated', position: 'top' });
    } else {
      await whyStore.createItem(formData.value);
      $q.notify({ type: 'positive', message: 'Item created', position: 'top' });
    }
    showDialog.value = false;
    resetForm();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Operation failed',
      position: 'top',
      timeout: 5000,
    });
  }
}

function confirmDelete(item: WhyWeDifferentFull) {
  $q.dialog({
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item? All translations will be deleted.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void whyStore
      .deleteItem(item.id)
      .then(() => $q.notify({ type: 'positive', message: 'Item deleted', position: 'top' }))
      .catch((err) =>
        $q.notify({
          type: 'negative',
          message: err instanceof Error ? err.message : 'Failed to delete item',
          position: 'top',
        })
      );
  });
}
</script>

<style lang="scss" scoped>
@import '../css/sections/why.scss';
</style>


