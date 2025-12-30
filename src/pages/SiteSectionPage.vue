<template>
  <q-page class="site-section-page">
    <div class="site-section-header">
      <h1 class="site-section-title">Site Sections Management</h1>
    </div>

    <!-- Loading State -->
    <div v-if="siteSectionStore.loading" class="text-center q-pa-xl">
      <q-spinner color="secondary" size="3em" />
      <p class="q-mt-md text-grey-7">Loading site sections...</p>
    </div>

    <!-- Error State -->
    <q-banner v-else-if="siteSectionStore.error" rounded class="bg-negative text-white q-mb-md">
      {{ siteSectionStore.error }}
    </q-banner>

    <!-- Empty State -->
    <div v-else-if="siteSectionStore.siteSections.length === 0" class="site-section-empty-state">
      <q-icon name="web" class="empty-icon" />
      <h2 class="empty-title">No Site Sections</h2>
      <p class="empty-text">No site sections available</p>
    </div>

    <!-- Site Sections List -->
    <div v-else class="site-sections-list">
      <div
        v-for="section in siteSectionStore.siteSections"
        :key="section.id"
        class="site-section-card"
      >
        <!-- Section Header -->
        <div class="section-header">
          <div class="section-title-section">
            <div class="section-key-badge">{{ section.key }}</div>
            <div class="section-order-badge">{{ section.sort_order ?? 'N/A' }}</div>
            <div class="section-status" :class="section.is_enabled ? 'active' : 'inactive'">
              <q-icon :name="section.is_enabled ? 'check_circle' : 'cancel'" />
              <span>{{ section.is_enabled ? 'Active' : 'Inactive' }}</span>
            </div>
          </div>
          <div class="section-actions">
            <q-btn
              flat
              dense
              round
              icon="edit"
              color="secondary"
              @click="openEditDialog(section)"
            />
          </div>
        </div>

        <!-- Section Content -->
        <div class="site-section-content">
          <!-- Translations -->
          <div v-if="section.translations.length > 0" class="translations-section">
            <h3 class="section-title">Translations</h3>
            <div class="translations-list">
              <div
                v-for="translation in section.translations"
                :key="translation.id"
                class="translation-item"
              >
                <div class="translation-header">
                  <span class="locale-badge">{{ translation.locale }}</span>
                </div>
                <div class="translation-fields">
                  <div v-if="translation.title"><strong>Title:</strong> {{ translation.title }}</div>
                  <div v-if="translation.subtitle"><strong>Subtitle:</strong> {{ translation.subtitle }}</div>
                  <div v-if="translation.description"><strong>Description:</strong> {{ translation.description }}</div>
                  <div v-if="translation.cta_label"><strong>CTA Label:</strong> {{ translation.cta_label }}</div>
                  <div v-if="translation.cta_href"><strong>CTA Link:</strong> {{ translation.cta_href }}</div>
                  <div v-if="translation.detail"><strong>Detail:</strong> {{ translation.detail }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Images -->
          <div class="images-section">
            <h3 class="section-title">
              Images
              <span class="text-body2 text-grey-7">({{ section.images.length }})</span>
            </h3>
            <div v-if="section.images.length > 0" class="images-grid">
              <div
                v-for="image in section.images"
                :key="image.id"
                class="image-item"
              >
                <img
                  v-if="image.media_asset"
                  :src="getImageUrl(image.media_asset.bucket, image.media_asset.path)"
                  :alt="image.media_asset.alt || 'Site section image'"
                />

                <div class="image-order-badge">{{ image.sort_order + 1 }}</div>
                <div class="image-overlay">
                  <div class="image-actions">
                    <q-btn
                      round
                      dense
                      flat
                      icon="delete"
                      color="white"
                      @click="confirmDeleteImage(image)"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-body2 text-grey-7 q-pa-md">
              No images uploaded
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card class="site-section-form-card responsive-dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ isEditing ? 'Edit' : 'Create' }} Site Section</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="handleSubmit" class="site-section-form">
            <!-- Basic Info -->
            <div class="form-section">
              <h3 class="section-title">Basic Information</h3>
              <div class="form-row">
                <q-input
                  v-model="formData.key"
                  label="Key"
                  outlined
                  hint="Unique identifier (e.g., 'hero', 'services', 'about')"
                  :rules="[val => !!val || 'Key is required']"
                />
                <q-input
                  v-model.number="formData.sort_order"
                  type="number"
                  label="Sort Order"
                  outlined
                  hint="Optional"
                />
                <q-toggle
                  v-model="formData.is_enabled"
                  label="Enabled"
                  color="secondary"
                />
              </div>
            </div>

            <!-- Translations -->
            <div class="form-section">
              <h3 class="section-title">Translations</h3>
              <div
                v-for="(translation, index) in formData.translations"
                :key="index"
                class="translation-item q-mb-md"
              >
                <div class="translation-header">
                  <span class="locale-badge">{{ translation.locale }}</span>
                </div>
                <div class="translation-fields">
                  <q-input
                    v-model="translation.title"
                    label="Title"
                    outlined
                    class="q-mb-md"
                  />
                  <q-input
                    v-model="translation.subtitle"
                    label="Subtitle"
                    outlined
                    class="q-mb-md"
                  />
                  <q-input
                    v-model="translation.description"
                    label="Description"
                    type="textarea"
                    outlined
                    rows="3"
                    class="q-mb-md"
                  />
                  <div class="grid-2 q-mb-md">
                    <q-input
                      v-model="translation.cta_label"
                      label="CTA Label"
                      outlined
                      hint="Call-to-action button text"
                    />
                    <q-input
                      v-model="translation.cta_href"
                      label="CTA Link"
                      outlined
                      hint="Call-to-action URL"
                    />
                  </div>
                  <q-input
                    v-model="translation.detail"
                    label="Detail"
                    type="textarea"
                    outlined
                    rows="4"
                    hint="Optional detailed information"
                  />
                </div>
              </div>
            </div>

            <!-- Images -->
            <div class="form-section">
              <h3 class="section-title">Images</h3>

              <!-- Existing Images (when editing) -->
              <div
                v-if="isEditing && formData.existing_images && formData.existing_images.length > 0"
                class="images-grid q-mb-md"
              >
                <div
                  v-for="(image, index) in formData.existing_images"
                  :key="image.id"
                  class="image-item"
                >
                  <img
                    v-if="image.media_asset"
                    :src="getImageUrl(image.media_asset.bucket, image.media_asset.path)"
                    :alt="image.media_asset.alt || 'Site section image'"
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
                        @click="removeExistingImage(image.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- New Images to Upload -->
              <div
                v-if="formData.image_files && formData.image_files.length > 0"
                class="images-grid q-mb-md"
              >
                <div
                  v-for="(file, index) in formData.image_files"
                  :key="`new-${index}`"
                  class="image-item"
                >
                  <img :src="getImagePreview(file)" :alt="file.name" style="max-width: 400px; max-height: 300px; object-fit: cover;" />
                  <div class="image-order-badge">{{ (formData.existing_images?.length || 0) + index + 1 }}</div>
                  <div class="image-overlay">
                    <div class="image-actions">
                      <q-btn
                        round
                        dense
                        flat
                        icon="delete"
                        color="white"
                        @click="removeImage(index)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="image-upload-area"
                @click="triggerFileInput"
                @dragover.prevent
                @drop.prevent="handleDrop"
              >
                <q-icon name="cloud_upload" class="upload-icon" />
                <div class="upload-text">
                  Click or drag images here to upload {{ isEditing ? '(new images)' : '' }}
                </div>
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

            <!-- Form Actions -->
            <div class="q-mt-lg row justify-end q-gutter-sm">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn
                type="submit"
                color="secondary"
                :label="isEditing ? 'Update' : 'Create'"
                :loading="siteSectionStore.loading"
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
import { useSiteSectionStore, type SiteSectionFull, type SiteSectionFormData } from 'src/stores/site-section-store';
import { useQuasar } from 'quasar';
import { makePublicUrl } from 'src/composables/useSupabaseStorage';

const siteSectionStore = useSiteSectionStore();
const $q = useQuasar();

const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const formData = ref<SiteSectionFormData>({
  key: '',
  sort_order: null,
  is_enabled: true,
  translations: [
    { locale: 'en', title: null, subtitle: null, description: null, cta_label: null, cta_href: null, detail: null },
    { locale: 'ar', title: null, subtitle: null, description: null, cta_label: null, cta_href: null, detail: null },
    { locale: 'ckb', title: null, subtitle: null, description: null, cta_label: null, cta_href: null, detail: null },
  ],
  image_files: [],
});

onMounted(() => {
  void siteSectionStore.fetchSiteSections();
});

// Removed: openCreateDialog - users should not create new site sections

function openEditDialog(section: SiteSectionFull) {
  isEditing.value = true;
  editingId.value = section.id;

  // Create a map of existing translations for easy lookup
  const existingTranslationsMap = new Map(
    section.translations.map((t) => [
      t.locale,
      {
        locale: t.locale || '',
        title: t.title,
        subtitle: t.subtitle,
        description: t.description,
        cta_label: t.cta_label,
        cta_href: t.cta_href,
        detail: t.detail,
      },
    ])
  );

  // Ensure all three locales are present (en, ar, ckb)
  const requiredLocales = ['en', 'ar', 'ckb'];
  const translations = requiredLocales.map((locale) => {
    return existingTranslationsMap.get(locale) || {
      locale,
      title: null,
      subtitle: null,
      description: null,
      cta_label: null,
      cta_href: null,
      detail: null,
    };
  });

  formData.value = {
    key: section.key,
    sort_order: section.sort_order,
    is_enabled: section.is_enabled,
    translations,
    image_files: [],
    existing_images: section.images || [],
  };

  showDialog.value = true;
}

function resetForm() {
  formData.value = {
    key: '',
    sort_order: null,
    is_enabled: true,
    translations: [
      { locale: 'en', title: null, subtitle: null, description: null, cta_label: null, cta_href: null, detail: null },
      { locale: 'ar', title: null, subtitle: null, description: null, cta_label: null, cta_href: null, detail: null },
      { locale: 'ckb', title: null, subtitle: null, description: null, cta_label: null, cta_href: null, detail: null },
    ],
    image_files: [],
    existing_images: [],
  };
}

async function handleSubmit() {
  try {
    if (isEditing.value && editingId.value !== null) {
      await siteSectionStore.updateSiteSection(editingId.value, formData.value);
      $q.notify({
        type: 'positive',
        message: 'Site section updated successfully',
        position: 'top',
      });
    } else {
      await siteSectionStore.createSiteSection(formData.value);
      $q.notify({
        type: 'positive',
        message: 'Site section created successfully',
        position: 'top',
      });
    }
    showDialog.value = false;
    resetForm();
  } catch (error) {
    console.error('Error in handleSubmit:', error);
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Operation failed',
      position: 'top',
      timeout: 5000,
    });
  }
}

