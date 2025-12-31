import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from 'src/boot/supabase';

// ============================================
// TypeScript Types
// ============================================

export interface MediaAsset {
  id: number;
  bucket: string;
  path: string;
  alt: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  slug: string;
  sort_order: number;
  is_enabled: boolean;
  duration_days: number | null;
  created_at: string;
}

export interface ProjectTranslation {
  id: string;
  project_id: string;
  locale: string;
  badge: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  meta_items: string[] | null;
  created_at: string;
}

export interface ProjectImage {
  id: string;
  project_id: string;
  media_id: number;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
  media_asset?: MediaAsset;
}

export interface ProjectFull extends Project {
  translations: ProjectTranslation[];
  images: ProjectImage[];
}

export interface ProjectFormData {
  slug: string;
  sort_order: number;
  is_enabled: boolean;
  duration_days: number | null;
  translations: Array<
    Omit<ProjectTranslation, 'id' | 'project_id' | 'created_at'>
  >;
  image_files?: File[];
  existing_images?: ProjectImage[];
}

// ============================================
// Projects Store
// ============================================

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<ProjectFull[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const activeProjects = computed(() => {
    const active = projects.value.filter((p) => p.is_enabled === true);
    return active.sort((a, b) => a.sort_order - b.sort_order);
  });

  async function fetchProjects() {
    loading.value = true;
    error.value = null;

    try {
      const { data: baseRows, error: baseError } = await supabase
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true });
      if (baseError) throw baseError;

      const { data: translations, error: translationsError } = await supabase
        .from('project_translations')
        .select('*');
      if (translationsError) throw translationsError;

      const { data: images, error: imagesError } = await supabase
        .from('project_images')
        .select(
          `
          *,
          media_asset:media_assets!project_images_media_id_fkey(*)
        `
        )
        .order('sort_order', { ascending: true });
      if (imagesError) throw imagesError;

      projects.value = (baseRows || []).map((row) => ({
        ...(row as Project),
        translations: (translations || []).filter(
          (t) => (t as ProjectTranslation).project_id === (row as Project).id
        ) as ProjectTranslation[],
        images: (images || [])
          .filter((img) => (img as ProjectImage).project_id === (row as Project).id)
          .map((img) => ({ ...(img as ProjectImage), media_asset: (img as ProjectImage).media_asset as MediaAsset }))
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
      })) as ProjectFull[];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch projects';
      console.error('Error fetching projects:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createProject(formData: ProjectFormData) {
    loading.value = true;
    error.value = null;

    try {
      const { data: project, error: insertError} = await supabase
        .from('projects')
        .insert({
          slug: formData.slug,
          // sort_order is GENERATED ALWAYS - don't include in insert
          is_enabled: formData.is_enabled,
          duration_days: formData.duration_days ?? null,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      if (!project) throw new Error('Failed to create project');

      const projectId = (project as { id: string }).id;

      if (formData.translations?.length) {
        const rows = formData.translations.map((t) => ({
          project_id: projectId,
          locale: t.locale,
          badge: t.badge,
          title: t.title,
          subtitle: t.subtitle ?? null,
          description: t.description ?? null,
          meta_items: t.meta_items ?? null,
        }));
        const { error: translationsError } = await supabase
          .from('project_translations')
          .insert(rows);
        if (translationsError) throw translationsError;
      }

      if (formData.image_files?.length) {
        await uploadProjectImages(projectId, formData.image_files, 0);
      }

      await fetchProjects();
      return project;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create project';
      console.error('Error creating project:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateProject(id: string, formData: Partial<ProjectFormData>) {
    loading.value = true;
    error.value = null;

    try {
      const updateData: Partial<Project> = {};
      if (formData.slug !== undefined) updateData.slug = formData.slug;
      if (formData.is_enabled !== undefined) updateData.is_enabled = formData.is_enabled;
      // sort_order is GENERATED ALWAYS - cannot be updated
      if (formData.duration_days !== undefined) updateData.duration_days = formData.duration_days;

      if (Object.keys(updateData).length > 0) {
        const { error: baseError } = await supabase
          .from('projects')
          .update(updateData)
          .eq('id', id);
        if (baseError) throw baseError;
      }

      if (formData.translations) {
        const { error: deleteError } = await supabase
          .from('project_translations')
          .delete()
          .eq('project_id', id);
        if (deleteError) throw deleteError;

        if (formData.translations.length > 0) {
          const rows = formData.translations.map((t) => ({
            project_id: id,
            locale: t.locale,
            badge: t.badge,
            title: t.title,
            subtitle: t.subtitle ?? null,
            description: t.description ?? null,
            meta_items: t.meta_items ?? null,
          }));
          const { error: insertError } = await supabase
            .from('project_translations')
            .insert(rows);
          if (insertError) throw insertError;
        }
      }

      if (formData.image_files?.length) {
        const existingCount = formData.existing_images?.length || 0;
        await uploadProjectImages(id, formData.image_files, existingCount);
      }

      await fetchProjects();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update project';
      console.error('Error updating project:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteProject(id: string) {
    loading.value = true;
    error.value = null;

    try {
      // Delete images (storage best-effort)
      const project = projects.value.find((p) => p.id === id);
      if (project?.images?.length) {
        for (const img of project.images) {
          try {
            await deleteProjectImage(img.id);
          } catch {
            // ignore per-image failures (best effort)
          }
        }
      }

      const { error: translationsError } = await supabase
        .from('project_translations')
        .delete()
        .eq('project_id', id);
      if (translationsError) throw translationsError;

      const { error: baseError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      if (baseError) throw baseError;

      await fetchProjects();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete project';
      console.error('Error deleting project:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function uploadProjectImages(projectId: string, imageFiles: File[], existingCount: number) {
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (!file) continue;

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `project_${projectId}_${Date.now()}_${i}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: mediaAsset, error: mediaError } = await supabase
        .from('media_assets')
        .insert({ bucket: 'site-images', path: filePath, alt: fileName })
        .select()
        .single();
      if (mediaError) throw mediaError;
      if (!mediaAsset) throw new Error('Failed to create media asset');

      const { error: linkError } = await supabase
        .from('project_images')
        .insert({
          project_id: projectId,
          media_id: (mediaAsset as { id: number }).id,
          sort_order: existingCount + i,
          is_cover: existingCount + i === 0, // default: first image is cover
        });
      if (linkError) throw linkError;
    }
  }

  async function setCoverImage(projectId: string, imageId: string) {
    loading.value = true;
    error.value = null;

    try {
      // 1) clear current cover
      const { error: clearError } = await supabase
        .from('project_images')
        .update({ is_cover: false })
        .eq('project_id', projectId);
      if (clearError) throw clearError;

      // 2) set selected as cover
      const { error: setError } = await supabase
        .from('project_images')
        .update({ is_cover: true })
        .eq('id', imageId)
        .eq('project_id', projectId);
      if (setError) throw setError;

      await fetchProjects();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to set cover image';
      console.error('Error setting cover image:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteProjectImage(imageId: string) {
    // Fetch image link + media asset
    const { data: img, error: fetchError } = await supabase
      .from('project_images')
      .select('*, media_asset:media_assets!project_images_media_id_fkey(*)')
      .eq('id', imageId)
      .single();
    if (fetchError) throw fetchError;

    const mediaAsset = (img as { media_asset?: MediaAsset }).media_asset;

    // 1) Delete from project_images FIRST (removes foreign key reference)
    const { error: linkDeleteError } = await supabase
      .from('project_images')
      .delete()
      .eq('id', imageId);
    if (linkDeleteError) throw linkDeleteError;

    // 2) Delete file from storage
    if (mediaAsset?.bucket && mediaAsset?.path) {
      const { error: storageError } = await supabase.storage
        .from(mediaAsset.bucket)
        .remove([mediaAsset.path]);
      if (storageError) console.warn('Error deleting file from storage:', storageError);
    }

    // 3) Delete from media_assets LAST (now safe, no FK references)
    if (mediaAsset?.id) {
      const { error: mediaDeleteError } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', mediaAsset.id);
      if (mediaDeleteError) throw mediaDeleteError;
    }

    await fetchProjects();
  }

  return {
    projects,
    loading,
    error,
    activeProjects,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    uploadProjectImages,
    setCoverImage,
    deleteProjectImage,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProjectsStore, import.meta.hot));
}


