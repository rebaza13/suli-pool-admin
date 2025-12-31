<template>
  <q-page class="installation-page">
    <div class="installation-header">
      <h1 class="installation-title">Installation Management</h1>
      <q-btn color="secondary" icon="add" label="Add Installation" @click="openCreateDialog" />
    </div>

    <!-- Loading -->
    <div v-if="installationStore.loading" class="text-center q-pa-xl">
      <q-spinner color="secondary" size="3em" />
      <p class="q-mt-md text-grey-7">Loading installations...</p>
    </div>

    <!-- Error -->
    <q-banner v-else-if="installationStore.error" rounded class="bg-negative text-white q-mb-md">
      {{ installationStore.error }}
    </q-banner>

    <!-- Empty -->
    <div v-else-if="installationStore.installations.length === 0" class="installation-empty-state">
      <q-icon name="construction" class="empty-icon" />
      <h2 class="empty-title">No Installations Yet</h2>
      <p class="empty-text">Create your first installation item to get started</p>
      <q-btn color="secondary" icon="add" label="Add Installation" @click="openCreateDialog" />
    </div>

    <!-- List -->
    <div v-else class="installation-steps-list">
      <div
        v-for="installation in installationStore.installations"
        :key="installation.id"
        class="installation-step-card"
      >
        <div class="step-header">
          <div class="step-title-section">
            <div class="step-order-badge">{{ installation.sort_order }}</div>
            <div class="step-status" :class="installation.is_enabled ? 'active' : 'inactive'">
              <q-icon :name="installation.is_enabled ? 'check_circle' : 'cancel'" />
              <span>{{ installation.is_enabled ? 'Active' : 'Inactive' }}</span>
            </div>
            <div v-if="installation.location" class="location-badge">
              <q-icon name="place" size="16px" />
              <span>{{ installation.location }}</span>
            </div>
            <div v-if="installation.completed_at" class="date-badge">
              <q-icon name="event" size="16px" />
              <span>{{ formatDate(installation.completed_at) }}</span>
            </div>
          </div>

          <div class="step-actions">
            <q-btn flat dense round icon="edit" color="secondary" @click="openEditDialog(installation)" />
            <q-btn flat dense round icon="delete" color="negative" @click="confirmDelete(installation)" />
          </div>
        </div>

        <div class="step-content">
          <div class="installation-translations">
            <h3 class="section-title">Translations</h3>

            <div v-if="installation.translations.length > 0" class="translations-list">
              <div v-for="t in installation.translations" :key="t.id" class="translation-item">
                <div class="translation-header">
                  <span class="locale-badge">{{ t.locale }}</span>
                </div>
                <div class="translation-fields">
                  <div><strong>Title:</strong> {{ t.title }}</div>
                  <div v-if="t.subtitle"><strong>Subtitle:</strong> {{ t.subtitle }}</div>
                  <div v-if="t.description"><strong>Description:</strong> {{ t.description }}</div>
                  <div v-if="t.overview_title"><strong>Overview Title:</strong> {{ t.overview_title }}</div>
                  <div v-if="t.overview_description"><strong>Overview:</strong> {{ t.overview_description }}</div>
                  <div v-if="t.meta_items && t.meta_items.length">
                    <strong>Meta:</strong> {{ t.meta_items.join(' • ') }}
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-body2 text-grey-7 q-pa-md">No translations added</div>
          </div>

          <div class="installation-images">
            <h3 class="section-title">
              Images
              <span class="text-body2 text-grey-7">({{ installation.images.length }})</span>
            </h3>

            <div v-if="installation.images.length > 0" class="images-grid">
              <div v-for="img in installation.images" :key="img.id" class="image-item">
                <img
                  v-if="img.media_asset"
                  :src="getImageUrl(img.media_asset.bucket, img.media_asset.path)"
                  :alt="img.media_asset.alt || 'Installation image'"
                />
                <div class="image-order-badge">{{ (img.sort_order || 0) + 1 }}</div>
                <div class="image-overlay">
                  <div class="image-actions">
                    <q-btn
                      round
                      dense
                      flat
                      icon="delete"
                      color="white"
                      @click="confirmDeleteImage(img.id)"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-body2 text-grey-7 q-pa-md">No images uploaded</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Background Image Section -->
    <div class="background-image-section q-mt-xl">
      <div class="section-header">
        <h2 class="section-title">Background Image</h2>
        <p class="section-description">Set a background image for the installations section (only 1 image allowed)</p>
      </div>

      <div v-if="installationStore.backgroundImageLoading" class="text-center q-pa-md">
        <q-spinner color="secondary" size="2em" />
        <p class="q-mt-md text-grey-7">Loading background image...</p>
      </div>

      <div v-else-if="installationStore.backgroundImage" class="background-image-container">
        <div class="background-image-preview">
          <img
            v-if="installationStore.backgroundImage.media_asset"
            :src="getImageUrl(installationStore.backgroundImage.media_asset.bucket, installationStore.backgroundImage.media_asset.path)"
            :alt="installationStore.backgroundImage.media_asset.alt || 'Background image'"
            class="preview-image"
          />
          <div class="image-overlay">
            <div class="image-actions">
              <q-btn
                round
                dense
                flat
                icon="delete"
                color="white"
                @click="confirmDeleteBackgroundImage"
              />
            </div>
          </div>
        </div>
        <div class="background-image-actions q-mt-md">
          <q-btn
            color="secondary"
            icon="cloud_upload"
            label="Replace Image"
            @click="triggerBackgroundFileInput"
          />
        </div>
      </div>

      <div v-else class="background-image-upload-area" @click="triggerBackgroundFileInput" @dragover.prevent @drop.prevent="handleBackgroundDrop">
        <q-icon name="cloud_upload" class="upload-icon" />
        <div class="upload-text">Click or drag image here to upload background image</div>
      </div>

      <!-- File input (always available, hidden) -->
      <input
        ref="backgroundFileInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleBackgroundFileSelect"
      />
    </div>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card class="installation-form-card responsive-dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ isEditing ? 'Edit' : 'Create' }} Installation</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form class="installation-form" @submit.prevent="handleSubmit">
            <div class="form-section">
              <h3 class="section-title">Basic Information</h3>
              <div class="form-row">
                <!-- sort_order is auto-generated by database - not user editable -->
                <q-input 
                  v-model="formData.completed_at" 
                  type="date" 
                  label="Completion Date" 
                  outlined 
                  hint="Date when installation was completed"
                  :rules="[val => !!val || 'Completion date is required']"
                />
                <q-input v-model="formData.location" label="Location" outlined hint="Optional" />
                <q-toggle v-model="formData.is_enabled" label="Enabled" color="secondary" />
              </div>
            </div>

            <div class="form-section">
              <h3 class="section-title">Translations</h3>

              <div
                v-for="(t, index) in formData.translations"
                :key="index"
                class="translation-item q-mb-md"
              >
                <div class="translation-header">
                  <span class="locale-badge">{{ t.locale }}</span>
                </div>

                <div class="translation-fields">
                  <div class="grid-2">
                    <q-input
                      v-model="t.title"
                      label="Title"
                      outlined
                      :rules="[val => !!val || 'Title is required']"
                    />
                    <q-input
                      v-model="t.subtitle"
                      label="Subtitle"
                      outlined
                      hint="Optional subheading"
                    />
                  </div>
                  <q-input
                    v-model="t.description"
                    label="Description (brief)"
                    type="textarea"
                    outlined
                    rows="3"
                    class="q-mt-md"
                  />
                  <div class="grid-2 q-mt-md">
                    <q-input
                      v-model="t.overview_title"
                      label="Overview Title"
                      outlined
                      hint="e.g. Project Overview"
                    />
                    <q-input
                      v-model="metaItemsText[t.locale]"
                      label="Meta Items"
                      outlined
                      hint="Comma separated: 50m², 6 weeks, LED"
                    />
                  </div>
                  <q-input
                    v-model="t.overview_description"
                    label="Overview Description (detailed)"
                    type="textarea"
                    outlined
                    rows="5"
                    class="q-mt-md"
                    hint="Long description for detail page"
                  />
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3 class="section-title">Images</h3>

              <!-- Existing Images (when editing) -->
              <div
                v-if="isEditing && formData.existing_images && formData.existing_images.length > 0"
                class="images-grid q-mb-md"
              >
                <div v-for="(img, index) in formData.existing_images" :key="img.id" class="image-item">
                  <img
                    v-if="img.media_asset"
                    :src="getImageUrl(img.media_asset.bucket, img.media_asset.path)"
                    :alt="img.media_asset.alt || 'Installation image'"
                    style="max-width: 400px; max-height: 300px; object-fit: cover;"
                  />
                  <div class="image-order-badge">{{ index + 1 }}</div>
                  <div class="image-overlay">
                    <div class="image-actions">
                      <q-btn
                        round
                        dense
                        flat
                        icon="delete"
                        color="white"
                        @click="confirmDeleteImage(img.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- New Images -->
              <div v-if="imageFiles.length > 0" class="images-grid q-mb-md">
                <div v-for="(file, index) in imageFiles" :key="`new-${index}`" class="image-item">
                  <img :src="getImagePreview(file)" :alt="file.name" style="max-width: 400px; max-height: 300px; object-fit: cover;" />
                  <div class="image-order-badge">{{ (formData.existing_images?.length || 0) + index + 1 }}</div>
                  <div class="image-overlay">
                    <div class="image-actions">
                      <q-btn round dense flat icon="delete" color="white" @click="removeImage(index)" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="image-upload-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
                <q-icon name="cloud_upload" class="upload-icon" />
                <div class="upload-text">Click or drag images here to upload {{ isEditing ? '(new images)' : '' }}</div>
                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  accept="image/*"
                  style="display: none"
                  @change="handleFileSelect"
                />
              </div>
            </div>

            <div class="q-mt-lg row justify-end q-gutter-sm">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn
                type="submit"
                color="secondary"
                :label="isEditing ? 'Update' : 'Create'"
                :loading="installationStore.loading"
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
  useInstallationStore,
  type InstallationFull,
  type InstallationFormData,
} from 'src/stores/installation-store';
import { makePublicUrl } from 'src/composables/useSupabaseStorage';

