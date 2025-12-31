<template>
  <q-page class="projects-page">
    <div class="projects-header">
      <h1 class="projects-title">Projects</h1>
      <q-btn color="secondary" icon="add" label="Add Project" @click="openCreateDialog" />
    </div>

    <!-- Loading -->
    <div v-if="projectsStore.loading" class="text-center q-pa-xl">
      <q-spinner color="secondary" size="3em" />
      <p class="q-mt-md text-grey-7">Loading projects...</p>
    </div>

    <!-- Error -->
    <q-banner v-else-if="projectsStore.error" rounded class="bg-negative text-white q-mb-md">
      {{ projectsStore.error }}
    </q-banner>

    <!-- Empty -->
    <div v-else-if="projectsStore.projects.length === 0" class="projects-empty">
      <q-icon name="folder" class="empty-icon" />
      <h2 class="empty-title">No Projects Yet</h2>
      <p class="empty-text">Create your first project to get started</p>
      <q-btn color="secondary" icon="add" label="Add Project" @click="openCreateDialog" />
    </div>

    <!-- List -->
    <div v-else class="projects-list">
      <div v-for="p in projectsStore.projects" :key="p.id" class="project-card">
        <div class="card-header">
          <div class="left">
            <div class="order-badge">{{ p.sort_order }}</div>
            <div class="status" :class="p.is_enabled ? 'active' : 'inactive'">
              <q-icon :name="p.is_enabled ? 'check_circle' : 'cancel'" />
              <span>{{ p.is_enabled ? 'Active' : 'Inactive' }}</span>
            </div>
            <div class="slug-badge">{{ p.slug }}</div>
            <div v-if="p.duration_days !== null" class="duration-badge">
              <q-icon name="schedule" size="16px" />
              <span>{{ p.duration_days }} days</span>
            </div>
          </div>

          <div class="actions">
            <q-btn flat dense round icon="edit" color="secondary" @click="openEditDialog(p)" />
            <q-btn flat dense round icon="delete" color="negative" @click="confirmDelete(p)" />
          </div>
        </div>

        <div class="card-content">
          <div class="translations">
            <h3 class="section-title">Translations</h3>
            <div v-if="p.translations.length > 0" class="translations-list">
              <div v-for="t in p.translations" :key="t.id" class="translation-item">
                <div class="translation-header">
                  <span class="locale-badge">{{ t.locale }}</span>
                </div>
                <div class="translation-fields">
                  <div><strong>Badge:</strong> {{ t.badge }}</div>
                  <div><strong>Title:</strong> {{ t.title }}</div>
                  <div v-if="t.subtitle"><strong>Subtitle:</strong> {{ t.subtitle }}</div>
                  <div v-if="t.description"><strong>Description:</strong> {{ t.description }}</div>
                  <div v-if="t.meta_items && t.meta_items.length">
                    <strong>Meta:</strong> {{ t.meta_items.join(' • ') }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-body2 text-grey-7 q-pa-md">No translations added</div>
          </div>

          <div class="images">
            <h3 class="section-title">
              Images
              <span class="text-body2 text-grey-7">({{ p.images.length }})</span>
            </h3>

            <div v-if="p.images.length > 0" class="images-grid">
              <div v-for="img in p.images" :key="img.id" class="image-item">
                <img
                  v-if="img.media_asset"
                  :src="getImageUrl(img.media_asset.bucket, img.media_asset.path)"
                  :alt="img.media_asset.alt || 'Project image'"
                />

                <div class="image-order-badge">{{ (img.sort_order || 0) + 1 }}</div>
                <div v-if="img.is_cover" class="cover-badge">Cover</div>

                <div class="image-overlay">
                  <div class="image-actions">
                    <q-btn
                      round
                      dense
                      flat
                      icon="star"
                      color="white"
                      @click="confirmSetCover(p.id, img.id)"
                    />
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
      <q-card class="projects-form-card responsive-dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ isEditing ? 'Edit' : 'Create' }} Project</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form class="projects-form" @submit.prevent="handleSubmit">
            <div class="form-section">
              <h3 class="section-title">Basic</h3>
              <div class="form-row">
                <q-input
                  v-model="formData.slug"
                  label="Slug"
                  outlined
                  hint="Example: glass-tiled-infinity"
                  :rules="[val => !!val || 'Slug is required']"
                />
                <q-input
                  v-model.number="formData.sort_order"
                  type="number"
                  label="Sort Order"
                  outlined
                  :rules="[val => val >= 0 || 'Order must be 0 or greater']"
                />
                <q-input
                  v-model.number="formData.duration_days"
                  type="number"
                  label="Duration Days"
                  outlined
                  hint="Optional"
                />
                <q-toggle v-model="formData.is_enabled" label="Enabled" color="secondary" />
              </div>
            </div>

            <div class="form-section">
              <h3 class="section-title">Translations</h3>

              <div v-for="(t, index) in translationDrafts" :key="index" class="translation-item q-mb-md">
                <div class="translation-header">
                  <span class="locale-badge">{{ t.locale }}</span>
                </div>
                <div class="translation-fields">
                  <div class="grid-2">
                    <q-input v-model="t.badge" label="Badge" outlined :rules="[val => !!val || 'Badge is required']" />
                    <q-input v-model="t.title" label="Title" outlined :rules="[val => !!val || 'Title is required']" />
                    <q-input v-model="t.subtitle" label="Subtitle" outlined />
                    <q-input
                      v-model="t.meta_items_text"
                      label="Meta items"
                      outlined
                      hint="Comma separated, e.g. Deck jets, Hidden trough"
                    />
                  </div>
                  <q-input
                    v-model="t.description"
                    label="Description"
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

              <!-- Existing Images (when editing) -->
              <div
                v-if="isEditing && formData.existing_images && formData.existing_images.length > 0"
                class="images-grid q-mb-md"
              >
                <div v-for="(img, index) in formData.existing_images" :key="img.id" class="image-item">
                  <img
                    v-if="img.media_asset"
                    :src="getImageUrl(img.media_asset.bucket, img.media_asset.path)"
                    :alt="img.media_asset.alt || 'Project image'"
                    style="max-width: 400px; max-height: 300px; object-fit: cover;"
                  />
                  <div class="image-order-badge">{{ index + 1 }}</div>
                  <div v-if="img.is_cover" class="cover-badge">Cover</div>
                  <div class="image-overlay">
                    <div class="image-actions">
                      <q-btn
                        round
                        dense
                        flat
                        icon="star"
                        color="white"
                        @click="confirmSetCover(editingId || '', img.id)"
                      />
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
              <q-btn type="submit" color="secondary" :label="isEditing ? 'Update' : 'Create'" :loading="projectsStore.loading" />
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
  useProjectsStore,
  type ProjectFull,
  type ProjectFormData,
  type ProjectTranslation,
} from 'src/stores/projects-store';

