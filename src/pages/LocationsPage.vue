<template>
  <q-page class="locations-page">
    <div class="locations-header">
      <h1 class="locations-title">Locations</h1>
      <q-btn color="secondary" icon="add" label="Add Location" @click="openCreateDialog" />
    </div>

    <!-- Loading -->
    <div v-if="locationsStore.loading" class="text-center q-pa-xl">
      <q-spinner color="secondary" size="3em" />
      <p class="q-mt-md text-grey-7">Loading locations...</p>
    </div>

    <!-- Error -->
    <q-banner v-else-if="locationsStore.error" rounded class="bg-negative text-white q-mb-md">
      {{ locationsStore.error }}
    </q-banner>

    <!-- Empty -->
    <div v-else-if="locationsStore.locations.length === 0" class="locations-empty">
      <q-icon name="place" class="empty-icon" />
      <h2 class="empty-title">No Locations Yet</h2>
      <p class="empty-text">Create your first location to get started</p>
      <q-btn color="secondary" icon="add" label="Add Location" @click="openCreateDialog" />
    </div>

    <!-- List -->
    <div v-else class="locations-list">
      <div v-for="loc in locationsStore.locations" :key="loc.id" class="location-card">
        <div class="card-header">
          <div class="left">
            <div class="status" :class="loc.is_enabled ? 'active' : 'inactive'">
              <q-icon :name="loc.is_enabled ? 'check_circle' : 'cancel'" />
              <span>{{ loc.is_enabled ? 'Active' : 'Inactive' }}</span>
            </div>
            <div v-if="loc.phone" class="slug-badge">{{ loc.phone }}</div>
            <div v-if="loc.email" class="slug-badge">{{ loc.email }}</div>
          </div>

          <div class="actions">
            <q-btn flat dense round icon="edit" color="secondary" @click="openEditDialog(loc)" />
            <q-btn flat dense round icon="delete" color="negative" @click="confirmDelete(loc)" />
          </div>
        </div>

        <div class="card-content">
          <div class="base-fields">
            <h3 class="section-title">Base</h3>
            <div class="base-grid">
              <div><strong>Phone:</strong> {{ loc.phone || '—' }}</div>
              <div><strong>Email:</strong> {{ loc.email || '—' }}</div>
              <div v-if="loc.map_zoom">
                <strong>Map Zoom:</strong> {{ loc.map_zoom }}
              </div>
            </div>
          </div>
          <div class="translations">
            <h3 class="section-title">Translations</h3>
            <div v-if="loc.translations.length > 0" class="translations-list">
              <div v-for="t in loc.translations" :key="t.id" class="translation-item">
                <div class="translation-header">
                  <span class="locale-badge">{{ t.locale }}</span>
                </div>
                <div class="translation-fields">
                  <div v-if="t.section_title"><strong>Section title:</strong> {{ t.section_title }}</div>
                  <div v-if="t.section_subtitle"><strong>Subtitle:</strong> {{ t.section_subtitle }}</div>
                  <div v-if="t.phone_label"><strong>Phone label:</strong> {{ t.phone_label }}</div>
                  <div v-if="t.email_label"><strong>Email label:</strong> {{ t.email_label }}</div>
                  <div v-if="t.address_label || t.address">
                    <strong>{{ t.address_label || 'Address' }}:</strong> {{ t.address }}
                  </div>
                  <div v-if="t.working_hours_label || t.working_hours">
                    <strong>{{ t.working_hours_label || 'Working hours' }}:</strong> {{ t.working_hours }}
                  </div>
                  <div v-if="t.marker_title"><strong>Marker title:</strong> {{ t.marker_title }}</div>
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
      <q-card class="locations-form-card responsive-dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ isEditing ? 'Edit' : 'Create' }} Location</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form class="locations-form" @submit.prevent="handleSubmit">
            <div class="form-section">
              <h3 class="section-title">Basic</h3>
              <div class="form-row">
                <q-input v-model="formData.phone" label="Phone" outlined />
                <q-input v-model="formData.email" label="Email" outlined />
                <q-input v-model.number="formData.map_zoom" type="number" label="Map Zoom" outlined />
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
                  <div class="grid-2">
                    <q-input v-model="t.section_title" label="Section Title" outlined />
                    <q-input v-model="t.section_subtitle" label="Section Subtitle" outlined />
                    <q-input v-model="t.phone_label" label="Phone Label" outlined />
                    <q-input v-model="t.email_label" label="Email Label" outlined />
                    <q-input v-model="t.address_label" label="Address Label" outlined />
                    <q-input v-model="t.working_hours_label" label="Working Hours Label" outlined />
                    <q-input v-model="t.marker_title" label="Marker Title" outlined />
                  </div>

                  <q-input v-model="t.address" label="Address" type="textarea" outlined rows="2" class="q-mt-md" />
                  <q-input v-model="t.working_hours" label="Working Hours" type="textarea" outlined rows="2" class="q-mt-md" />
                </div>
              </div>
            </div>

            <div class="q-mt-lg row justify-end q-gutter-sm">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn type="submit" color="secondary" :label="isEditing ? 'Update' : 'Create'" :loading="locationsStore.loading" />
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
import { useLocationsStore, type LocationFull, type LocationFormData } from 'src/stores/locations-store';

const locationsStore = useLocationsStore();
const $q = useQuasar();

const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);

const requiredLocales = ['en', 'ar', 'ckb'];