const installationStore = useInstallationStore();
const $q = useQuasar();

const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const imageFiles = ref<File[]>([]);
const backgroundFileInput = ref<HTMLInputElement | null>(null);

// Get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  return dateStr || '';
};

const formData = ref<InstallationFormData>({
  sort_order: 0,
  is_enabled: true,
  location: null,
  completed_at: getTodayDate(),
  translations: [
    { locale: 'en', title: '', subtitle: null, description: null, overview_title: null, overview_description: null, meta_items: null },
    { locale: 'ar', title: '', subtitle: null, description: null, overview_title: null, overview_description: null, meta_items: null },
    { locale: 'ckb', title: '', subtitle: null, description: null, overview_title: null, overview_description: null, meta_items: null },
  ],
  existing_images: [],
});

// Separate reactive object for meta_items text inputs
const metaItemsText = ref<Record<string, string>>({
  en: '',
  ar: '',
  ckb: '',
});

onMounted(() => {
  void installationStore.fetchInstallations();
  void installationStore.fetchBackgroundImage();
});

function resetForm() {
  formData.value = {
    sort_order: 0,
    is_enabled: true,
    location: null,
    completed_at: getTodayDate(),
    translations: [
      { locale: 'en', title: '', subtitle: null, description: null, overview_title: null, overview_description: null, meta_items: null },
      { locale: 'ar', title: '', subtitle: null, description: null, overview_title: null, overview_description: null, meta_items: null },
      { locale: 'ckb', title: '', subtitle: null, description: null, overview_title: null, overview_description: null, meta_items: null },
    ],
    existing_images: [],
  };
  metaItemsText.value = {
    en: '',
    ar: '',
    ckb: '',
  };
}

