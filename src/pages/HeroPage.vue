<template>
  <q-page class="hero-page">
    <div class="hero-header">
      <h1 class="hero-title">Hero Slides Management</h1>
      <div class="hero-actions">
        <q-btn
          color="secondary"
          icon="add"
          label="Add Hero Slide"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="heroStore.loading" class="text-center q-pa-xl">
      <q-spinner color="secondary" size="3em" />
      <p class="q-mt-md text-grey-7">Loading hero slides...</p>
    </div>

    <!-- Error State -->
    <q-banner v-else-if="heroStore.error" rounded class="bg-negative text-white q-mb-md">
      {{ heroStore.error }}
    </q-banner>

    <!-- Empty State -->
    <div v-else-if="heroStore.heroSlides.length === 0" class="hero-empty-state">
      <q-icon name="image" class="empty-icon" />
      <h2 class="empty-title">No Hero Slides Yet</h2>
      <p class="empty-text">Create your first hero slide to get started</p>
      <q-btn color="secondary" icon="add" label="Add Hero Slide" @click="openCreateDialog" />
    </div>

    <!-- Hero Slides List -->
    <div v-else class="hero-slides-list">
      <div
        v-for="slide in heroStore.heroSlides"
        :key="slide.id"
        class="hero-slide-card"
      >
        <!-- Slide Header -->
        <div class="slide-header">
          <div class="slide-title-section">
            <div class="slide-order-badge">{{ getSlideOrder(slide) }}</div>
            <div class="slide-status" :class="getSlideActive(slide) ? 'active' : 'inactive'">
              <q-icon :name="getSlideActive(slide) ? 'check_circle' : 'cancel'" />
              <span>{{ getSlideActive(slide) ? 'Active' : 'Inactive' }}</span>
            </div>
          </div>
          <div class="slide-actions">
            <q-btn
              flat
              dense
              round
              icon="edit"
              color="secondary"
              @click="openEditDialog(slide)"
            />
            <q-btn
              flat
              dense
              round
              icon="delete"
              color="negative"
              @click="confirmDelete(slide)"
            />
          </div>
        </div>

        <!-- Slide Content -->
        <div class="hero-slide-content">
          <!-- Translations -->
          <div v-if="slide.translations.length > 0" class="translations-section">
            <h3 class="section-title">Translations</h3>
            <div class="translations-list">
              <div
                v-for="translation in slide.translations"
                :key="translation.id"
                class="translation-item"
              >
                <div class="translation-header">
                  <span class="locale-badge">{{ translation.locale }}</span>
                </div>
                <div class="translation-fields">
                  <div><strong>Title:</strong> {{ translation.title }}</div>
                  <div v-if="translation.subtitle"><strong>Subtitle:</strong> {{ translation.subtitle }}</div>
                  <div v-if="translation.sample_text"><strong>Sample Text:</strong> {{ translation.sample_text }}</div>
                  <div v-if="translation.button_text">
                    <strong>Button:</strong> {{ translation.button_text }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Images -->
          <div class="images-section">
            <h3 class="section-title">
              Images
              <span class="text-body2 text-grey-7">({{ slide.images.length }})</span>
            </h3>
            <div v-if="slide.images.length > 0" class="images-grid">
              <div
                v-for="image in slide.images"
                :key="image.id"
                class="image-item"
              >
                <img
                  v-if="image.media_asset"
                  :src="getImageUrl(image.media_asset.bucket, image.media_asset.path)"
                  :alt="image.media_asset.alt || 'Hero slide image'"
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
      <q-card class="hero-form-card" style="min-width: 800px; max-width: 90vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ isEditing ? 'Edit' : 'Create' }} Hero Slide</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="handleSubmit" class="hero-form">
            <!-- Basic Info -->
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
                    :rules="[val => !!val || 'Title is required']"
                    class="q-mb-md"
                  />
                  <q-input
                    v-model="translation.subtitle"
                    label="Subtitle"
                    outlined
                    class="q-mb-md"
                  />
                  <q-input
                    v-model="translation.sample_text"
                    label="Sample Text"
                    type="textarea"
                    outlined
                    rows="3"
                    class="q-mb-md"
                  />
                  <q-input
                    v-model="translation.button_text"
                    label="Button Text"
                    outlined
                    class="q-mb-md"
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
                    :alt="image.media_asset.alt || 'Hero slide image'"
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
                :loading="heroStore.loading"
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
import { useHeroStore, type HeroSlideFull, type HeroSlideFormData } from 'src/stores/hero-store';
import { useQuasar } from 'quasar';
import { makePublicUrl } from 'src/composables/useSupabaseStorage';

const heroStore = useHeroStore();
const $q = useQuasar();

const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const formData = ref<HeroSlideFormData>({
  sort_order: 0,
  is_enabled: true,
  translations: [
    { locale: 'en', title: '', subtitle: null, sample_text: null, button_text: null },
    { locale: 'ar', title: '', subtitle: null, sample_text: null, button_text: null },
    { locale: 'ckb', title: '', subtitle: null, sample_text: null, button_text: null },
  ],
  image_files: [],
});

onMounted(() => {
  void heroStore.fetchHeroSlides();
});

function openCreateDialog() {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  showDialog.value = true;
}

function openEditDialog(slide: HeroSlideFull) {
  isEditing.value = true;
  editingId.value = slide.id;
  
  // Create a map of existing translations for easy lookup
  const existingTranslationsMap = new Map(
    slide.translations.map((t) => [
      t.locale,
      {
        locale: t.locale,
        title: t.title || '',
        subtitle: t.subtitle || null,
        sample_text: t.sample_text || null,
        button_text: t.button_text || null,
      },
    ])
  );
  
  // Ensure all three locales are present (en, ar, ckb)
  const requiredLocales = ['en', 'ar', 'ckb'];
  const translations = requiredLocales.map((locale) => {
    return existingTranslationsMap.get(locale) || {
      locale,
      title: '',
      subtitle: null,
      sample_text: null,
      button_text: null,
    };
  });
  
  formData.value = {
    sort_order: slide.sort_order,
    is_enabled: slide.is_enabled,
    translations,
    image_files: [],
    existing_images: slide.images || [],
  };

  console.log('Form data set:', formData.value);
  showDialog.value = true;
}

function resetForm() {
  formData.value = {
    sort_order: 0,
    is_enabled: true,
    translations: [
      { locale: 'en', title: '', subtitle: null, sample_text: null, button_text: null },
      { locale: 'ar', title: '', subtitle: null, sample_text: null, button_text: null },
      { locale: 'ckb', title: '', subtitle: null, sample_text: null, button_text: null },
    ],
    image_files: [],
    existing_images: [],
  };
}

async function handleSubmit() {
  try {
    console.log('Submitting form:', { isEditing: isEditing.value, formData: formData.value });
    
    if (isEditing.value && editingId.value) {
      console.log('Updating hero slide:', editingId.value);
      await heroStore.updateHeroSlide(editingId.value, formData.value);
      $q.notify({
        type: 'positive',
        message: 'Hero slide updated successfully',
        position: 'top',
      });
    } else {
      console.log('Creating new hero slide');
      await heroStore.createHeroSlide(formData.value);
      $q.notify({
        type: 'positive',
        message: 'Hero slide created successfully',
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

function confirmDelete(slide: HeroSlideFull) {
  $q.dialog({
    title: 'Delete Hero Slide',
    message: `Are you sure you want to delete this hero slide? All related translations and images will be deleted.`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void heroStore.deleteHeroSlide(slide.id).then(() => {
      $q.notify({
        type: 'positive',
        message: 'Hero slide deleted successfully',
        position: 'top',
      });
    }).catch((error) => {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Failed to delete hero slide',
        position: 'top',
      });
    });
  });
}

function confirmDeleteImage(image: { id: string; media_asset?: { alt?: string | null } }) {
  $q.dialog({
    title: 'Delete Image',
    message: `Are you sure you want to delete this image?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void heroStore.deleteHeroSlideImage(image.id).then(() => {
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

function getSlideOrder(slide: HeroSlideFull): number {
  return slide.sort_order;
}

function getSlideActive(slide: HeroSlideFull): boolean {
  return slide.is_enabled === true;
}

function removeExistingImage(imageId: string) {
  if (formData.value.existing_images) {
    formData.value.existing_images = formData.value.existing_images.filter((img: { id: string }) => img.id !== imageId);
    // Also delete from database
    confirmDeleteImage({ id: imageId });
  }
}
</script>

<style lang="scss" scoped>
@import '../css/sections/hero.scss';
</style>

