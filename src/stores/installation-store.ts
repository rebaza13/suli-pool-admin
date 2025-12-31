import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from 'src/boot/supabase';
import { resolveInstallationImagesSchema, resolveInstallationSchema } from 'src/stores/table-resolver';

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

export interface Installation {
  id: number;
  completed_at: string;
  is_enabled: boolean;
  sort_order: number;
  location: string | null;
}

export interface InstallationTranslation {
  id: number;
  installation_id: number;
  locale: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  overview_title: string | null;
  overview_description: string | null;
  meta_items: string[] | null;
  created_at: string;
}

export interface InstallationImageLink {
  id: number;
  installation_id: number;
  media_id: number;
  sort_order: number;
  created_at: string;
  media_asset?: MediaAsset | undefined;
}

export interface InstallationFull extends Installation {
  translations: InstallationTranslation[];
  images: InstallationImageLink[];
}

export interface InstallationFormData {
  sort_order: number;
  is_enabled: boolean;
  location: string | null;
  completed_at: string;
  translations: Array<Omit<InstallationTranslation, 'id' | 'installation_id' | 'created_at'>>;
  image_files?: File[];
  existing_images?: InstallationImageLink[];
}

export interface SiteSectionImage {
  id: number;
  section_id: number;
  media_id: number;
  sort_order: number;
  created_at: string;
  media_asset?: MediaAsset;
}

// ============================================
// Installation Store
// ============================================

