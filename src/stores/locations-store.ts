import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from 'src/boot/supabase';
import { resolveLocationsSchema } from 'src/stores/table-resolver';

// ============================================
// Types
// ============================================

export interface Location {
  id: string;
  phone: string | null;
  email: string | null;
  map_lat: number | null;
  map_lng: number | null;
  map_zoom: number | null;
  is_enabled: boolean;
  created_at: string;
}

export interface LocationTranslation {
  id: string;
  location_id: string;
  locale: string;
  section_title: string | null;
  section_subtitle: string | null;
  phone_label: string | null;
  email_label: string | null;
  address: string | null;
  address_label: string | null;
  working_hours: string | null;
  working_hours_label: string | null;
  marker_title: string | null;
  created_at: string;
}

export interface LocationFull extends Location {
  translations: LocationTranslation[];
}

export interface LocationFormData {
  phone: string | null;
  email: string | null;
  map_lat: number | null;
  map_lng: number | null;
  map_zoom: number | null;
  is_enabled: boolean;
  translations: Array<Omit<LocationTranslation, 'id' | 'location_id' | 'created_at'>>;
}

// ============================================
// Store
// ============================================

export const useLocationsStore = defineStore('locations', () => {
  const locations = ref<LocationFull[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const activeLocations = computed(() => {
    const active = locations.value.filter((l) => l.is_enabled === true);
    // No sort_order in your current schema; keep newest first
    return active.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  });

  async function fetchLocations() {
    loading.value = true;
    error.value = null;
    try {
      const schema = await resolveLocationsSchema();
      const { data: base, error: baseError } = await supabase
        .from(schema.baseTable)
        .select('*')
        .order('created_at', { ascending: false });
      if (baseError) throw baseError;

      const { data: translations, error: translationsError } = await supabase
        .from(schema.translationsTable)
        .select('*');
      if (translationsError) throw translationsError;

      locations.value = (base || []).map((row) => ({
        ...(row as Location),
        translations: (translations || []).filter(
          (t) => (t as Record<string, unknown>)[schema.translationsFkColumn] === (row as Location).id
        ) as LocationTranslation[],
      })) as LocationFull[];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch locations';
      console.error('Error fetching locations:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createLocation(formData: LocationFormData) {
    loading.value = true;
    error.value = null;
    try {
      const schema = await resolveLocationsSchema();
      const { data: location, error: insertError } = await supabase
        .from(schema.baseTable)
        .insert({
          phone: formData.phone ?? null,
          email: formData.email ?? null,
          map_lat: formData.map_lat ?? null,
          map_lng: formData.map_lng ?? null,
          map_zoom: formData.map_zoom ?? null,
          is_enabled: formData.is_enabled,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      if (!location) throw new Error('Failed to create location');

      const locationId = (location as { id: string }).id;

      if (formData.translations?.length) {
        const rows = formData.translations.map((t) => ({
          [schema.translationsFkColumn]: locationId,
          locale: t.locale,
          section_title: t.section_title ?? null,
          section_subtitle: t.section_subtitle ?? null,
          phone_label: t.phone_label ?? null,
          email_label: t.email_label ?? null,
          address: t.address ?? null,
          address_label: t.address_label ?? null,
          working_hours: t.working_hours ?? null,
          working_hours_label: t.working_hours_label ?? null,
          marker_title: t.marker_title ?? null,
        }));
        const { error: translationsError } = await supabase
          .from(schema.translationsTable)
          .insert(rows);
        if (translationsError) throw translationsError;
      }

      await fetchLocations();
      return location;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create location';
      console.error('Error creating location:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateLocation(id: string, formData: Partial<LocationFormData>) {
    loading.value = true;
    error.value = null;
    try {
      const schema = await resolveLocationsSchema();
      const updateData: Partial<Location> = {};
      if (formData.phone !== undefined) updateData.phone = formData.phone;
      if (formData.email !== undefined) updateData.email = formData.email;
      if (formData.map_lat !== undefined) updateData.map_lat = formData.map_lat;
      if (formData.map_lng !== undefined) updateData.map_lng = formData.map_lng;
      if (formData.map_zoom !== undefined) updateData.map_zoom = formData.map_zoom;
      if (formData.is_enabled !== undefined) updateData.is_enabled = formData.is_enabled;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from(schema.baseTable)
          .update(updateData)
          .eq('id', id);
        if (updateError) throw updateError;
      }

      if (formData.translations) {
        const { error: deleteError } = await supabase
          .from(schema.translationsTable)
          .delete()
          .eq(schema.translationsFkColumn, id);
        if (deleteError) throw deleteError;

        if (formData.translations.length > 0) {
          const rows = formData.translations.map((t) => ({
            [schema.translationsFkColumn]: id,
            locale: t.locale,
            section_title: t.section_title ?? null,
            section_subtitle: t.section_subtitle ?? null,
            phone_label: t.phone_label ?? null,
            email_label: t.email_label ?? null,
            address: t.address ?? null,
            address_label: t.address_label ?? null,
            working_hours: t.working_hours ?? null,
            working_hours_label: t.working_hours_label ?? null,
            marker_title: t.marker_title ?? null,
          }));
          const { error: insertError } = await supabase
            .from(schema.translationsTable)
            .insert(rows);
          if (insertError) throw insertError;
        }
      }

      await fetchLocations();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update location';
      console.error('Error updating location:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteLocation(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const schema = await resolveLocationsSchema();
      const { error: translationsError } = await supabase
        .from(schema.translationsTable)
        .delete()
        .eq(schema.translationsFkColumn, id);
      if (translationsError) throw translationsError;

      const { error: deleteError } = await supabase
        .from(schema.baseTable)
        .delete()
        .eq('id', id);
      if (deleteError) throw deleteError;

      await fetchLocations();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete location';
      console.error('Error deleting location:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    locations,
    loading,
    error,
    activeLocations,
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLocationsStore, import.meta.hot));
}


