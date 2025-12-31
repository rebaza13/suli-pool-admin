import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from 'src/boot/supabase';

// ============================================
// TypeScript Types
// ============================================

export interface SocialMedia {
  id: string; // uuid
  platform: string;
  url: string;
  icon: string | null;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
}

export interface SocialMediaFormData {
  platform: string;
  url: string;
  icon: string | null;
  is_enabled: boolean;
  sort_order: number;
}

// Platform icon mapping
export const PLATFORM_ICONS: Record<string, string> = {
  facebook: 'fab fa-facebook-f',
  instagram: 'fab fa-instagram',
  twitter: 'fab fa-twitter',
  youtube: 'fab fa-youtube',
  linkedin: 'fab fa-linkedin-in',
  tiktok: 'fab fa-tiktok',
  pinterest: 'fab fa-pinterest-p',
  snapchat: 'fab fa-snapchat-ghost',
  whatsapp: 'fab fa-whatsapp',
  telegram: 'fab fa-telegram-plane',
};

// ============================================
// Social Media Store
// ============================================

export const useSocialMediaStore = defineStore('social-media', () => {
  const socialLinks = ref<SocialMedia[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const activeSocialLinks = computed(() => {
    return socialLinks.value
      .filter((s) => s.is_enabled)
      .sort((a, b) => a.sort_order - b.sort_order);
  });

  async function fetchSocialLinks() {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from('social_links')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      socialLinks.value = (data || []) as SocialMedia[];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch social links';
      console.error('Error fetching social links:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createSocialLink(formData: SocialMediaFormData) {
    loading.value = true;
    error.value = null;

    try {
      const { error: insertError } = await supabase
        .from('social_links')
        .insert({
          platform: formData.platform,
          url: formData.url,
          icon: formData.icon || PLATFORM_ICONS[formData.platform.toLowerCase()] || null,
          is_enabled: formData.is_enabled,
          // sort_order is GENERATED ALWAYS - don't include in insert
        });

      if (insertError) throw insertError;
      await fetchSocialLinks();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create social link';
      console.error('Error creating social link:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateSocialLink(id: string, formData: Partial<SocialMediaFormData>) {
    loading.value = true;
    error.value = null;

    try {
      const updateData: Partial<SocialMedia> = {};
      if (formData.platform !== undefined) updateData.platform = formData.platform;
      if (formData.url !== undefined) updateData.url = formData.url;
      if (formData.icon !== undefined) updateData.icon = formData.icon;
      if (formData.is_enabled !== undefined) updateData.is_enabled = formData.is_enabled;
      // sort_order is GENERATED ALWAYS - cannot be updated

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('social_links')
          .update(updateData)
          .eq('id', id);

        if (updateError) throw updateError;
      }

      await fetchSocialLinks();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update social link';
      console.error('Error updating social link:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteSocialLink(id: string) {
    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase
        .from('social_links')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchSocialLinks();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete social link';
      console.error('Error deleting social link:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    socialLinks,
    loading,
    error,
    activeSocialLinks,
    fetchSocialLinks,
    createSocialLink,
    updateSocialLink,
    deleteSocialLink,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSocialMediaStore, import.meta.hot));
}

