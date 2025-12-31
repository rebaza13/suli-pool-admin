<template>
  <q-page class="dashboard-page">
    <div class="dashboard-container">
      <div class="page-header">
        <h1 class="page-title">Social Media Links</h1>
        <q-btn
          color="primary"
          icon="add"
          label="Add Link"
          @click="openCreateDialog"
        />
      </div>

      <div v-if="store.loading" class="loading-container">
        <q-spinner-dots size="50px" color="primary" />
      </div>

      <div v-else-if="store.socialLinks.length === 0" class="empty-state">
        <q-icon name="share" size="64px" color="grey-5" />
        <p>No social media links yet</p>
        <q-btn color="primary" label="Add First Link" @click="openCreateDialog" />
      </div>

      <div v-else class="social-grid">
        <div
          v-for="link in store.socialLinks"
          :key="link.id"
          class="social-card dashboard-card"
        >
          <div class="card-header">
            <div class="platform-info">
              <q-icon
                :name="link.icon || getPlatformIcon(link.platform)"
                size="32px"
                :color="link.is_enabled ? 'primary' : 'grey-5'"
              />
              <div class="platform-details">
                <h3 class="platform-name">{{ link.platform }}</h3>
                <a :href="link.url" target="_blank" class="platform-url">{{ link.url }}</a>
              </div>
            </div>
            <q-badge
              :color="link.is_enabled ? 'positive' : 'grey'"
              :label="link.is_enabled ? 'Active' : 'Disabled'"
            />
          </div>

          <div class="card-meta">
            <span class="meta-item">
              <q-icon name="sort" size="16px" />
              Order: {{ link.sort_order }}
            </span>
          </div>

          <div class="card-actions">
            <q-btn
              flat
              dense
              icon="edit"
              color="primary"
              @click="openEditDialog(link)"
            />
            <q-btn
              flat
              dense
              :icon="link.is_enabled ? 'visibility_off' : 'visibility'"
              :color="link.is_enabled ? 'warning' : 'positive'"
              @click="toggleEnabled(link)"
            />
            <q-btn
              flat
              dense
              icon="delete"
              color="negative"
              @click="confirmDelete(link)"
            />
          </div>
        </div>
      </div>

      <!-- Create/Edit Dialog -->
      <q-dialog v-model="dialogOpen" persistent>
        <q-card class="dialog-card responsive-dialog-card">
          <q-card-section class="dialog-header">
            <h2 class="dialog-title">{{ isEditing ? 'Edit Social Link' : 'Add Social Link' }}</h2>
            <q-btn flat dense round icon="close" @click="closeDialog" />
          </q-card-section>

          <q-card-section>
            <div class="form-fields">
              <q-select
                v-model="formData.platform"
                :options="platformOptions"
                label="Platform *"
                outlined
                emit-value
                map-options
                @update:model-value="onPlatformChange"
              />

              <q-input
                v-model="formData.url"
                label="URL *"
                outlined
                placeholder="https://..."
                :rules="[val => !!val || 'URL is required', val => isValidUrl(val) || 'Enter a valid URL']"
              />

              <q-input
                v-model="formData.icon"
                label="Custom Icon (optional)"
                outlined
                hint="Font Awesome class e.g. fab fa-facebook-f"
              />

              <q-input
                v-model.number="formData.sort_order"
                label="Sort Order"
                type="number"
                outlined
              />

              <q-toggle
                v-model="formData.is_enabled"
                label="Enabled"
                color="primary"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Cancel" @click="closeDialog" />
            <q-btn
              color="primary"
              :label="isEditing ? 'Update' : 'Create'"
              :loading="store.loading"
              @click="handleSubmit"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useSocialMediaStore, PLATFORM_ICONS, type SocialMedia, type SocialMediaFormData } from 'src/stores/social-media-store';

const $q = useQuasar();
const store = useSocialMediaStore();

const dialogOpen = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);

const formData = ref<SocialMediaFormData>({
  platform: '',
  url: '',
  icon: null,
  is_enabled: true,
  sort_order: 0,
});

const platformOptions = [
  { label: 'Facebook', value: 'Facebook' },
  { label: 'Instagram', value: 'Instagram' },
  { label: 'Twitter / X', value: 'Twitter' },
  { label: 'YouTube', value: 'YouTube' },
  { label: 'LinkedIn', value: 'LinkedIn' },
  { label: 'TikTok', value: 'TikTok' },
  { label: 'Pinterest', value: 'Pinterest' },
  { label: 'Snapchat', value: 'Snapchat' },
  { label: 'WhatsApp', value: 'WhatsApp' },
  { label: 'Telegram', value: 'Telegram' },
  { label: 'Other', value: 'Other' },
];

