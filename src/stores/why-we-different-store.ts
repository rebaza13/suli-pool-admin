import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from 'src/boot/supabase';

// ============================================
// TypeScript Types
// ============================================

export interface WhyWeDifferent {
  id: string;
  sort_order: number;
  icon: string | null;
  is_enabled: boolean;
  created_at: string;
}

export interface WhyWeDifferentTranslation {
  id: string;
  why_we_different_id: string;
  locale: string;
  title: string;
  description: string | null;
}

export interface WhyWeDifferentFull extends WhyWeDifferent {
  translations: WhyWeDifferentTranslation[];
}

export interface WhyWeDifferentFormData {
  sort_order: number;
  icon: string | null;
  is_enabled: boolean;
  translations: Array<Omit<WhyWeDifferentTranslation, 'id' | 'why_we_different_id'>>;
}

// ============================================
// Store
// ============================================

export const useWhyWeDifferentStore = defineStore('why-we-different', () => {
  const items = ref<WhyWeDifferentFull[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const activeItems = computed(() => {
    const active = items.value.filter((i) => i.is_enabled === true);
    return active.sort((a, b) => a.sort_order - b.sort_order);
  });

  async function fetchItems() {
    loading.value = true;
    error.value = null;
    try {
      const { data: base, error: baseError } = await supabase
        .from('why_we_different')
        .select('*')
        .order('sort_order', { ascending: true });
      if (baseError) throw baseError;

      const { data: translations, error: translationsError } = await supabase
        .from('why_we_different_translations')
        .select('*');
      if (translationsError) throw translationsError;

      items.value = (base || []).map((row) => ({
        ...row,
        translations: (translations || []).filter((t) => t.why_we_different_id === row.id),
      })) as WhyWeDifferentFull[];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch why we different items';
      console.error('Error fetching why_we_different:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createItem(formData: WhyWeDifferentFormData) {
    loading.value = true;
    error.value = null;

    try {
      const { data: created, error: insertError } = await supabase
        .from('why_we_different')
        .insert({
          // sort_order is GENERATED ALWAYS - don't include in insert
          icon: formData.icon || null,
          is_enabled: formData.is_enabled,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      if (!created) throw new Error('Failed to create item');

      const id = created.id as string;
      if (formData.translations.length > 0) {
        const rows = formData.translations.map((t) => ({
          why_we_different_id: id,
          locale: t.locale,
          title: t.title,
          description: t.description || null,
        }));

        const { error: translationsError } = await supabase
          .from('why_we_different_translations')
          .insert(rows);
        if (translationsError) throw translationsError;
      }

      await fetchItems();
      return created;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create item';
      console.error('Error creating why_we_different:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateItem(id: string, formData: Partial<WhyWeDifferentFormData>) {
    loading.value = true;
    error.value = null;

    try {
      const updateData: Partial<WhyWeDifferent> = {};
      // sort_order is GENERATED ALWAYS - cannot be updated
      if (formData.icon !== undefined) updateData.icon = formData.icon || null;
      if (formData.is_enabled !== undefined) updateData.is_enabled = formData.is_enabled;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('why_we_different')
          .update(updateData)
          .eq('id', id);
        if (updateError) throw updateError;
      }

      if (formData.translations) {
        const { error: deleteError } = await supabase
          .from('why_we_different_translations')
          .delete()
          .eq('why_we_different_id', id);
        if (deleteError) throw deleteError;

        if (formData.translations.length > 0) {
          const rows = formData.translations.map((t) => ({
            why_we_different_id: id,
            locale: t.locale,
            title: t.title,
            description: t.description || null,
          }));
          const { error: insertError } = await supabase
            .from('why_we_different_translations')
            .insert(rows);
          if (insertError) throw insertError;
        }
      }

      await fetchItems();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update item';
      console.error('Error updating why_we_different:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteItem(id: string) {
    loading.value = true;
    error.value = null;

    try {
      const { error: deleteTranslationsError } = await supabase
        .from('why_we_different_translations')
        .delete()
        .eq('why_we_different_id', id);
      if (deleteTranslationsError) throw deleteTranslationsError;

      const { error: deleteError } = await supabase
        .from('why_we_different')
        .delete()
        .eq('id', id);
      if (deleteError) throw deleteError;

      await fetchItems();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete item';
      console.error('Error deleting why_we_different:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    items,
    loading,
    error,
    activeItems,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWhyWeDifferentStore, import.meta.hot));
}