function openCreateDialog() {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  imageFiles.value = [];
  showDialog.value = true;
}

function openEditDialog(installation: InstallationFull) {
  isEditing.value = true;
  editingId.value = installation.id;

  const map = new Map(
    installation.translations.map((t) => [
      t.locale,
      {
        locale: t.locale,
        title: t.title || '',
        subtitle: t.subtitle || null,
        description: t.description || null,
        overview_title: t.overview_title || null,
        overview_description: t.overview_description || null,
        meta_items: t.meta_items || null,
      },
    ])
  );

  const requiredLocales = ['en', 'ar', 'ckb'];
  const translations = requiredLocales.map((locale) => {
    return (
      map.get(locale) || {
        locale,
        title: '',
        subtitle: null,
        description: null,
        overview_title: null,
        overview_description: null,
        meta_items: null,
      }
    );
  });

  formData.value = {
    sort_order: installation.sort_order,
    is_enabled: installation.is_enabled,
    location: installation.location || null,
    completed_at: installation.completed_at,
    translations,
    existing_images: installation.images || [],
  };

  // Set meta_items_text from translations
  metaItemsText.value = {
    en: map.get('en')?.meta_items?.join(', ') ?? '',
    ar: map.get('ar')?.meta_items?.join(', ') ?? '',
    ckb: map.get('ckb')?.meta_items?.join(', ') ?? '',
  };

  imageFiles.value = [];
  showDialog.value = true;
}