export const useInstallationStore = defineStore('installation', () => {
  const installations = ref<InstallationFull[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const backgroundImage = ref<SiteSectionImage | null>(null);
  const backgroundImageLoading = ref(false);

  const activeInstallations = computed(() => {
    const active = installations.value.filter((i) => i.is_enabled === true);
    return active.sort((a, b) => a.sort_order - b.sort_order);
  });

  async function fetchInstallations() {
    loading.value = true;
    error.value = null;

    try {
      const schema = await resolveInstallationSchema();
      const { data: baseRows, error: baseError } = await supabase
        .from(schema.baseTable)
        .select('*')
        .order('sort_order', { ascending: true });

      if (baseError) throw baseError;

      const { data: translations, error: translationsError } = await supabase
        .from(schema.translationsTable)
        .select('*');

      if (translationsError) throw translationsError;

      // Images
      let images: InstallationImageLink[] = [];
      try {
        const imagesSchema = await resolveInstallationImagesSchema();
        const { data: links, error: linksError } = await supabase
          .from(imagesSchema.imagesTable)
          .select('*')
          .order(imagesSchema.sortColumn, { ascending: true });
        if (linksError) throw linksError;
        images = (links || []) as InstallationImageLink[];

        const mediaIds = Array.from(new Set(images.map((l) => l.media_id).filter((v) => typeof v === 'number')));
        if (mediaIds.length > 0) {
          const { data: assets, error: assetsError } = await supabase
            .from('media_assets')
            .select('*')
            .in('id', mediaIds);
          if (assetsError) throw assetsError;
          const assetMap = new Map<number, MediaAsset>(((assets || []) as MediaAsset[]).map((a) => [a.id, a]));
          images = images.map((img) => ({ ...img, media_asset: assetMap.get(img.media_id) }));
        }
      } catch {
        images = [];
      }

      installations.value = (baseRows || []).map((row) => ({
        ...(row as Installation),
        translations: (translations || []).filter(
          (t) => (t as Record<string, unknown>)[schema.translationsFkColumn] === (row as { id: number }).id
        ) as InstallationTranslation[],
        images: images
          .filter((img) => (img as unknown as Record<string, unknown>).installation_id === (row as { id: number }).id)
          .sort((a, b) => a.sort_order - b.sort_order),
      })) as InstallationFull[];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch installations';
      console.error('Error fetching installations:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createInstallation(formData: InstallationFormData) {
    loading.value = true;
    error.value = null;

    try {
      const schema = await resolveInstallationSchema();
      const { data: installation, error: insertError } = await supabase
        .from(schema.baseTable)
        .insert({
          // sort_order is GENERATED ALWAYS - don't include in insert
          is_enabled: formData.is_enabled,
          location: formData.location || null,
          completed_at: formData.completed_at,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      if (!installation) throw new Error('Failed to create installation');

      const installationId = (installation as { id: number }).id;

      if (formData.translations && formData.translations.length > 0) {
        const translationsToInsert = formData.translations.map((t) => ({
          [schema.translationsFkColumn]: installationId,
          locale: t.locale,
          title: t.title,
          subtitle: t.subtitle || null,
          description: t.description || null,
          overview_title: t.overview_title || null,
          overview_description: t.overview_description || null,
          meta_items: t.meta_items || null,
        }));

        const { error: translationsError } = await supabase
          .from(schema.translationsTable)
          .insert(translationsToInsert);

        if (translationsError) throw translationsError;
      }

      if (formData.image_files && formData.image_files.length > 0) {
        await uploadInstallationImages(installationId, formData.image_files, 0);
      }

      await fetchInstallations();
      return installation;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create installation';
      console.error('Error creating installation:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateInstallation(id: number, formData: Partial<InstallationFormData>) {
    loading.value = true;
    error.value = null;

    try {
      const schema = await resolveInstallationSchema();
      const updateData: Partial<Installation> = {};

      if (formData.is_enabled !== undefined) updateData.is_enabled = formData.is_enabled;
      // sort_order is GENERATED ALWAYS - cannot be updated
      if (formData.location !== undefined) updateData.location = formData.location;
      if (formData.completed_at !== undefined) updateData.completed_at = formData.completed_at;

      if (Object.keys(updateData).length > 0) {
        const { error: baseError } = await supabase
          .from(schema.baseTable)
          .update(updateData)
          .eq('id', id);

        if (baseError) throw baseError;
      }

      if (formData.translations) {
        const { error: deleteError } = await supabase
          .from(schema.translationsTable)
          .delete()
          .eq(schema.translationsFkColumn, id);

        if (deleteError) throw deleteError;

        if (formData.translations.length > 0) {
          const translationsToInsert = formData.translations.map((t) => ({
            [schema.translationsFkColumn]: id,
            locale: t.locale,
            title: t.title,
            subtitle: t.subtitle || null,
            description: t.description || null,
            overview_title: t.overview_title || null,
            overview_description: t.overview_description || null,
            meta_items: t.meta_items || null,
          }));

          const { error: insertError } = await supabase
            .from(schema.translationsTable)
            .insert(translationsToInsert);

          if (insertError) throw insertError;
        }
      }

      if (formData.image_files && formData.image_files.length > 0) {
        const existingCount = formData.existing_images?.length || 0;
        await uploadInstallationImages(id, formData.image_files, existingCount);
      }

      await fetchInstallations();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update installation';
      console.error('Error updating installation:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteInstallation(id: number) {
    loading.value = true;
    error.value = null;

    try {
      const schema = await resolveInstallationSchema();

      // Delete images (best effort)
      try {
        const imagesSchema = await resolveInstallationImagesSchema();
        const { data: rows, error: rowsError } = await supabase
          .from(imagesSchema.imagesTable)
          .select('*')
          .eq('installation_id', id);
        if (rowsError) throw rowsError;
        const links = (rows || []) as InstallationImageLink[];
        for (const link of links) {
          await deleteInstallationImage(link.id);
        }
      } catch {
        // ignore
      }

      const { error: translationsError } = await supabase
        .from(schema.translationsTable)
        .delete()
        .eq(schema.translationsFkColumn, id);
      if (translationsError) throw translationsError;

      const { error: baseError } = await supabase
        .from(schema.baseTable)
        .delete()
        .eq('id', id);
      if (baseError) throw baseError;

      await fetchInstallations();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete installation';
      console.error('Error deleting installation:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function uploadInstallationImages(installationId: number, imageFiles: File[], existingCount: number) {
    const imagesSchema = await resolveInstallationImagesSchema();

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (!file) continue;

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `installation_${Date.now()}_${i}.${fileExt}`;
      const filePath = `installations/${fileName}`;

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

      const insertRow: Record<string, unknown> = {
        installation_id: installationId,
        [imagesSchema.mediaIdColumn]: (mediaAsset as { id: number }).id,
        [imagesSchema.sortColumn]: existingCount + i,
      };

      const { error: linkError } = await supabase.from(imagesSchema.imagesTable).insert(insertRow);
      if (linkError) throw linkError;
    }

    await fetchInstallations();
  }

  async function deleteInstallationImage(imageId: number) {
    const imagesSchema = await resolveInstallationImagesSchema();

    const { data: row, error: rowError } = await supabase
      .from(imagesSchema.imagesTable)
      .select('*')
      .eq('id', imageId)
      .single();
    if (rowError) throw rowError;

    const mediaId = (row as Record<string, unknown>)[imagesSchema.mediaIdColumn] as number | undefined;
    let mediaAsset: MediaAsset | null = null;
    if (typeof mediaId === 'number') {
      const { data: asset, error: assetError } = await supabase
        .from('media_assets')
        .select('*')
        .eq('id', mediaId)
        .single();
      if (assetError) throw assetError;
      mediaAsset = asset as MediaAsset;
    }

    // 1) Delete from installation_images FIRST (removes foreign key reference)
    const { error: linkDeleteError } = await supabase.from(imagesSchema.imagesTable).delete().eq('id', imageId);
    if (linkDeleteError) throw linkDeleteError;

    // 2) Delete file from storage
    if (mediaAsset?.bucket && mediaAsset?.path) {
      const { error: storageError } = await supabase.storage.from(mediaAsset.bucket).remove([mediaAsset.path]);
      if (storageError) console.warn('Error deleting file from storage:', storageError);
    }

    // 3) Delete from media_assets LAST (now safe, no FK references)
    if (mediaAsset?.id) {
      const { error: mediaDeleteError } = await supabase.from('media_assets').delete().eq('id', mediaAsset.id);
      if (mediaDeleteError) throw mediaDeleteError;
    }

    await fetchInstallations();
  }

  // ============================================
  // Background Image Management
  // ============================================

  async function fetchBackgroundImage() {
    backgroundImageLoading.value = true;
    try {
      // Get the installations site section
      const { data: section, error: sectionError } = await supabase
        .from('site_section')
        .select('id')
        .eq('key', 'installations')
        .single();

      if (sectionError) {
        // Section might not exist yet, that's okay
        backgroundImage.value = null;
        return;
      }

      if (!section) {
        backgroundImage.value = null;
        return;
      }

      // Get the background image (should be only 1)
      const { data: images, error: imagesError } = await supabase
        .from('site_section_images')
        .select(`
          *,
          media_asset:media_assets!site_section_images_media_id_fkey(*)
        `)
        .eq('section_id', section.id)
        .order('sort_order', { ascending: true })
        .limit(1);

      if (imagesError) throw imagesError;

      if (images && images.length > 0) {
        backgroundImage.value = {
          ...images[0],
          media_asset: images[0].media_asset as MediaAsset,
        } as SiteSectionImage;
      } else {
        backgroundImage.value = null;
      }
    } catch (err) {
      console.error('Error fetching background image:', err);
      backgroundImage.value = null;
    } finally {
      backgroundImageLoading.value = false;
    }
  }

  async function uploadBackgroundImage(imageFile: File) {
    backgroundImageLoading.value = true;
    try {
      // Get or create the installations site section
      let sectionId: number;

      const { data: existingSection, error: fetchError } = await supabase
        .from('site_section')
        .select('id')
        .eq('key', 'installations')
        .single();

      if (fetchError || !existingSection) {
        // Create the section if it doesn't exist
        const { data: newSection, error: createError } = await supabase
          .from('site_section')
          .insert({
            key: 'installations',
            sort_order: 0,
            is_enabled: true,
          })
          .select()
          .single();

        if (createError || !newSection) {
          throw new Error('Failed to create installations section');
        }
        sectionId = newSection.id;
      } else {
        sectionId = existingSection.id;
      }

      // Delete existing background image if it exists (without loading state management)
      if (backgroundImage.value) {
        const imageId = backgroundImage.value.id;
        const mediaAsset = backgroundImage.value.media_asset;

        // 1. Delete from site_section_images
        const { error: linkError } = await supabase
          .from('site_section_images')
          .delete()
          .eq('id', imageId);

        if (linkError) throw linkError;

        // 2. Check if media_asset is used elsewhere before deleting
        if (mediaAsset?.id) {
          let canDeleteMediaAsset = true;

          // Check if used in timeline_item_images
          try {
            const { data: timelineImages, error: timelineError } = await supabase
              .from('timeline_item_images')
              .select('id')
              .eq('media_id', mediaAsset.id)
              .limit(1);

            if (!timelineError && timelineImages && timelineImages.length > 0) {
              canDeleteMediaAsset = false;
            }
          } catch (err) {
            // Table might not exist, continue
            console.warn('Could not check timeline_item_images:', err);
          }

          // Check if used in other site_section_images
          if (canDeleteMediaAsset) {
            try {
              const { data: otherSectionImages, error: sectionError } = await supabase
                .from('site_section_images')
                .select('id')
                .eq('media_id', mediaAsset.id)
                .limit(1);

              if (!sectionError && otherSectionImages && otherSectionImages.length > 0) {
                canDeleteMediaAsset = false;
              }
            } catch (err) {
              console.warn('Could not check other site_section_images:', err);
            }
          }

          // 3. Delete file from storage
          if (mediaAsset?.bucket && mediaAsset?.path) {
            const { error: storageError } = await supabase.storage
              .from(mediaAsset.bucket)
              .remove([mediaAsset.path]);

            if (storageError) {
              console.warn('Error deleting file from storage:', storageError);
            }
          }

          // 4. Delete from media_assets only if not used elsewhere
          if (canDeleteMediaAsset) {
            const { error: mediaError } = await supabase
              .from('media_assets')
              .delete()
              .eq('id', mediaAsset.id);

            if (mediaError) {
              // If deletion fails due to foreign key, just log it - the file is already deleted from storage
              console.warn('Could not delete media_asset (may be referenced elsewhere):', mediaError);
            }
          } else {
            console.log('Media asset is used elsewhere, keeping media_assets record');
          }
        }

        backgroundImage.value = null;
      }

      // Upload the new image
      const fileExt = imageFile.name.split('.').pop() || 'jpg';
      const fileName = `installations_bg_${Date.now()}.${fileExt}`;
      const filePath = `installations/${fileName}`;

      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('site-images')
        .upload(filePath, imageFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // 2. Create media asset record
      const { data: mediaAsset, error: mediaError } = await supabase
        .from('media_assets')
        .insert({
          bucket: 'site-images',
          path: filePath,
          alt: 'Installations background image',
        })
        .select()
        .single();

      if (mediaError) throw mediaError;
      if (!mediaAsset) throw new Error('Failed to create media asset');

      // 3. Link to site section
      const { data: sectionImage, error: linkError } = await supabase
        .from('site_section_images')
        .insert({
          section_id: sectionId,
          media_id: mediaAsset.id,
          sort_order: 0,
        })
        .select(`
          *,
          media_asset:media_assets!site_section_images_media_id_fkey(*)
        `)
        .single();

      if (linkError) throw linkError;
      if (!sectionImage) throw new Error('Failed to create section image link');

      // Refresh background image from database to ensure we have the latest data
      await fetchBackgroundImage();

      return backgroundImage.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to upload background image';
      console.error('Error uploading background image:', err);
      throw err;
    } finally {
      backgroundImageLoading.value = false;
    }
  }

  async function deleteBackgroundImage() {
    if (!backgroundImage.value) return;

    backgroundImageLoading.value = true;
    try {
      const imageId = backgroundImage.value.id;
      const mediaAsset = backgroundImage.value.media_asset;

      // 1. Delete from site_section_images
      const { error: linkError } = await supabase
        .from('site_section_images')
        .delete()
        .eq('id', imageId);

      if (linkError) throw linkError;

      // 2. Check if media_asset is used elsewhere before deleting
      if (mediaAsset?.id) {
        let canDeleteMediaAsset = true;

        // Check if used in timeline_item_images
        try {
          const { data: timelineImages, error: timelineError } = await supabase
            .from('timeline_item_images')
            .select('id')
            .eq('media_id', mediaAsset.id)
            .limit(1);

          if (!timelineError && timelineImages && timelineImages.length > 0) {
            canDeleteMediaAsset = false;
          }
        } catch (err) {
          // Table might not exist, continue
          console.warn('Could not check timeline_item_images:', err);
        }

        // Check if used in other site_section_images
        if (canDeleteMediaAsset) {
          try {
            const { data: otherSectionImages, error: sectionError } = await supabase
              .from('site_section_images')
              .select('id')
              .eq('media_id', mediaAsset.id)
              .limit(1);

            if (!sectionError && otherSectionImages && otherSectionImages.length > 0) {
              canDeleteMediaAsset = false;
            }
          } catch (err) {
            console.warn('Could not check other site_section_images:', err);
          }
        }

        // 3. Delete file from storage
        if (mediaAsset?.bucket && mediaAsset?.path) {
          const { error: storageError } = await supabase.storage
            .from(mediaAsset.bucket)
            .remove([mediaAsset.path]);

          if (storageError) {
            console.warn('Error deleting file from storage:', storageError);
          }
        }

        // 4. Delete from media_assets only if not used elsewhere
        if (canDeleteMediaAsset) {
          const { error: mediaError } = await supabase
            .from('media_assets')
            .delete()
            .eq('id', mediaAsset.id);

          if (mediaError) {
            // If deletion fails due to foreign key, just log it - the file is already deleted from storage
            console.warn('Could not delete media_asset (may be referenced elsewhere):', mediaError);
          }
        } else {
          console.log('Media asset is used elsewhere, keeping media_assets record');
        }
      }

      backgroundImage.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete background image';
      console.error('Error deleting background image:', err);
      throw err;
    } finally {
      backgroundImageLoading.value = false;
    }
  }

  return {
    installations,
    loading,
    error,
    activeInstallations,
    backgroundImage,
    backgroundImageLoading,
    fetchInstallations,
    createInstallation,
    updateInstallation,
    deleteInstallation,
    uploadInstallationImages,
    deleteInstallationImage,
    fetchBackgroundImage,
    uploadBackgroundImage,
    deleteBackgroundImage,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useInstallationStore, import.meta.hot));
}