const formData = ref<LocationFormData>({
  phone: null,
  email: null,
  map_lat: null,
  map_lng: null,
  map_zoom: null,
  is_enabled: true,
  translations: [
    {
      locale: 'en',
      section_title: null,
      section_subtitle: null,
      phone_label: null,
      email_label: null,
      address: null,
      address_label: null,
      working_hours: null,
      working_hours_label: null,
      marker_title: null,
    },
    {
      locale: 'ar',
      section_title: null,
      section_subtitle: null,
      phone_label: null,
      email_label: null,
      address: null,
      address_label: null,
      working_hours: null,
      working_hours_label: null,
      marker_title: null,
    },
    {
      locale: 'ckb',
      section_title: null,
      section_subtitle: null,
      phone_label: null,
      email_label: null,
      address: null,
      address_label: null,
      working_hours: null,
      working_hours_label: null,
      marker_title: null,
    },
  ],
});

onMounted(() => {
  void locationsStore.fetchLocations();
});

function resetForm() {
  formData.value = {
    phone: null,
    email: null,
    map_lat: null,
    map_lng: null,
    map_zoom: null,
    is_enabled: true,
    translations: requiredLocales.map((locale) => ({
      locale,
      section_title: null,
      section_subtitle: null,
      phone_label: null,
      email_label: null,
      address: null,
      address_label: null,
      working_hours: null,
      working_hours_label: null,
      marker_title: null,
    })),
  };
}

function openCreateDialog() {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  showDialog.value = true;
}

function openEditDialog(loc: LocationFull) {
  isEditing.value = true;
  editingId.value = loc.id;

  const map = new Map(
    loc.translations.map((t) => [
      t.locale,
      {
        locale: t.locale,
        section_title: t.section_title ?? null,
        section_subtitle: t.section_subtitle ?? null,
        phone_label: t.phone_label ?? null,
        email_label: t.email_label ?? null,
        address: t.address ?? null,
        address_label: t.address_label ?? null,
        working_hours: t.working_hours ?? null,
        working_hours_label: t.working_hours_label ?? null,
        marker_title: t.marker_title ?? null,
      },
    ])
  );

  const translations = requiredLocales.map((locale) => {
    return (
      map.get(locale) || {
        locale,
        section_title: null,
        section_subtitle: null,
        phone_label: null,
        email_label: null,
        address: null,
        address_label: null,
        working_hours: null,
        working_hours_label: null,
        marker_title: null,
      }
    );
  });

  formData.value = {
    phone: loc.phone ?? null,
    email: loc.email ?? null,
    map_lat: loc.map_lat ?? null,
    map_lng: loc.map_lng ?? null,
    map_zoom: loc.map_zoom ?? null,
    is_enabled: loc.is_enabled,
    translations,
  };

  showDialog.value = true;
}

async function handleSubmit() {
  try {
    if (isEditing.value && editingId.value) {
      await locationsStore.updateLocation(editingId.value, formData.value);
      $q.notify({ type: 'positive', message: 'Location updated', position: 'top' });
    } else {
      await locationsStore.createLocation(formData.value);
      $q.notify({ type: 'positive', message: 'Location created', position: 'top' });
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

function confirmDelete(loc: LocationFull) {
  $q.dialog({
    title: 'Delete Location',
    message: 'Are you sure you want to delete this location? Translations will be deleted.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void locationsStore
      .deleteLocation(loc.id)
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
@import '../css/variables.scss';

.locations-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-16;
}

.locations-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: $color-primary;
}

.locations-empty {
  text-align: center;
  padding: 48px 16px;
}

.empty-icon {
  font-size: 64px;
  color: $color-text-soft;
}

.empty-title {
  margin: 12px 0 6px;
}

.empty-text {
  margin: 0 0 16px;
  color: $color-text-soft;
}

.location-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.slug-badge {
  background: rgba($color-primary, 0.08);
  color: $color-primary;
  border-radius: 10px;
  padding: 6px 10px;
  font-weight: 600;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 600;

  &.active {
    background: rgba(33, 186, 69, 0.12);
    color: #21ba45;
  }

  &.inactive {
    background: rgba(193, 0, 21, 0.12);
    color: #c10015;
  }
}

.card-content {
  padding-top: 12px;
}

.base-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

@media (max-width: 640px) {
  .base-grid {
    grid-template-columns: 1fr;
  }
}

.section-title {
  margin: 0 0 8px;
  font-size: 14px;
  color: $color-text-soft;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.translation-item {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  padding: 12px;
}

.locale-badge {
  display: inline-block;
  background: rgba($color-secondary, 0.14);
  color: $color-secondary;
  font-weight: 700;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.locations-form-card {
  @media (max-width: 768px) {
    .q-card-section {
      padding: 16px;
      max-height: calc(100vh - 140px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
  }
  
  @media (max-width: 640px) {
    margin: 4px;
    border-radius: 8px;
    
    .q-card-section {
      padding: 12px;
      max-height: calc(100vh - 120px);
    }
  }
  
  // Landscape mobile
  @media (max-width: 768px) and (orientation: landscape) {
    .q-card-section {
      max-height: calc(100vh - 100px);
      padding: 12px;
    }
  }
}

.locations-form {
  .form-section {
    @media (max-width: 768px) {
      margin-bottom: 24px;
      padding-bottom: 16px;
    }
    
    @media (max-width: 640px) {
      margin-bottom: 20px;
      padding-bottom: 12px;
      
      .section-title {
        font-size: 16px;
        margin-bottom: 12px;
      }
    }
  }
  
  .form-row {
    @media (max-width: 768px) {
      grid-template-columns: 1fr !important;
      gap: 12px;
    }
  }
  
  .form-section {
    @media (max-width: 768px) {
      margin-bottom: 24px;
      padding-bottom: 16px;
      
      .section-title {
        font-size: 18px;
        margin-bottom: 16px;
      }
    }
    
    @media (max-width: 640px) {
      margin-bottom: 20px;
      padding-bottom: 12px;
      
      .section-title {
        font-size: 16px;
        margin-bottom: 12px;
      }
    }
  }
}

@media (max-width: 640px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>


