import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from 'src/boot/supabase';

// ============================================
// Types
// ============================================

export interface CompanyStatistic {
  id: string;
  label_en: string | null;
  label_ku: string | null;
  label_ar: string | null;
  value: number | null;
  icon: string | null;
  order_index: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface CompanyStatisticFormData {
  label_en: string | null;
  label_ku: string | null;
  label_ar: string | null;
  value: number | null;
  icon: string | null;
  order_index: number | null;
}

export const useCompanyStatisticsStore = defineStore('company-statistics', () => {
  const stats = ref<CompanyStatistic[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const orderedStats = computed(() => {
    return [...stats.value].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  });

  async function fetchStats() {
    loading.value = true;
    error.value = null;
    try {
      const { data, error: fetchError } = await supabase
        .from('company_statistics')
        .select('*')
        .order('order_index', { ascending: true });
      if (fetchError) throw fetchError;
      stats.value = (data || []) as CompanyStatistic[];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch company statistics';
      console.error('Error fetching company_statistics:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createStat(formData: CompanyStatisticFormData) {
    loading.value = true;
    error.value = null;
    try {
      const { data, error: insertError } = await supabase
        .from('company_statistics')
        .insert({
          label_en: formData.label_en ?? null,
          label_ku: formData.label_ku ?? null,
          label_ar: formData.label_ar ?? null,
          value: formData.value ?? null,
          icon: formData.icon ?? null,
          order_index: formData.order_index ?? null,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      await fetchStats();
      return data as CompanyStatistic;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create statistic';
      console.error('Error creating company_statistics:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateStat(id: string, formData: Partial<CompanyStatisticFormData>) {
    loading.value = true;
    error.value = null;
    try {
      const updateData: Record<string, unknown> = {};
      if (formData.label_en !== undefined) updateData.label_en = formData.label_en ?? null;
      if (formData.label_ku !== undefined) updateData.label_ku = formData.label_ku ?? null;
      if (formData.label_ar !== undefined) updateData.label_ar = formData.label_ar ?? null;
      if (formData.value !== undefined) updateData.value = formData.value ?? null;
      if (formData.icon !== undefined) updateData.icon = formData.icon ?? null;
      if (formData.order_index !== undefined) updateData.order_index = formData.order_index ?? null;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('company_statistics')
          .update(updateData)
          .eq('id', id);
        if (updateError) throw updateError;
      }

      await fetchStats();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update statistic';
      console.error('Error updating company_statistics:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteStat(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const { error: deleteError } = await supabase.from('company_statistics').delete().eq('id', id);
      if (deleteError) throw deleteError;
      await fetchStats();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete statistic';
      console.error('Error deleting company_statistics:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    stats,
    orderedStats,
    loading,
    error,
    fetchStats,
    createStat,
    updateStat,
    deleteStat,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCompanyStatisticsStore, import.meta.hot));
}


