<template>
  <q-page class="stats-page">
    <div class="stats-header">
      <h1 class="stats-title">Company Statistics</h1>
      <q-btn color="secondary" icon="add" label="Add Stat" @click="openCreateDialog" />
    </div>

    <div v-if="statsStore.loading" class="text-center q-pa-xl">
      <q-spinner color="secondary" size="3em" />
      <p class="q-mt-md text-grey-7">Loading statistics...</p>
    </div>

    <q-banner v-else-if="statsStore.error" rounded class="bg-negative text-white q-mb-md">
      {{ statsStore.error }}
    </q-banner>

    <div v-else-if="statsStore.stats.length === 0" class="stats-empty">
      <q-icon name="bar_chart" class="empty-icon" />
      <h2 class="empty-title">No Statistics Yet</h2>
      <p class="empty-text">Create your first statistic to get started</p>
      <q-btn color="secondary" icon="add" label="Add Stat" @click="openCreateDialog" />
    </div>

    <div v-else class="stats-list">
      <div v-for="s in statsStore.orderedStats" :key="s.id" class="stats-card">
        <div class="card-header">
          <div class="left">
            <div class="order-badge">{{ s.order_index ?? 0 }}</div>
            <div class="value-badge">{{ s.value ?? 0 }}</div>
            <div v-if="s.icon" class="icon-preview">
              <q-icon :name="s.icon" size="18px" />
              <span class="icon-name">{{ s.icon }}</span>
            </div>
          </div>
          <div class="actions">
            <q-btn flat dense round icon="edit" color="secondary" @click="openEditDialog(s)" />
            <q-btn flat dense round icon="delete" color="negative" @click="confirmDelete(s.id)" />
          </div>
        </div>

        <div class="card-content">
          <div class="labels-grid">
            <div class="label-pill"><strong>EN:</strong> {{ s.label_en || '-' }}</div>
            <div class="label-pill"><strong>KU:</strong> {{ s.label_ku || '-' }}</div>
            <div class="label-pill"><strong>AR:</strong> {{ s.label_ar || '-' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card class="stats-form-card responsive-dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ isEditing ? 'Edit' : 'Create' }} Statistic</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form class="stats-form" @submit.prevent="handleSubmit">
            <div class="form-section">
              <h3 class="section-title">Main</h3>
              <div class="form-row">
                <q-input v-model.number="formData.order_index" type="number" label="Order Index" outlined />
                <q-input v-model.number="formData.value" type="number" label="Value" outlined />
                <div class="stats-icon-field">
                  <div class="icon-preview-line">
                    <q-chip square color="primary" text-color="white" class="icon-chip">
                      <q-icon :name="formData.icon || 'bar_chart'" class="q-mr-sm" />
                      <span class="chip-text">{{ formData.icon || 'bar_chart' }}</span>
                    </q-chip>
                    <div class="icon-hint">Preview</div>
                  </div>
                  <q-input
                    v-model="formData.icon"
                    label="Icon (Material Icon name)"
                    outlined
                    clearable
                    hint="Example: bar_chart, emoji_events, verified"
                  />
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3 class="section-title">Labels</h3>
              <div class="form-row">
                <q-input v-model="formData.label_en" label="Label (EN)" outlined />
                <q-input v-model="formData.label_ku" label="Label (KU)" outlined />
                <q-input v-model="formData.label_ar" label="Label (AR)" outlined />
              </div>
            </div>

            <div class="q-mt-lg row justify-end q-gutter-sm">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn
                type="submit"
                color="secondary"
                :label="isEditing ? 'Update' : 'Create'"
                :loading="statsStore.loading"
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
  useCompanyStatisticsStore,
  type CompanyStatistic,
  type CompanyStatisticFormData,
} from 'src/stores/company-statistics-store';

const statsStore = useCompanyStatisticsStore();
const $q = useQuasar();

const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);

const formData = ref<CompanyStatisticFormData>({
  label_en: null,
  label_ku: null,
  label_ar: null,
  value: null,
  icon: null,
  order_index: 0,
});

onMounted(() => {
  void statsStore.fetchStats();
});

function resetForm() {
  formData.value = {
    label_en: null,
    label_ku: null,
    label_ar: null,
    value: null,
    icon: null,
    order_index: 0,
  };
}

function openCreateDialog() {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  showDialog.value = true;
}

function openEditDialog(s: CompanyStatistic) {
  isEditing.value = true;
  editingId.value = s.id;
  formData.value = {
    label_en: s.label_en ?? null,
    label_ku: s.label_ku ?? null,
    label_ar: s.label_ar ?? null,
    value: s.value ?? null,
    icon: s.icon ?? null,
    order_index: s.order_index ?? 0,
  };
  showDialog.value = true;
}

async function handleSubmit() {
  try {
    if (isEditing.value && editingId.value) {
      await statsStore.updateStat(editingId.value, formData.value);
      $q.notify({ type: 'positive', message: 'Statistic updated', position: 'top' });
    } else {
      await statsStore.createStat(formData.value);
      $q.notify({ type: 'positive', message: 'Statistic created', position: 'top' });
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

function confirmDelete(id: string) {
  $q.dialog({
    title: 'Delete Statistic',
    message: 'Are you sure you want to delete this statistic?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void statsStore
      .deleteStat(id)
      .then(() => $q.notify({ type: 'positive', message: 'Deleted', position: 'top' }))
      .catch((err) =>
        $q.notify({
          type: 'negative',
          message: err instanceof Error ? err.message : 'Failed to delete',
          position: 'top',
        })
      );
  });
}
</script>

<style lang="scss" scoped>
@import '../css/sections/stats.scss';
</style>


