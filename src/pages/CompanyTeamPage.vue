<template>
  <q-page class="company-team-page">
    <div class="page-header">
      <h1 class="page-title">Company & Team Management</h1>
    </div>

    <q-tabs v-model="tab" class="q-mb-lg" align="left">
      <q-tab name="about" label="About Company" icon="info" />
      <q-tab name="team" label="Team Members" icon="people" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <!-- About Company Tab -->
      <q-tab-panel name="about">
        <div class="about-company-section">
          <!-- Loading -->
          <div v-if="store.loading" class="text-center q-pa-xl">
            <q-spinner color="secondary" size="3em" />
            <p class="q-mt-md text-grey-7">Loading...</p>
          </div>

          <!-- Error -->
          <q-banner v-else-if="store.error" rounded class="bg-negative text-white q-mb-md">
            {{ store.error }}
          </q-banner>

          <!-- Form -->
          <q-card v-else>
            <q-card-section>
              <q-form @submit.prevent="handleAboutSubmit" class="about-form">
                <div class="form-section">
                  <h3 class="section-title">English</h3>
                  <q-input
                    v-model="aboutForm.title_en"
                    label="Title (English)"
                    outlined
                    :rules="[val => !!val || 'Title is required']"
                    class="q-mb-md"
                  />
                  <q-input
                    v-model="aboutForm.description_en"
                    label="Description (English)"
                    type="textarea"
                    outlined
                    rows="5"
                    :rules="[val => !!val || 'Description is required']"
                    class="q-mb-md"
                  />
                </div>

                <div class="form-section">
                  <h3 class="section-title">Kurdish (CKB)</h3>
                  <q-input
                    v-model="aboutForm.title_ku"
                    label="Title (Kurdish)"
                    outlined
                    class="q-mb-md"
                  />
                  <q-input
                    v-model="aboutForm.description_ku"
                    label="Description (Kurdish)"
                    type="textarea"
                    outlined
                    rows="5"
                    class="q-mb-md"
                  />
                </div>

                <div class="form-section">
                  <h3 class="section-title">Arabic</h3>
                  <q-input
                    v-model="aboutForm.title_ar"
                    label="Title (Arabic)"
                    outlined
                    class="q-mb-md"
                  />
                  <q-input
                    v-model="aboutForm.description_ar"
                    label="Description (Arabic)"
                    type="textarea"
                    outlined
                    rows="5"
                    class="q-mb-md"
                  />
                </div>

                <div class="q-mt-lg row justify-end q-gutter-sm">
                  <q-btn
                    type="submit"
                    color="secondary"
                    label="Save About Company"
                    :loading="store.loading"
                  />
                </div>
              </q-form>
            </q-card-section>
          </q-card>
        </div>
      </q-tab-panel>

      <!-- Team Members Tab -->
      <q-tab-panel name="team">
        <div class="team-members-section">
          <div class="section-header">
            <h2 class="section-title">Team Members</h2>
            <q-btn
              color="secondary"
              icon="add"
              label="Add Team Member"
              @click="openCreateTeamDialog"
            />
          </div>

          <!-- Loading -->
          <div v-if="store.loading" class="text-center q-pa-xl">
            <q-spinner color="secondary" size="3em" />
            <p class="q-mt-md text-grey-7">Loading team members...</p>
          </div>

          <!-- Error -->
          <q-banner v-else-if="store.error" rounded class="bg-negative text-white q-mb-md">
            {{ store.error }}
          </q-banner>

          <!-- Empty -->
          <div v-else-if="store.teamMembers.length === 0" class="empty-state">
            <q-icon name="people" class="empty-icon" />
            <h2 class="empty-title">No Team Members Yet</h2>
            <p class="empty-text">Create your first team member to get started</p>
            <q-btn color="secondary" icon="add" label="Add Team Member" @click="openCreateTeamDialog" />
          </div>

          <!-- List -->
          <div v-else class="team-members-list">
            <div
              v-for="member in store.teamMembers"
              :key="member.id"
              class="team-member-card"
            >
              <div class="member-header">
                <div class="member-info">
                  <div class="member-avatar">
                    <img
                      v-if="member.image_url"
                      :src="member.image_url"
                      :alt="member.name"
                    />
                    <q-icon v-else name="person" size="48px" />
                  </div>
                  <div class="member-details">
                    <h3 class="member-name">{{ member.name }}</h3>
                    <div class="member-positions">
                      <div><strong>EN:</strong> {{ member.position_en }}</div>
                      <div v-if="member.position_ku"><strong>KU:</strong> {{ member.position_ku }}</div>
                      <div v-if="member.position_ar"><strong>AR:</strong> {{ member.position_ar }}</div>
                    </div>
                    <div class="member-meta">
                      <span class="order-badge">Order: {{ member.order_index }}</span>
                      <span class="status-badge" :class="member.is_active ? 'active' : 'inactive'">
                        <q-icon :name="member.is_active ? 'check_circle' : 'cancel'" />
                        {{ member.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="member-actions">
                  <q-btn
                    flat
                    dense
                    round
                    icon="edit"
                    color="secondary"
                    @click="openEditTeamDialog(member)"
                  />
                  <q-btn
                    flat
                    dense
                    round
                    icon="delete"
                    color="negative"
                    @click="confirmDeleteTeam(member)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Team Member Create/Edit Dialog -->
    <q-dialog v-model="showTeamDialog" persistent>
      <q-card class="team-form-card responsive-dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ isEditingTeam ? 'Edit' : 'Create' }} Team Member</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="handleTeamSubmit" class="team-form">
            <div class="form-section">
              <h3 class="section-title">Basic Information</h3>
              <q-input
                v-model="teamForm.name"
                label="Name"
                outlined
                :rules="[val => !!val || 'Name is required']"
                class="q-mb-md"
              />
              <div class="grid-2 q-mb-md">
                <q-input
                  v-model.number="teamForm.order_index"
                  type="number"
                  label="Order Index"
                  outlined
                  hint="Lower numbers appear first"
                />
                <q-toggle
                  v-model="teamForm.is_active"
                  label="Active"
                  color="secondary"
                />
              </div>
            </div>

            <div class="form-section">
              <h3 class="section-title">Positions</h3>
              <q-input
                v-model="teamForm.position_en"
                label="Position (English)"
                outlined
                :rules="[val => !!val || 'Position is required']"
                class="q-mb-md"
              />
              <q-input
                v-model="teamForm.position_ku"
                label="Position (Kurdish)"
                outlined
                class="q-mb-md"
              />
              <q-input
                v-model="teamForm.position_ar"
                label="Position (Arabic)"
                outlined
                class="q-mb-md"
              />
            </div>

            <div class="form-section">
              <h3 class="section-title">Photo</h3>
              <div v-if="teamFormImagePreview" class="image-preview q-mb-md">
                <img :src="teamFormImagePreview" alt="Preview" />
              </div>
              <div v-else-if="isEditingTeam && editingTeamMember?.image_url" class="image-preview q-mb-md">
                <img :src="editingTeamMember.image_url" alt="Current" />
              </div>
              <q-file
                v-model="teamFormImageFile"
                label="Upload Photo"
                outlined
                accept="image/*"
                @update:model-value="handleImageSelect"
              >
                <template v-slot:prepend>
                  <q-icon name="cloud_upload" />
                </template>
              </q-file>
            </div>

            <div class="q-mt-lg row justify-end q-gutter-sm">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn
                type="submit"
                color="secondary"
                :label="isEditingTeam ? 'Update' : 'Create'"
                :loading="store.loading"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useCompanyTeamStore, type TeamMember, type AboutCompanyFormData, type TeamMemberFormData } from 'src/stores/company-team-store';
import { useQuasar } from 'quasar';

const store = useCompanyTeamStore();
const $q = useQuasar();

const tab = ref('about');
const showTeamDialog = ref(false);
const isEditingTeam = ref(false);
const editingTeamMember = ref<TeamMember | null>(null);
const editingTeamId = ref<string | null>(null);
const teamFormImageFile = ref<File | null>(null);
const teamFormImagePreview = ref<string | null>(null);

const aboutForm = ref<AboutCompanyFormData>({
  title_en: '',
  title_ku: null,
  title_ar: null,
  description_en: '',
  description_ku: null,
  description_ar: null,
});

const teamForm = ref({
  name: '',
  position_en: '',
  position_ku: null as string | null,
  position_ar: null as string | null,
  order_index: 0,
  is_active: true,
});

onMounted(() => {
  void store.fetchAll();
  loadAboutForm();
});

watch(() => store.aboutCompany, loadAboutForm, { deep: true });

function loadAboutForm() {
  if (store.aboutCompany) {
    aboutForm.value = {
      title_en: store.aboutCompany.title_en || '',
      title_ku: store.aboutCompany.title_ku,
      title_ar: store.aboutCompany.title_ar,
      description_en: store.aboutCompany.description_en || '',
      description_ku: store.aboutCompany.description_ku,
      description_ar: store.aboutCompany.description_ar,
    };
  }
}

async function handleAboutSubmit() {
  try {
    await store.createOrUpdateAboutCompany(aboutForm.value);
    $q.notify({
      type: 'positive',
      message: 'About company saved successfully',
      position: 'top',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save',
      position: 'top',
    });
  }
}

function openCreateTeamDialog() {
  isEditingTeam.value = false;
  editingTeamMember.value = null;
  editingTeamId.value = null;
  resetTeamForm();
  showTeamDialog.value = true;
}

function openEditTeamDialog(member: TeamMember) {
  isEditingTeam.value = true;
  editingTeamMember.value = member;
  editingTeamId.value = member.id;
  teamForm.value = {
    name: member.name,
    position_en: member.position_en,
    position_ku: member.position_ku,
    position_ar: member.position_ar,
    order_index: member.order_index,
    is_active: member.is_active,
  };
  teamFormImageFile.value = null;
  teamFormImagePreview.value = null;
  showTeamDialog.value = true;
}

function resetTeamForm() {
  teamForm.value = {
    name: '',
    position_en: '',
    position_ku: null,
    position_ar: null,
    order_index: 0,
    is_active: true,
  };
  teamFormImageFile.value = null;
  teamFormImagePreview.value = null;
}

function handleImageSelect(file: File | null) {
  if (file) {
    teamFormImagePreview.value = URL.createObjectURL(file);
  } else {
    teamFormImagePreview.value = null;
  }
}

async function handleTeamSubmit() {
  try {
    if (isEditingTeam.value && editingTeamId.value) {
      const updateData: Record<string, unknown> = {
        ...teamForm.value,
      };
      if (teamFormImageFile.value) {
        updateData.image_file = teamFormImageFile.value;
      }
      await store.updateTeamMember(editingTeamId.value, updateData as Partial<TeamMemberFormData & { image_file?: File }>);
      $q.notify({
        type: 'positive',
        message: 'Team member updated successfully',
        position: 'top',
      });
    } else {
      const createData: Record<string, unknown> = {
        ...teamForm.value,
        image_url: null,
      };
      if (teamFormImageFile.value) {
        createData.image_file = teamFormImageFile.value;
      }
      await store.createTeamMember(createData as Partial<TeamMemberFormData & { image_file?: File }>);
      $q.notify({
        type: 'positive',
        message: 'Team member created successfully',
        position: 'top',
      });
    }
    showTeamDialog.value = false;
    resetTeamForm();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Operation failed',
      position: 'top',
    });
  }
}

function confirmDeleteTeam(member: TeamMember) {
  $q.dialog({
    title: 'Delete Team Member',
    message: `Are you sure you want to delete "${member.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void store.deleteTeamMember(member.id).then(() => {
      $q.notify({
        type: 'positive',
        message: 'Team member deleted successfully',
        position: 'top',
      });
    }).catch((error) => {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Failed to delete',
        position: 'top',
      });
    });
  });
}
</script>

<style lang="scss" scoped>
@import '../css/sections/company-team.scss';
</style>