// Removed: confirmDelete - users should not delete site sections

function confirmDeleteImage(image: { id: number; media_asset?: { alt?: string | null } }) {
  $q.dialog({
    title: 'Delete Image',
    message: 'Are you sure you want to delete this image?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void siteSectionStore.deleteSiteSectionImage(image.id).then(() => {
      $q.notify({
        type: 'positive',
        message: 'Image deleted successfully',
        position: 'top',
      });
    }).catch((error) => {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Failed to delete image',
        position: 'top',
      });
    });
  });
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    addImages(Array.from(target.files));
  }
}

function handleDrop(event: DragEvent) {
  if (event.dataTransfer?.files) {
    addImages(Array.from(event.dataTransfer.files));
  }
}

function addImages(files: File[]) {
  const imageFiles = files.filter((file) => file.type.startsWith('image/'));
  if (!formData.value.image_files) {
    formData.value.image_files = [];
  }
  formData.value.image_files.push(...imageFiles);
}

function removeImage(index: number) {
  if (formData.value.image_files) {
    formData.value.image_files.splice(index, 1);
  }
}

function getImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

function getImageUrl(bucket: string, path: string): string {
  return makePublicUrl(bucket, path);
}

function removeExistingImage(imageId: number) {
  if (formData.value.existing_images) {
    formData.value.existing_images = formData.value.existing_images.filter((img: { id: number }) => img.id !== imageId);
    // Also delete from database
    confirmDeleteImage({ id: imageId });
  }
}
</script>

<style lang="scss" scoped>
@import '../css/sections/site-section.scss';
</style>