onMounted(() => {
  void store.fetchSocialLinks();
});

function getPlatformIcon(platform: string): string {
  return PLATFORM_ICONS[platform.toLowerCase()] || 'link';
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function onPlatformChange(platform: string) {
  // Auto-fill icon if not custom
  if (!formData.value.icon) {
    formData.value.icon = PLATFORM_ICONS[platform.toLowerCase()] || null;
  }
}

function resetForm() {
  formData.value = {
    platform: '',
    url: '',
    icon: null,
    is_enabled: true,
    sort_order: store.socialLinks.length,
  };
}

function openCreateDialog() {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  dialogOpen.value = true;
}

function openEditDialog(link: SocialMedia) {
  isEditing.value = true;
  editingId.value = link.id;
  formData.value = {
    platform: link.platform,
    url: link.url,
    icon: link.icon,
    is_enabled: link.is_enabled,
    sort_order: link.sort_order,
  };
  dialogOpen.value = true;
}

function closeDialog() {
  dialogOpen.value = false;
  resetForm();
}

async function handleSubmit() {
  if (!formData.value.platform || !formData.value.url) {
    $q.notify({ type: 'warning', message: 'Please fill in all required fields' });
    return;
  }

  if (!isValidUrl(formData.value.url)) {
    $q.notify({ type: 'warning', message: 'Please enter a valid URL' });
    return;
  }

  try {
    if (isEditing.value && editingId.value) {
      await store.updateSocialLink(editingId.value, formData.value);
      $q.notify({ type: 'positive', message: 'Social link updated!' });
    } else {
      await store.createSocialLink(formData.value);
      $q.notify({ type: 'positive', message: 'Social link created!' });
    }
    closeDialog();
  } catch {
    $q.notify({ type: 'negative', message: store.error || 'An error occurred' });
  }
}

async function toggleEnabled(link: SocialMedia) {
  try {
    await store.updateSocialLink(link.id, { is_enabled: !link.is_enabled });
    $q.notify({
      type: 'positive',
      message: `${link.platform} ${!link.is_enabled ? 'enabled' : 'disabled'}`,
    });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to update' });
  }
}

function confirmDelete(link: SocialMedia) {
  $q.dialog({
    title: 'Delete Social Link',
    message: `Are you sure you want to delete ${link.platform}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    store.deleteSocialLink(link.id)
      .then(() => {
        $q.notify({ type: 'positive', message: 'Social link deleted!' });
      })
      .catch(() => {
        $q.notify({ type: 'negative', message: 'Failed to delete' });
      });
  });
}
</script>

<style lang="scss" scoped>
@import '../css/variables.scss';

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-24;
  flex-wrap: wrap;
  gap: $space-16;
}

.page-title {
  font-size: $font-size-2xl;
  font-weight: 700;
  color: $color-primary;
  margin: 0;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: $space-16;
  color: $color-text-soft;
}

.social-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: $space-24;
}

.social-card {
  display: flex;
  flex-direction: column;
  gap: $space-16;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-16;
}

.platform-info {
  display: flex;
  align-items: center;
  gap: $space-12;
}

.platform-details {
  display: flex;
  flex-direction: column;
}

.platform-name {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $color-primary;
  margin: 0;
}

.platform-url {
  font-size: $font-size-sm;
  color: $color-secondary;
  text-decoration: none;
  word-break: break-all;

  &:hover {
    text-decoration: underline;
  }
}

.card-meta {
  display: flex;
  gap: $space-16;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: $space-4;
  font-size: $font-size-sm;
  color: $color-text-soft;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-8;
  padding-top: $space-12;
  border-top: 1px solid $color-border;
}

.dialog-card {
  border-radius: $radius-16;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid $color-border;
}

.dialog-title {
  font-size: $font-size-xl;
  font-weight: 600;
  color: $color-primary;
  margin: 0;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: $space-16;
}

.dialog-actions {
  padding: $space-16;
  padding-bottom: calc(#{$space-16} + 10px);
  border-top: 1px solid $color-border;
  
  @media (max-width: $bp-sm) {
    padding: $space-12;
    padding-bottom: calc(#{$space-12} + 10px);
  }
}

.dialog-card {
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
    
    .dialog-title {
      font-size: 18px;
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

@media (max-width: $bp-sm) {
  .social-grid {
    grid-template-columns: 1fr;
  }
}
</style>