async function handleSubmit() {
  try {
    // Parse meta_items from text inputs before submitting
    const translationsWithMeta = formData.value.translations.map((t) => ({
      ...t,
      meta_items: parseMetaItems(metaItemsText.value[t.locale] ?? ''),
    }));

    if (isEditing.value && editingId.value) {
      await installationStore.updateInstallation(editingId.value, {
        ...formData.value,
        translations: translationsWithMeta,
        image_files: imageFiles.value,
      });
      $q.notify({ type: 'positive', message: 'Installation updated', position: 'top' });
    } else {
      await installationStore.createInstallation({
        ...formData.value,
        translations: translationsWithMeta,
        image_files: imageFiles.value,
      });
      $q.notify({ type: 'positive', message: 'Installation created', position: 'top' });
    }

    showDialog.value = false;
    resetForm();
    imageFiles.value = [];
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Operation failed',
      position: 'top',
      timeout: 5000,
    });
  }
}

function confirmDelete(installation: InstallationFull) {
  $q.dialog({
    title: 'Delete Installation',
    message: 'Are you sure you want to delete this item? All translations and images will be deleted.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void installationStore
      .deleteInstallation(installation.id)
      .then(() => $q.notify({ type: 'positive', message: 'Installation deleted', position: 'top' }))
      .catch((err) =>
        $q.notify({
          type: 'negative',
          message: err instanceof Error ? err.message : 'Failed to delete step',
          position: 'top',
        })
      );
  });
}

function confirmDeleteImage(imageId: number) {
  $q.dialog({
    title: 'Delete Image',
    message: 'Are you sure you want to delete this image?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void installationStore
      .deleteInstallationImage(imageId)
      .then(() => $q.notify({ type: 'positive', message: 'Image deleted', position: 'top' }))
      .catch((err) =>
        $q.notify({
          type: 'negative',
          message: err instanceof Error ? err.message : 'Failed to delete image',
          position: 'top',
        })
      );
  });
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files) addImages(Array.from(target.files));
}

function handleDrop(event: DragEvent) {
  if (event.dataTransfer?.files) addImages(Array.from(event.dataTransfer.files));
}

function addImages(files: File[]) {
  const imgs = files.filter((f) => f.type.startsWith('image/'));
  imageFiles.value.push(...imgs);
}

function removeImage(index: number) {
  imageFiles.value.splice(index, 1);
}

function getImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

function getImageUrl(bucket: string, path: string): string {
  return makePublicUrl(bucket, path);
}

// Helper function to parse comma-separated meta items
function parseMetaItems(text: string): string[] | null {
  const items = text.split(',').map((s) => s.trim()).filter(Boolean);
  return items.length ? items : null;
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Background image functions
function triggerBackgroundFileInput() {
  backgroundFileInput.value?.click();
}

function handleBackgroundFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (file && file.type.startsWith('image/')) {
      void uploadBackgroundImage(file);
    } else {
      $q.notify({
        type: 'negative',
        message: 'Please select a valid image file',
        position: 'top',
      });
      // Reset file input
      if (target) {
        target.value = '';
      }
    }
  }
}

function handleBackgroundDrop(event: DragEvent) {
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      void uploadBackgroundImage(file);
    } else {
      $q.notify({
        type: 'negative',
        message: 'Please drop a valid image file',
        position: 'top',
      });
    }
  }
}

async function uploadBackgroundImage(file: File) {
  try {
    await installationStore.uploadBackgroundImage(file);
    $q.notify({ type: 'positive', message: 'Background image uploaded successfully', position: 'top' });
    // Reset file input to allow selecting the same file again
    if (backgroundFileInput.value) {
      backgroundFileInput.value.value = '';
    }
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to upload background image',
      position: 'top',
      timeout: 5000,
    });
    // Reset file input even on error
    if (backgroundFileInput.value) {
      backgroundFileInput.value.value = '';
    }
  }
}

function confirmDeleteBackgroundImage() {
  $q.dialog({
    title: 'Delete Background Image',
    message: 'Are you sure you want to delete the background image?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void installationStore
      .deleteBackgroundImage()
      .then(() => $q.notify({ type: 'positive', message: 'Background image deleted', position: 'top' }))
      .catch((err) =>
        $q.notify({
          type: 'negative',
          message: err instanceof Error ? err.message : 'Failed to delete background image',
          position: 'top',
        })
      );
  });
}
</script>

<style lang="scss" scoped>
@import '../css/sections/installation.scss';
</style>


