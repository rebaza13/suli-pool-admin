import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from 'src/boot/supabase';
import { compressImages } from 'src/composables/useImageCompression';

const BASE_TABLE = 'timeline_items';
const TRANSLATIONS_TABLE = 'timeline_item_translations';
const TRANSLATIONS_FK = 'timeline_item_id';
const IMAGES_TABLE = 'timeline_item_images';
const IMAGES_FK = 'timeline_item_id';
// The public site only ever queries timeline_items where section_key = 'history'
// (see suli-pool-front's useProcessStore.ts) — this admin only manages that one section.
const SECTION_KEY = 'history';

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

export interface TimelineEvent {
  id: string;
  sort_order: number;
  is_enabled: boolean;
  year: number;
  section_key: string;
  created_at: string;
}

export interface TimelineImage {
  id: string;
  sort_order: number;
  media_id: number;
  timeline_item_id: string;
  media_asset?: MediaAsset | undefined;
}

export interface TimelineEventTranslation {
  id: string;
  timeline_event_id: string;
  locale: string;
  label: string | null;
  title: string;
  description: string | null;
  created_at: string;
}

export interface TimelineEventFull extends TimelineEvent {
  translations: TimelineEventTranslation[];
  images: TimelineImage[];
}

export interface TimelineEventFormData {
  sort_order: number;
  is_enabled: boolean;
  year: number;
  translations: Array<Omit<TimelineEventTranslation, 'id' | 'timeline_event_id' | 'created_at'>>;
  image_files?: File[];
  existing_images?: TimelineImage[];
}

// ============================================
// Timeline Store
// ============================================

