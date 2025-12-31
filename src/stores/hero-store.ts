import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from 'src/boot/supabase';

// ============================================
// TypeScript Types
// ============================================

export interface HeroSlide {
  id: string;
  sort_order: number;
  is_enabled: boolean;
  created_at: string;
}

export interface HeroSlideTranslation {
  id: string;
  hero_slide_id: string;
  locale: string;
  title: string;
  subtitle: string | null;
  sample_text: string | null;
  button_text: string | null;
}

export interface MediaAsset {
  id: number;
  bucket: string;
  path: string;
  alt: string | null;
  created_at: string;
}

export interface HeroSlideImage {
  id: string;
  hero_slide_id: string;
  media_id: number;
  sort_order: number;
  media_asset?: MediaAsset;
}

export interface HeroSlideFull extends HeroSlide {
  translations: HeroSlideTranslation[];
  images: HeroSlideImage[];
}

export interface HeroSlideFormData {
  sort_order: number;
  is_enabled: boolean;
  translations: Omit<HeroSlideTranslation, 'id' | 'hero_slide_id'>[];
  image_files?: File[];
  existing_images?: HeroSlideImage[];
}

// ============================================
// Hero Store
// ============================================

export const useHeroStore = defineStore('hero', () => {
  // State
  const heroSlides = ref<HeroSlideFull[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const activeHeroSlides = computed(() => {
    const active = heroSlides.value.filter((slide) => slide.is_enabled === true);
    return active.sort((a, b) => a.sort_order - b.sort_order);
  });

  // ============================================
  // Actions - Fetch Operations
  // ============================================

  async function fetchHeroSlides() {
    loading.value = true;
    error.value = null;

    try {
      // Fetch hero slides with translations and images
      const { data: slides, error: slidesError } = await supabase
        .from('hero_slides')
        .select('*')
        .order('sort_order', { ascending: true });

      if (slidesError) throw slidesError;

      // Fetch translations for all slides
      const { data: translations, error: translationsError } = await supabase
        .from('hero_slide_translations')
        .select('*');

      if (translationsError) throw translationsError;

      // Fetch images with media assets
      const { data: slideImages, error: imagesError } = await supabase
        .from('hero_slide_images')
        .select(`
          *,
          media_asset:media_assets!hero_slide_images_media_id_fkey(*)
        `)
        .order('sort_order', { ascending: true });

      if (imagesError) throw imagesError;

      // Combine data
      heroSlides.value = (slides || []).map((slide) => ({
        ...slide,
        translations: (translations || []).filter((t) => t.hero_slide_id === slide.id),
        images: (slideImages || [])
          .filter((img) => img.hero_slide_id === slide.id)
          .map((img) => ({
            ...img,
            media_asset: img.media_asset as MediaAsset,
          }))
          .sort((a, b) => a.sort_order - b.sort_order),
      })) as HeroSlideFull[];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch hero slides';
      console.error('Error fetching hero slides:', err);
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // Actions - Create Operations
  // ============================================

  async function createHeroSlide(formData: HeroSlideFormData) {
    loading.value = true;
    error.value = null;

    try {
      // 1. Create hero slide
      const { data: slide, error: slideError } = await supabase
        .from('hero_slides')
        .insert({
          // sort_order is GENERATED ALWAYS - don't include in insert
          is_enabled: formData.is_enabled,
        })
        .select()
        .single();

      if (slideError) {
        console.error('Error creating hero slide:', slideError);
        throw slideError;
      }
      if (!slide) throw new Error('Failed to create hero slide');

      const heroSlideId = slide.id;

      // 2. Create translations
      if (formData.translations && formData.translations.length > 0) {
        const translationsToInsert = formData.translations.map((translation) => ({
          hero_slide_id: heroSlideId,
          locale: translation.locale,
          title: translation.title,
          subtitle: translation.subtitle || null,
          sample_text: translation.sample_text || null,
          button_text: translation.button_text || null,
        }));

        const { error: translationsError } = await supabase
          .from('hero_slide_translations')
          .insert(translationsToInsert);

        if (translationsError) throw translationsError;
      }

      // 3. Upload images if provided
      if (formData.image_files && formData.image_files.length > 0) {
        await uploadHeroSlideImages(heroSlideId, formData.image_files);
      }

      // 4. Refresh data
      await fetchHeroSlides();

      return slide;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create hero slide';
      console.error('Error creating hero slide:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // Actions - Update Operations
  // ============================================

  async function updateHeroSlide(id: string, formData: Partial<HeroSlideFormData>) {
    loading.value = true;
    error.value = null;

    try {
      // 1. Update hero slide basic info
      const updateData: Partial<HeroSlide> = {};
      
      if (formData.is_enabled !== undefined) {
        updateData.is_enabled = formData.is_enabled;
      }
      
      // sort_order is GENERATED ALWAYS - cannot be updated

      if (Object.keys(updateData).length > 0) {
        const { error: slideError } = await supabase
          .from('hero_slides')
          .update(updateData)
          .eq('id', id);

        if (slideError) {
          console.error('Error updating hero slide:', slideError);
          throw slideError;
        }
      }

      // 2. Update translations (delete and recreate for simplicity)
      if (formData.translations) {
        // Delete existing translations
        const { error: deleteError } = await supabase
          .from('hero_slide_translations')
          .delete()
          .eq('hero_slide_id', id);

        if (deleteError) throw deleteError;

        // Insert new translations
        if (formData.translations.length > 0) {
          const translationsToInsert = formData.translations.map((translation) => ({
            hero_slide_id: id,
            locale: translation.locale,
            title: translation.title,
            subtitle: translation.subtitle || null,
            sample_text: translation.sample_text || null,
            button_text: translation.button_text || null,
          }));

          const { error: insertError } = await supabase
            .from('hero_slide_translations')
            .insert(translationsToInsert);

          if (insertError) throw insertError;
        }
      }

      // 3. Handle new images if provided
      if (formData.image_files && formData.image_files.length > 0) {
        await uploadHeroSlideImages(id, formData.image_files);
      }

      // 4. Refresh data
      await fetchHeroSlides();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update hero slide';
      console.error('Error updating hero slide:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // Actions - Delete Operations
  // ============================================

  async function deleteHeroSlide(id: string) {
    loading.value = true;
    error.value = null;

    try {
      // Get slide images to delete files from storage
      const slide = heroSlides.value.find((s) => s.id === id);
      if (slide && slide.images.length > 0) {
        // Delete images from storage
        for (const image of slide.images) {
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

      // Delete hero slide (cascading deletes should handle translations and images)
      // But we'll do it explicitly to be sure
      const { error: imagesError } = await supabase
        .from('hero_slide_images')
        .delete()
        .eq('hero_slide_id', id);

      if (imagesError) throw imagesError;

      const { error: translationsError } = await supabase
        .from('hero_slide_translations')
        .delete()
        .eq('hero_slide_id', id);

      if (translationsError) throw translationsError;

      const { error: slideError } = await supabase
        .from('hero_slides')
        .delete()
        .eq('id', id);

      if (slideError) throw slideError;

      // Refresh data
      await fetchHeroSlides();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete hero slide';
      console.error('Error deleting hero slide:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }


  // ============================================
  // Actions - Image Management
  // ============================================

  async function uploadHeroSlideImages(heroSlideId: string, imageFiles: File[]) {
    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        if (!file) continue;

        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${heroSlideId}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `hero/${fileName}`;

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

        // 3. Link to hero slide using the correct column name: media_id (NOT media_asset_id)
        const { error: linkError } = await supabase
          .from('hero_slide_images')
          .insert({
            hero_slide_id: heroSlideId,
            media_id: mediaAsset.id,
            sort_order: i,
          });

        if (linkError) throw linkError;
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      throw err;
    }
  }

  async function deleteHeroSlideImage(imageId: string) {
    try {
      // Get image data
      const { data: slideImage, error: fetchError } = await supabase
        .from('hero_slide_images')
        .select('*, media_asset:media_assets(*)')
        .eq('id', imageId)
        .single();

      if (fetchError) throw fetchError;

      const mediaAsset = slideImage.media_asset as MediaAsset;

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

      // Delete hero slide image link
      const { error: linkError } = await supabase
        .from('hero_slide_images')
        .delete()
        .eq('id', imageId);

      if (linkError) throw linkError;

      // Refresh data
      await fetchHeroSlides();
    } catch (err) {
      console.error('Error deleting image:', err);
      throw err;
    }
  }


  return {
    // State
    heroSlides,
    loading,
    error,
    // Getters
    activeHeroSlides,
    // Actions
    fetchHeroSlides,
    createHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
    uploadHeroSlideImages,
    deleteHeroSlideImage,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useHeroStore, import.meta.hot));
}

