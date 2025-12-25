<template>
  <q-page class="about-page">
    <div class="about-header">
      <h1 class="about-title">About Section</h1>
      <q-btn color="secondary" icon="add" label="Add About Block" @click="openCreateDialog" />
    </div>

    <!-- Loading -->
    <div v-if="aboutStore.loading" class="text-center q-pa-xl">
      <q-spinner color="secondary" size="3em" />
      <p class="q-mt-md text-grey-7">Loading about sections...</p>
    </div>

    <!-- Error -->
    <q-banner v-else-if="aboutStore.error" rounded class="bg-negative text-white q-mb-md">
      {{ aboutStore.error }}
    </q-banner>

    <!-- Empty -->
    <div v-else-if="aboutStore.sections.length === 0" class="about-empty">
      <q-icon name="info" class="empty-icon" />
      <h2 class="empty-title">No About Blocks Yet</h2>
      <p class="empty-text">Create your first about block to get started</p>
      <q-btn color="secondary" icon="add" label="Add About Block" @click="openCreateDialog" />
    </div>

    <!-- List -->
    <div v-else class="about-list">
      <div v-for="section in aboutStore.sections" :key="section.id" class="about-card">
        <div class="card-header">
          <div class="left">
            <div class="key-badge">{{ section.key }}</div>
            <div class="status" :class="section.is_enabled ? 'active' : 'inactive'">
              <q-icon :name="section.is_enabled ? 'check_circle' : 'cancel'" />
              <span>{{ section.is_enabled ? 'Active' : 'Inactive' }}</span>
            </div>
          </div>

          <div class="actions">
            <q-btn flat dense round icon="edit" color="secondary" @click="openEditDialog(section)" />
            <q-btn flat dense round icon="delete" color="negative" @click="confirmDelete(section.id)" />
          </div>
        </div>

        <div class="card-content">
          <div class="translations">
            <h3 class="section-title">Translations</h3>
            <div v-if="section.translations.length > 0" class="translations-list">
              <div v-for="t in section.translations" :key="t.id" class="translation-item">
                <div class="translation-header">
                  <span class="locale-badge">{{ t.locale }}</span>
                </div>
                <div class="translation-fields">
                  <div v-if="t.eyebrow_text"><strong>Eyebrow:</strong> {{ t.eyebrow_text }}</div>
                  <div v-if="t.section_title"><strong>Title:</strong> {{ t.section_title }}</div>
                  <div v-if="t.section_subtitle"><strong>Subtitle:</strong> {{ t.section_subtitle }}</div>
                  <div v-if="t.description"><strong>Description:</strong> {{ t.description }}</div>
                  <div v-if="t.card_title || t.card_title_highlight">
                    <strong>Card Title:</strong> {{ t.card_title }} <span class="highlight">{{ t.card_title_highlight }}</span>
                  </div>
                  <div v-if="t.card_description"><strong>Card Desc:</strong> {{ t.card_description }}</div>
                  <div v-if="t.cta_label"><strong>CTA:</strong> {{ t.cta_label }}</div>
                  <div v-if="t.cta_href"><strong>Link:</strong> {{ t.cta_href }}</div>
                </div>
              </div>
            </div>
            <div v-else class="text-body2 text-grey-7 q-pa-md">No translations added</div>
          </div>

          <div class="images">
            <h3 class="section-title">
              Images
              <span class="text-body2 text-grey-7">({{ section.images.length }})</span>
            </h3>

            <div v-if="section.images.length > 0" class="images-grid">
              <div v-for="img in section.images" :key="img.id" class="image-item">
                <img
                  v-if="img.media_asset"
                  :src="getImageUrl(img.media_asset.bucket, img.media_asset.path)"
                  :alt="img.media_asset.alt || 'About image'"
                />
                <div class="image-order-badge">{{ img.sort_order + 1 }}</div>
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

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card class="about-form-card" style="min-width: 920px; max-width: 94vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ isEditing ? 'Edit' : 'Create' }} About Block</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form class="about-form" @submit.prevent="handleSubmit">
            <div class="form-section">
              <h3 class="section-title">Basic</h3>
              <div class="form-row">
                <q-input
                  v-model="formData.key"
                  label="Key"
                  outlined
                  hint="Example: main, card, section"
                  :rules="[val => !!val || 'Key is required']"
                />
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
                    <q-input v-model="t.eyebrow_text" label="Eyebrow Text" outlined />
                    <q-input v-model="t.section_title" label="Section Title" outlined />
                    <q-input v-model="t.section_subtitle" label="Section Subtitle" outlined />
                    <q-input v-model="t.cta_label" label="CTA Label" outlined />
                    <q-input v-model="t.cta_href" label="CTA Link" outlined />
                  </div>

                  <q-input v-model="t.description" label="Description" type="textarea" outlined rows="3" class="q-mt-md" />

                  <div class="grid-2 q-mt-md">
                    <q-input v-model="t.card_title" label="Card Title" outlined />
                    <q-input v-model="t.card_title_highlight" label="Card Title Highlight" outlined />
                  </div>
                  <q-input
                    v-model="t.card_description"
                    label="Card Description"
                    type="textarea"
                    outlined
                    rows="3"
                    class="q-mt-md"
                  />
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3 class="section-title">Images</h3>

              <div
                v-if="isEditing && formData.existing_images && formData.existing_images.length > 0"
                class="images-grid q-mb-md"
              >
                <div v-for="(img, index) in formData.existing_images" :key="img.id" class="image-item">
                  <img
                    v-if="img.media_asset"
                    :src="getImageUrl(img.media_asset.bucket, img.media_asset.path)"
                    :alt="img.media_asset.alt || 'About image'"
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

              <div v-if="imageFiles.length > 0" class="images-grid q-mb-md">
                <div v-for="(file, index) in imageFiles" :key="`new-${index}`" class="image-item">
                  <img :src="getImagePreview(file)" :alt="file.name" />
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
                :loading="aboutStore.loading"
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
import { makePublicUrl } from 'src/composables/useSupabaseStorage';
import {
  useAboutStore,
  type AboutSectionFull,
  type AboutSectionFormData,
} from 'src/stores/about-store';