export const useTimelineStore = defineStore('timeline', () => {
  const events = ref<TimelineEventFull[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const activeEvents = computed(() => {
    const active = events.value.filter((e) => e.is_enabled === true);
    return active.sort((a, b) => a.sort_order - b.sort_order);
  });

  async function fetchEvents() {
    loading.value = true;
    error.value = null;

    try {
      const { data: baseEvents, error: eventsError } = await supabase
        .from(BASE_TABLE)
        .select('*')
        .order('sort_order', { ascending: true });

      if (eventsError) throw eventsError;

      const { data: translations, error: translationsError } = await supabase
        .from(TRANSLATIONS_TABLE)
        .select('*');

      if (translationsError) throw translationsError;

      // Fetch images
      const { data: linkRows, error: imagesError } = await supabase
        .from(IMAGES_TABLE)
        .select('*')
        .order('sort_order', { ascending: true });
      if (imagesError) throw imagesError;

      const link = (linkRows || []) as TimelineImage[];
      const mediaIds = Array.from(new Set(link.map((r) => r.media_id).filter((v): v is number => typeof v === 'number')));

      let mediaAssets: MediaAsset[] = [];
      if (mediaIds.length > 0) {
        const { data: assets, error: assetsError } = await supabase
          .from('media_assets')
          .select('*')
          .in('id', mediaIds);
        if (assetsError) throw assetsError;
        mediaAssets = (assets || []) as MediaAsset[];
      }

      const assetMap = new Map<number, MediaAsset>(mediaAssets.map((a) => [a.id, a]));
      const images: TimelineImage[] = link.map((r) => ({
        ...r,
        media_asset: r.media_id ? assetMap.get(r.media_id) : undefined,
      }));

      events.value = (baseEvents || []).map((e) => ({
        ...e,
        translations: (translations || []).filter((t) => (t as Record<string, unknown>)[TRANSLATIONS_FK] === e.id),
        images: images
          .filter((img) => img[IMAGES_FK as keyof TimelineImage] === e.id)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
      })) as TimelineEventFull[];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch timeline events';
      console.error('Error fetching timeline events:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createEvent(formData: TimelineEventFormData) {
    loading.value = true;
    error.value = null;

    try {
      const { data: event, error: eventError } = await supabase
        .from(BASE_TABLE)
        .insert({
          // sort_order is GENERATED ALWAYS - don't include in insert
          is_enabled: formData.is_enabled,
          year: formData.year,
          section_key: SECTION_KEY,
        })
        .select()
        .single();

      if (eventError) throw eventError;
      if (!event) throw new Error('Failed to create timeline event');

      const eventId = event.id as string;

      if (formData.translations && formData.translations.length > 0) {
        const translationsToInsert = formData.translations.map((t) => ({
          [TRANSLATIONS_FK]: eventId,
          locale: t.locale,
          label: t.label || null,
          title: t.title,
          description: t.description || null,
        }));

        const { error: translationsError } = await supabase
          .from(TRANSLATIONS_TABLE)
          .insert(translationsToInsert);

        if (translationsError) throw translationsError;
      }

      // Upload images if provided (optional)
      if (formData.image_files && formData.image_files.length > 0) {
        await uploadEventImages(eventId, formData.image_files, 0);
      }

      await fetchEvents();
      return event;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create timeline event';
      console.error('Error creating timeline event:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateEvent(id: string, formData: Partial<TimelineEventFormData>) {
    loading.value = true;
    error.value = null;

    try {
      const updateData: Partial<TimelineEvent> = {};

      if (formData.is_enabled !== undefined) updateData.is_enabled = formData.is_enabled;
      // sort_order is GENERATED ALWAYS - cannot be updated
      if (formData.year !== undefined) updateData.year = formData.year;

      if (Object.keys(updateData).length > 0) {
        const { error: eventError } = await supabase
          .from(BASE_TABLE)
          .update(updateData)
          .eq('id', id);

        if (eventError) throw eventError;
      }

      if (formData.translations) {
        const { error: deleteError } = await supabase
          .from(TRANSLATIONS_TABLE)
          .delete()
          .eq(TRANSLATIONS_FK, id);

        if (deleteError) throw deleteError;

        if (formData.translations.length > 0) {
          const translationsToInsert = formData.translations.map((t) => ({
            [TRANSLATIONS_FK]: id,
            locale: t.locale,
            label: t.label || null,
            title: t.title,
            description: t.description || null,
          }));

          const { error: insertError } = await supabase
            .from(TRANSLATIONS_TABLE)
            .insert(translationsToInsert);

          if (insertError) throw insertError;
        }
      }

      // Handle new images if provided
      if (formData.image_files && formData.image_files.length > 0) {
        const existingCount = formData.existing_images?.length || 0;
        await uploadEventImages(id, formData.image_files, existingCount);
      }

      await fetchEvents();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update timeline event';
      console.error('Error updating timeline event:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteEvent(id: string) {
    loading.value = true;
    error.value = null;

    try {
      // Delete images first
      const { data: rows, error: rowsError } = await supabase
        .from(IMAGES_TABLE)
        .select('*')
        .eq(IMAGES_FK, id);
      if (rowsError) throw rowsError;

      const links = (rows || []) as Record<string, unknown>[];
      for (const link of links) {
        const linkId = link.id as string | undefined;
        if (linkId) {
          await deleteEventImage(linkId);
        }
      }

      const { error: translationsError } = await supabase
        .from(TRANSLATIONS_TABLE)
        .delete()
        .eq(TRANSLATIONS_FK, id);
      if (translationsError) throw translationsError;

      const { error: eventError } = await supabase
        .from(BASE_TABLE)
        .delete()
        .eq('id', id);
      if (eventError) throw eventError;

      await fetchEvents();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete timeline event';
      console.error('Error deleting timeline event:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function uploadEventImages(eventId: string, imageFiles: File[], existingCount: number) {
    // Compress images before uploading
    const compressedFiles = await compressImages(imageFiles);

    for (let i = 0; i < compressedFiles.length; i++) {
      const file = compressedFiles[i];
      if (!file) continue;

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${eventId}_${Date.now()}_${i}.${fileExt}`;
      const filePath = `timeline/${fileName}`;

      // 1) Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('site-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      // 2) Create media asset
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

      // 3) Link to timeline item
      const insertRow: Record<string, unknown> = {
        [IMAGES_FK]: eventId,
        media_id: (mediaAsset as { id: number }).id,
        sort_order: existingCount + i,
      };

      const { error: linkError } = await supabase.from(IMAGES_TABLE).insert(insertRow);
      if (linkError) throw linkError;
    }
  }

  async function deleteEventImage(imageLinkId: string) {
    // Fetch link row
    const { data: linkRow, error: linkFetchError } = await supabase
      .from(IMAGES_TABLE)
      .select('*')
      .eq('id', imageLinkId)
      .single();
    if (linkFetchError) throw linkFetchError;

    const mediaId = (linkRow as Record<string, unknown>)['media_id'] as number | undefined;
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

    // Delete the link row FIRST (matches every other store's ordering — safe
    // even with an ON DELETE CASCADE FK, and doesn't rely on it)
    const { error: linkDeleteError } = await supabase.from(IMAGES_TABLE).delete().eq('id', imageLinkId);
    if (linkDeleteError) throw linkDeleteError;

    // Delete from storage
    if (mediaAsset?.bucket && mediaAsset?.path) {
      const { error: storageError } = await supabase.storage.from(mediaAsset.bucket).remove([mediaAsset.path]);
      if (storageError) {
        console.warn('Error deleting file from storage:', storageError);
      }
    }

    // Delete media_assets record
    if (mediaAsset?.id) {
      const { error: mediaDeleteError } = await supabase.from('media_assets').delete().eq('id', mediaAsset.id);
      if (mediaDeleteError) throw mediaDeleteError;
    }

    await fetchEvents();
  }

  return {
    events,
    loading,
    error,
    activeEvents,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    uploadEventImages,
    deleteEventImage,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTimelineStore, import.meta.hot));
}


