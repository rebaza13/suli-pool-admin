import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from 'src/boot/supabase';

// ============================================
// TypeScript Types
// ============================================

export interface SiteSection {
  id: number;
  key: string;
  sort_order: number | null;
  is_enabled: boolean | null;
}

export interface SectionTranslation {
  id: number;
  section_id: number | null;
  locale: string | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  cta_label: string | null;
  cta_href: string | null;
  detail: string | null;
  created_at: string;
}

export interface MediaAsset {
  id: number;
  bucket: string;
  path: string;
  alt: string | null;
  created_at: string;
}

export interface SiteSectionImage {
  id: number;
  section_id: number;
  media_id: number;
  sort_order: number;
  created_at: string;
  media_asset?: MediaAsset;
}

export interface SiteSectionFull extends SiteSection {
  translations: SectionTranslation[];
  images: SiteSectionImage[];
}

export interface SiteSectionFormData {
  key: string;
  sort_order: number | null;
  is_enabled: boolean | null;
  translations: Omit<SectionTranslation, 'id' | 'section_id' | 'created_at'>[];
  image_files?: File[];
  existing_images?: SiteSectionImage[];
}

// ============================================
// Site Section Store
// ============================================

export const useSiteSectionStore = defineStore('siteSection', () => {
  // State
  const siteSections = ref<SiteSectionFull[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const activeSiteSections = computed(() => {
    const active = siteSections.value.filter((section) => section.is_enabled === true);
    return active.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  });

  // ============================================
  // Actions - Fetch Operations
  // ============================================

  async function fetchSiteSections() {
    loading.value = true;
    error.value = null;

    try {
      // Fetch site sections
      const { data: sections, error: sectionsError } = await supabase
        .from('site_section')
        .select('*')
        .order('sort_order', { ascending: true });

      if (sectionsError) throw sectionsError;

      // Fetch translations for all sections
      const { data: translations, error: translationsError } = await supabase
        .from('section_translations')
        .select('*');

      if (translationsError) throw translationsError;

      // Fetch images with media assets
      const { data: sectionImages, error: imagesError } = await supabase
        .from('site_section_images')
        .select(`
          *,
          media_asset:media_assets!site_section_images_media_id_fkey(*)
        `)
        .order('sort_order', { ascending: true });

      if (imagesError) throw imagesError;

      // Combine data
      siteSections.value = (sections || []).map((section) => ({
        ...section,
        translations: (translations || []).filter((t) => t.section_id === section.id),
        images: (sectionImages || [])
          .filter((img) => img.section_id === section.id)
          .map((img) => ({
            ...img,
            media_asset: img.media_asset as MediaAsset,
          }))
          .sort((a, b) => a.sort_order - b.sort_order),
      })) as SiteSectionFull[];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch site sections';
      console.error('Error fetching site sections:', err);
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // Actions - Create Operations
  // ============================================

  async function createSiteSection(formData: SiteSectionFormData) {
    loading.value = true;
    error.value = null;

    try {
      // 1. Create site section
      const { data: section, error: sectionError } = await supabase
        .from('site_section')
        .insert({
          key: formData.key,
          // sort_order is GENERATED ALWAYS - don't include in insert
          is_enabled: formData.is_enabled,
        })
        .select()
        .single();

      if (sectionError) {
        console.error('Error creating site section:', sectionError);
        throw sectionError;
      }
      if (!section) throw new Error('Failed to create site section');

      const sectionId = section.id;

      // 2. Create translations
      if (formData.translations && formData.translations.length > 0) {
        const translationsToInsert = formData.translations.map((translation) => ({
          section_id: sectionId,
          locale: translation.locale,
          title: translation.title,
          subtitle: translation.subtitle || null,
          description: translation.description || null,
          cta_label: translation.cta_label || null,
          cta_href: translation.cta_href || null,
          detail: translation.detail || null,
        }));

        const { error: translationsError } = await supabase
          .from('section_translations')
          .insert(translationsToInsert);

        if (translationsError) throw translationsError;
      }

      // 3. Upload images if provided
      if (formData.image_files && formData.image_files.length > 0) {
        await uploadSiteSectionImages(sectionId, formData.image_files, 0);
      }

      // 4. Refresh data
      await fetchSiteSections();

      return section;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create site section';
      console.error('Error creating site section:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // Actions - Update Operations
  // ============================================

  async function updateSiteSection(id: number, formData: Partial<SiteSectionFormData>) {
    loading.value = true;
    error.value = null;

    try {
      // 1. Update site section basic info
      const updateData: Partial<SiteSection> = {};

      if (formData.key !== undefined) {
        updateData.key = formData.key;
      }
      if (formData.is_enabled !== undefined) {
        updateData.is_enabled = formData.is_enabled;
      }
      // sort_order is GENERATED ALWAYS - cannot be updated

      if (Object.keys(updateData).length > 0) {
        const { error: sectionError } = await supabase
          .from('site_section')
          .update(updateData)
          .eq('id', id);

        if (sectionError) {
          console.error('Error updating site section:', sectionError);
          throw sectionError;
        }
      }

      // 2. Update translations (delete and recreate for simplicity)
      if (formData.translations) {
        // Delete existing translations
        const { error: deleteError } = await supabase
          .from('section_translations')
          .delete()
          .eq('section_id', id);

        if (deleteError) throw deleteError;

        // Insert new translations
        if (formData.translations.length > 0) {
          const translationsToInsert = formData.translations.map((translation) => ({
            section_id: id,
            locale: translation.locale,
            title: translation.title,
            subtitle: translation.subtitle || null,
            description: translation.description || null,
            cta_label: translation.cta_label || null,
            cta_href: translation.cta_href || null,
            detail: translation.detail || null,
          }));

          const { error: insertError } = await supabase
            .from('section_translations')
            .insert(translationsToInsert);

          if (insertError) throw insertError;
        }
      }

      // 3. Handle new images if provided
      if (formData.image_files && formData.image_files.length > 0) {
        const existingCount = formData.existing_images?.length || 0;
        await uploadSiteSectionImages(id, formData.image_files, existingCount);
      }

      // 4. Refresh data
      await fetchSiteSections();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update site section';
      console.error('Error updating site section:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // Actions - Delete Operations
  // ============================================

  async function deleteSiteSection(id: number) {
    loading.value = true;
    error.value = null;

    try {
      // Get section images to delete files from storage
      const section = siteSections.value.find((s) => s.id === id);
      if (section && section.images.length > 0) {
        // Delete images from storage
        for (const image of section.images) {
          if (image.media_asset && image.media_asset.bucket && image.media_asset.path) {
            const { error: storageError } = await supabase.storage
              .from(image.media_asset.bucket)
              .remove([image.media_asset.path]);

            if (storageError) {
              console.warn('Error deleting file from storage:', storageError);
              // Don't throw - storage deletion is best effort
            }
          }
        }
      }

      // Delete site section images (cascading deletes should handle this, but we'll do it explicitly)
      const { error: imagesError } = await supabase
        .from('site_section_images')
        .delete()
        .eq('section_id', id);

      if (imagesError) throw imagesError;

      // Delete translations
      const { error: translationsError } = await supabase
        .from('section_translations')
        .delete()
        .eq('section_id', id);

      if (translationsError) throw translationsError;

      // Delete site section
      const { error: sectionError } = await supabase
        .from('site_section')
        .delete()
        .eq('id', id);

      if (sectionError) throw sectionError;

      // Refresh data
      await fetchSiteSections();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete site section';
      console.error('Error deleting site section:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // Actions - Image Management
  // ============================================

  async function uploadSiteSectionImages(sectionId: number, imageFiles: File[], existingCount: number) {
    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        if (!file) continue;

        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `site-section_${sectionId}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `site-sections/${fileName}`;

        // 1. Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('site-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // 2. Create media asset record
        const { data: mediaAsset, error: mediaError } = await supabase
          .from('media_assets')
          .insert({
            bucket: 'site-images',
            path: filePath,
            alt: fileName,
          })
          .select()
          .single();

        if (mediaError) throw mediaError;
        if (!mediaAsset) throw new Error('Failed to create media asset');

        // 3. Link to site section
        const { error: linkError } = await supabase
          .from('site_section_images')
          .insert({
            section_id: sectionId,
            media_id: mediaAsset.id,
            sort_order: existingCount + i,
          });

        if (linkError) throw linkError;
      }

      // Refresh data after uploading
      await fetchSiteSections();
    } catch (err) {
      console.error('Error uploading images:', err);
      throw err;
    }
  }

  async function deleteSiteSectionImage(imageId: number) {
    try {
      // Get image data
      const { data: sectionImage, error: fetchError } = await supabase
        .from('site_section_images')
        .select('*, media_asset:media_assets!site_section_images_media_id_fkey(*)')
        .eq('id', imageId)
        .single();

      if (fetchError) throw fetchError;

      const mediaAsset = sectionImage.media_asset as MediaAsset;

      // Delete from storage using bucket and path
      if (mediaAsset?.bucket && mediaAsset?.path) {
        const { error: storageError } = await supabase.storage
          .from(mediaAsset.bucket)
          .remove([mediaAsset.path]);

        if (storageError) {
          console.warn('Error deleting file from storage:', storageError);
          // Don't throw - storage deletion is best effort
        }
      }

      // Delete media asset record
      if (mediaAsset?.id) {
        const { error: mediaError } = await supabase
          .from('media_assets')
          .delete()
          .eq('id', mediaAsset.id);

        if (mediaError) throw mediaError;
      }

      // Delete site section image link
      const { error: linkError } = await supabase
        .from('site_section_images')
        .delete()
        .eq('id', imageId);

      if (linkError) throw linkError;

      // Refresh data
      await fetchSiteSections();
    } catch (err) {
      console.error('Error deleting image:', err);
      throw err;
    }
  }

  return {
    // State
    siteSections,
    loading,
    error,
    // Getters
    activeSiteSections,
    // Actions
    fetchSiteSections,
    createSiteSection,
    updateSiteSection,
    deleteSiteSection,
    uploadSiteSectionImages,
    deleteSiteSectionImage,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSiteSectionStore, import.meta.hot));
}