type TranslationDraft = Omit<ProjectTranslation, 'id' | 'project_id' | 'created_at' | 'meta_items'> & {
  meta_items_text: string;
};

const projectsStore = useProjectsStore();
const $q = useQuasar();

const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const imageFiles = ref<File[]>([]);

const requiredLocales = ['en', 'ar', 'ckb'];

const formData = ref<ProjectFormData>({
  slug: '',
  sort_order: 0,
  is_enabled: true,
  duration_days: null,
  translations: [
    { locale: 'en', badge: '', title: '', subtitle: null, description: null, meta_items: null },
    { locale: 'ar', badge: '', title: '', subtitle: null, description: null, meta_items: null },
    { locale: 'ckb', badge: '', title: '', subtitle: null, description: null, meta_items: null },
  ],
  existing_images: [],
});

const translationDrafts = ref<TranslationDraft[]>([]);

onMounted(() => {
  void projectsStore.fetchProjects();
  syncDraftsFromForm();
});

function syncDraftsFromForm() {
  translationDrafts.value = formData.value.translations.map((t) => ({
    ...t,
    meta_items_text: Array.isArray(t.meta_items) ? t.meta_items.join(', ') : '',
  }));
}

function syncFormFromDrafts() {
  formData.value.translations = translationDrafts.value.map((t) => ({
    locale: t.locale,
    badge: t.badge,
    title: t.title,
    subtitle: t.subtitle ?? null,
    description: t.description ?? null,
    meta_items: parseMetaItems(t.meta_items_text),
  }));
}

function parseMetaItems(text: string): string[] | null {
  const items = text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items : null;
}

function resetForm() {
  formData.value = {
    slug: '',
    sort_order: 0,
    is_enabled: true,
    duration_days: null,
    translations: requiredLocales.map((locale) => ({
      locale,
      badge: '',
      title: '',
      subtitle: null,
      description: null,
      meta_items: null,
    })),
    existing_images: [],
  };
  imageFiles.value = [];
  syncDraftsFromForm();
}

