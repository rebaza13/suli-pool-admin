import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from 'src/boot/supabase';

// ============================================
// Types
// ============================================

export interface MediaAsset {
  id: number;
  bucket: string;
  path: string;
  alt: string | null;
  created_at: string;
}

export interface AboutSection {
  id: string;
  key: string;
  is_enabled: boolean;
  created_at: string;
}

export interface AboutSectionTranslation {
  id: string;
  about_section_id: string;
  locale: string;
  eyebrow_text: string | null;
  section_title: string | null;
  section_subtitle: string | null;
  description: string | null;
  card_title: string | null;
  card_title_highlight: string | null;
  card_description: string | null;
  cta_label: string | null;
  cta_href: string | null;
}

export interface AboutSectionImage {
  id: string;
  about_section_id: string;
  media_asset_id: number;
  sort_order: number;
  created_at: string;
  media_asset?: MediaAsset;
}

export interface AboutSectionFull extends AboutSection {
  translations: AboutSectionTranslation[];
  images: AboutSectionImage[];
}

export interface AboutSectionFormData {
  key: string;
  is_enabled: boolean;
  translations: Array<Omit<AboutSectionTranslation, 'id' | 'about_section_id'>>;
  image_files?: File[];
  existing_images?: AboutSectionImage[];
}

// ============================================
// Store
// ============================================

export const useAboutStore = defineStore('about', () => {
  const sections = ref<AboutSectionFull[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const activeSections = computed(() => sections.value.filter((s) => s.is_enabled));

  async function fetchAboutSections() {
    loading.value = true;
    error.value = null;
    try {
      const { data: base, error: baseError } = await supabase
        .from('about_section')
        .select('*')
        .order('created_at', { ascending: false });
      if (baseError) throw baseError;

      const { data: translations, error: translationsError } = await supabase
        .from('about_section_translations')
        .select('*');
      if (translationsError) throw translationsError;

      const { data: images, error: imagesError } = await supabase
        .from('about_section_images')
        .select(`
          *,
          media_asset:media_assets!about_section_images_media_asset_id_fkey(*)
        `)
        .order('sort_order', { ascending: true });
      if (imagesError) throw imagesError;

      sections.value = (base || []).map((row) => ({
        ...row,
        translations: (translations || []).filter((t) => t.about_section_id === row.id),
        images: (images || [])
          .filter((img) => img.about_section_id === row.id)
          .map((img) => ({ ...img, media_asset: img.media_asset as MediaAsset }))
          .sort((a, b) => a.sort_order - b.sort_order),
      })) as AboutSectionFull[];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch about section';
      console.error('Error fetching about section:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createAboutSection(formData: AboutSectionFormData) {
    loading.value = true;
    error.value = null;

    try {
      // Check if a section already exists - prevent multiple records
      if (sections.value.length > 0) {
        throw new Error('About section already exists. Only one section is allowed. Please update the existing section instead.');
      }

      const { data: section, error: insertError } = await supabase
        .from('about_section')
        .insert({
          key: formData.key,
          is_enabled: formData.is_enabled,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      if (!section) throw new Error('Failed to create about section');

      const aboutSectionId = section.id as string;

      if (formData.translations?.length) {
        const rows = formData.translations.map((t) => ({
          about_section_id: aboutSectionId,
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
        }));

        const { error: translationsError } = await supabase
          .from('about_section_translations')
          .insert(rows);
        if (translationsError) throw translationsError;
      }

      if (formData.image_files?.length) {
        await uploadAboutImages(aboutSectionId, formData.image_files, 0);
      }

      await fetchAboutSections();
      return section;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create about section';
      console.error('Error creating about section:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateAboutSection(id: string, formData: Partial<AboutSectionFormData>) {
    loading.value = true;
    error.value = null;

    try {
      const updateData: Partial<AboutSection> = {};
      if (formData.key !== undefined) updateData.key = formData.key;
      if (formData.is_enabled !== undefined) updateData.is_enabled = formData.is_enabled;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('about_section')
          .update(updateData)
          .eq('id', id);
        if (updateError) throw updateError;
      }

      if (formData.translations) {
        const { error: deleteError } = await supabase
          .from('about_section_translations')
          .delete()
          .eq('about_section_id', id);
        if (deleteError) throw deleteError;

        if (formData.translations.length > 0) {
          const rows = formData.translations.map((t) => ({
            about_section_id: id,
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
          }));

          const { error: insertError } = await supabase
            .from('about_section_translations')
            .insert(rows);
          if (insertError) throw insertError;
        }
      }

      if (formData.image_files?.length) {
        const existingCount = formData.existing_images?.length || 0;
        await uploadAboutImages(id, formData.image_files, existingCount);
      }

      await fetchAboutSections();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update about section';
      console.error('Error updating about section:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteAboutSection(id: string) {
    loading.value = true;
    error.value = null;

    try {
      // delete images first (storage best-effort)
      const section = sections.value.find((s) => s.id === id);
      if (section?.images?.length) {
        for (const img of section.images) {
          await deleteAboutImage(img.id);
        }
      }

      const { error: translationsError } = await supabase
        .from('about_section_translations')
        .delete()
        .eq('about_section_id', id);
      if (translationsError) throw translationsError;

      const { error: deleteError } = await supabase
        .from('about_section')
        .delete()
        .eq('id', id);
      if (deleteError) throw deleteError;

      await fetchAboutSections();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete about section';
      console.error('Error deleting about section:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function uploadAboutImages(aboutSectionId: string, imageFiles: File[], existingCount: number) {
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (!file) continue;

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${aboutSectionId}_${Date.now()}_${i}.${fileExt}`;
      const filePath = `about/${fileName}`;

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
        .from('about_section_images')
        .insert({
          about_section_id: aboutSectionId,
          media_asset_id: (mediaAsset as { id: number }).id,
          sort_order: existingCount + i,
        });
      if (linkError) throw linkError;
    }
  }

  async function deleteAboutImage(imageId: string) {
    // Fetch image link + media asset
    const { data: img, error: fetchError } = await supabase
      .from('about_section_images')
      .select('*, media_asset:media_assets!about_section_images_media_asset_id_fkey(*)')
      .eq('id', imageId)
      .single();
    if (fetchError) throw fetchError;

    const mediaAsset = (img as { media_asset?: MediaAsset }).media_asset;
    if (mediaAsset?.bucket && mediaAsset?.path) {
      const { error: storageError } = await supabase.storage
        .from(mediaAsset.bucket)
        .remove([mediaAsset.path]);
      if (storageError) console.warn('Error deleting file from storage:', storageError);
    }

    if (mediaAsset?.id) {
      const { error: mediaDeleteError } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', mediaAsset.id);
      if (mediaDeleteError) throw mediaDeleteError;
    }

    const { error: linkDeleteError } = await supabase
      .from('about_section_images')
      .delete()
      .eq('id', imageId);
    if (linkDeleteError) throw linkDeleteError;

    await fetchAboutSections();
  }

  return {
    sections,
    loading,
    error,
    activeSections,
    fetchAboutSections,
    createAboutSection,
    updateAboutSection,
    deleteAboutSection,
    uploadAboutImages,
    deleteAboutImage,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAboutStore, import.meta.hot));
}