const aboutStore = useAboutStore();
const $q = useQuasar();

const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const imageFiles = ref<File[]>([]);

const formData = ref<AboutSectionFormData>({
  key: '',
  is_enabled: true,
  translations: [
    {
      locale: 'en',
      eyebrow_text: null,
      section_title: null,
      section_subtitle: null,
      description: null,
      card_title: null,
      card_title_highlight: null,
      card_description: null,
      cta_label: null,
      cta_href: null,
    },
    {
      locale: 'ar',
      eyebrow_text: null,
      section_title: null,
      section_subtitle: null,
      description: null,
      card_title: null,
      card_title_highlight: null,
      card_description: null,
      cta_label: null,
      cta_href: null,
    },
    {
      locale: 'ckb',
      eyebrow_text: null,
      section_title: null,
      section_subtitle: null,
      description: null,
      card_title: null,
      card_title_highlight: null,
      card_description: null,
      cta_label: null,
      cta_href: null,
    },
  ],
  existing_images: [],
});

onMounted(() => {
  void aboutStore.fetchAboutSections();
});

function resetForm() {
  formData.value = {
    key: '',
    is_enabled: true,
    translations: [
      {
        locale: 'en',
        eyebrow_text: null,
        section_title: null,
        section_subtitle: null,
        description: null,
        card_title: null,
        card_title_highlight: null,
        card_description: null,
        cta_label: null,
        cta_href: null,
      },
      {
        locale: 'ar',
        eyebrow_text: null,
        section_title: null,
        section_subtitle: null,
        description: null,
        card_title: null,
        card_title_highlight: null,
        card_description: null,
        cta_label: null,
        cta_href: null,
      },
      {
        locale: 'ckb',
        eyebrow_text: null,
        section_title: null,
        section_subtitle: null,
        description: null,
        card_title: null,
        card_title_highlight: null,
        card_description: null,
        cta_label: null,
        cta_href: null,
      },
    ],
    existing_images: [],
  };
  imageFiles.value = [];
}

function openCreateDialog() {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  showDialog.value = true;
}

function openEditDialog(section: AboutSectionFull) {
  isEditing.value = true;
  editingId.value = section.id;

  const map = new Map(
    section.translations.map((t) => [
      t.locale,
      {
        locale: t.locale,
        eyebrow_text: t.eyebrow_text ?? null,
        section_title: t.section_title ?? null,
        section_subtitle: t.section_subtitle ?? null,
        description: t.description ?? null,
        card_title: t.card_title ?? null,
        card_title_highlight: t.card_title_highlight ?? null,
        card_description: t.card_description ?? null,
        cta_label: t.cta_label ?? null,
        cta_href: t.cta_href ?? null,
      },
    ])
  );

  const requiredLocales = ['en', 'ar', 'ckb'];
  const translations = requiredLocales.map((locale) => {
    return (
      map.get(locale) || {
        locale,
        eyebrow_text: null,
        section_title: null,
        section_subtitle: null,
        description: null,
        card_title: null,
        card_title_highlight: null,
        card_description: null,
        cta_label: null,
        cta_href: null,
      }
    );
  });

  formData.value = {
    key: section.key,
    is_enabled: section.is_enabled,
    translations,
    existing_images: section.images || [],
  };

  imageFiles.value = [];
  showDialog.value = true;
}

async function handleSubmit() {
  try {
    if (isEditing.value && editingId.value) {
      await aboutStore.updateAboutSection(editingId.value, {
        ...formData.value,
        image_files: imageFiles.value,
      });
      $q.notify({ type: 'positive', message: 'About block updated', position: 'top' });
    } else {
      await aboutStore.createAboutSection({
        ...formData.value,
        image_files: imageFiles.value,
      });
      $q.notify({ type: 'positive', message: 'About block created', position: 'top' });
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
    title: 'Delete About Block',
    message: 'Are you sure you want to delete this block? Translations and images will be deleted.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void aboutStore
      .deleteAboutSection(id)
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

function confirmDeleteImage(imageId: string) {
  $q.dialog({
    title: 'Delete Image',
    message: 'Are you sure you want to delete this image?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void aboutStore
      .deleteAboutImage(imageId)
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
</script>

<style lang="scss" scoped>
@import '../css/sections/about.scss';
</style>