function openCreateDialog() {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  showDialog.value = true;
}

function openEditDialog(p: ProjectFull) {
  isEditing.value = true;
  editingId.value = p.id;

  const map = new Map(
    p.translations.map((t) => [
      t.locale,
      {
        locale: t.locale,
        badge: t.badge ?? '',
        title: t.title ?? '',
        subtitle: t.subtitle ?? null,
        description: t.description ?? null,
        meta_items: t.meta_items ?? null,
      },
    ])
  );

  const translations = requiredLocales.map((locale) => {
    return (
      map.get(locale) || {
        locale,
        badge: '',
        title: '',
        subtitle: null,
        description: null,
        meta_items: null,
      }
    );
  });

  formData.value = {
    slug: p.slug,
    sort_order: p.sort_order,
    is_enabled: p.is_enabled,
    duration_days: p.duration_days ?? null,
    translations,
    existing_images: p.images || [],
  };

  imageFiles.value = [];
  syncDraftsFromForm();
  showDialog.value = true;
}

async function handleSubmit() {
  try {
    syncFormFromDrafts();

    if (isEditing.value && editingId.value) {
      await projectsStore.updateProject(editingId.value, {
        ...formData.value,
        image_files: imageFiles.value,
      });
      $q.notify({ type: 'positive', message: 'Project updated', position: 'top' });
    } else {
      await projectsStore.createProject({
        ...formData.value,
        image_files: imageFiles.value,
      });
      $q.notify({ type: 'positive', message: 'Project created', position: 'top' });
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

function confirmDelete(p: ProjectFull) {
  $q.dialog({
    title: 'Delete Project',
    message: 'Are you sure you want to delete this project? Translations and images will be deleted.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void projectsStore
      .deleteProject(p.id)
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
    void projectsStore
      .deleteProjectImage(imageId)
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

function confirmSetCover(projectId: string, imageId: string) {
  if (!projectId) return;
  $q.dialog({
    title: 'Set Cover',
    message: 'Set this image as the cover image?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void projectsStore
      .setCoverImage(projectId, imageId)
      .then(() => $q.notify({ type: 'positive', message: 'Cover updated', position: 'top' }))
      .catch((err) =>
        $q.notify({
          type: 'negative',
          message: err instanceof Error ? err.message : 'Failed to set cover',
          position: 'top',
        })
      );
  });
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files ? Array.from(input.files) : [];
  if (files.length) imageFiles.value.push(...files);
  if (input) input.value = '';
}

function handleDrop(e: DragEvent) {
  const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
  if (files.length) imageFiles.value.push(...files);
}

function removeImage(index: number) {
  imageFiles.value.splice(index, 1);
}

function getImagePreview(file: File) {
  return URL.createObjectURL(file);
}

function getImageUrl(bucket: string, path: string) {
  return makePublicUrl(bucket, path);
}
</script>

<style lang="scss" scoped>
@import '../css/variables.scss';

.projects-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-16;
}

.projects-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: $color-primary;
}

.projects-empty {
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

.project-card {
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

.order-badge {
  background: rgba($color-secondary, 0.12);
  color: $color-secondary;
  font-weight: 700;
  border-radius: 10px;
  padding: 6px 10px;
  min-width: 36px;
  text-align: center;
}

.slug-badge {
  background: rgba($color-primary, 0.08);
  color: $color-primary;
  border-radius: 10px;
  padding: 6px 10px;
  font-weight: 600;
}

.duration-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.04);
  color: $color-text;
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding-top: 12px;
}

@media (max-width: 1024px) {
  .card-content {
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

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.image-item {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.04);
  height: 140px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.image-order-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
}

.cover-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 193, 7, 0.85);
  color: #1b1b1b;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 800;
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  opacity: 0;
  transition: opacity 0.15s ease;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 10px;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.image-actions {
  display: flex;
  gap: 8px;
}

.image-upload-area {
  border: 2px dashed rgba($color-primary, 0.25);
  border-radius: 14px;
  padding: 18px;
  text-align: center;
  cursor: pointer;
  background: rgba($color-primary, 0.03);
}

.upload-icon {
  font-size: 30px;
  color: $color-primary;
}

.upload-text {
  margin-top: 6px;
  color: $color-text-soft;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.projects-form-card {
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

.projects-form {
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


