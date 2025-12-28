import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from 'src/boot/supabase';

// ============================================
// TypeScript Types
// ============================================

export interface AboutCompany {
  id: string;
  title_en: string;
  title_ku: string | null;
  title_ar: string | null;
  description_en: string;
  description_ku: string | null;
  description_ar: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  position_en: string;
  position_ku: string | null;
  position_ar: string | null;
  image_url: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AboutCompanyFormData {
  title_en: string;
  title_ku: string | null;
  title_ar: string | null;
  description_en: string;
  description_ku: string | null;
  description_ar: string | null;
}

export interface TeamMemberFormData {
  name: string;
  position_en: string;
  position_ku: string | null;
  position_ar: string | null;
  image_url: string | null;
  order_index: number;
  is_active: boolean;
  image_file?: File | undefined;
}

// ============================================
// Company & Team Store
// ============================================

export const useCompanyTeamStore = defineStore('companyTeam', () => {
  // State
  const aboutCompany = ref<AboutCompany | null>(null);
  const teamMembers = ref<TeamMember[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const activeTeamMembers = computed(() => {
    const active = teamMembers.value.filter((member) => member.is_active === true);
    return active.sort((a, b) => a.order_index - b.order_index);
  });

  // ============================================
  // Actions - Fetch Operations
  // ============================================

  async function fetchAboutCompany() {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from('about_company')
        .select('*')
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is OK if no record exists
        throw fetchError;
      }

      aboutCompany.value = data as AboutCompany | null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch about company';
      console.error('Error fetching about company:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchTeamMembers() {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from('team_members')
        .select('*')
        .order('order_index', { ascending: true });

      if (fetchError) throw fetchError;

      teamMembers.value = (data || []) as TeamMember[];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch team members';
      console.error('Error fetching team members:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchAll() {
    loading.value = true;
    await Promise.all([fetchAboutCompany(), fetchTeamMembers()]);
    loading.value = false;
  }

  // ============================================
  // Actions - About Company Operations
  // ============================================

  async function createOrUpdateAboutCompany(formData: AboutCompanyFormData) {
    loading.value = true;
    error.value = null;

    try {
      // Check if record exists
      const existing = aboutCompany.value;

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('about_company')
          .update({
            title_en: formData.title_en,
            title_ku: formData.title_ku,
            title_ar: formData.title_ar,
            description_en: formData.description_en,
            description_ku: formData.description_ku,
            description_ar: formData.description_ar,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('about_company')
          .insert({
            title_en: formData.title_en,
            title_ku: formData.title_ku,
            title_ar: formData.title_ar,
            description_en: formData.description_en,
            description_ku: formData.description_ku,
            description_ar: formData.description_ar,
          });

        if (insertError) throw insertError;
      }

      await fetchAboutCompany();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save about company';
      console.error('Error saving about company:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // Actions - Team Member Operations
  // ============================================

  async function createTeamMember(formData: Partial<TeamMemberFormData & { image_file?: File }>) {
    loading.value = true;
    error.value = null;

    try {
      // Upload image if provided
      let imageUrl = formData.image_url || null;
      if (formData.image_file) {
        const fileExt = formData.image_file.name.split('.').pop() || 'jpg';
        const fileName = `team-member_${Date.now()}.${fileExt}`;
        const filePath = `team-members/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('site-images')
          .upload(filePath, formData.image_file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = supabase.storage.from('site-images').getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }

      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          name: formData.name!,
          position_en: formData.position_en!,
          position_ku: formData.position_ku || null,
          position_ar: formData.position_ar || null,
          image_url: imageUrl,
          order_index: formData.order_index ?? 0,
          is_active: formData.is_active ?? true,
        });

      if (insertError) throw insertError;

      await fetchTeamMembers();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create team member';
      console.error('Error creating team member:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateTeamMember(id: string, formData: Partial<TeamMemberFormData & { image_file?: File }>) {
    loading.value = true;
    error.value = null;

    try {
      const updateData: Partial<TeamMember> = {};

      if (formData.name !== undefined) updateData.name = formData.name;
      if (formData.position_en !== undefined) updateData.position_en = formData.position_en;
      if (formData.position_ku !== undefined) updateData.position_ku = formData.position_ku;
      if (formData.position_ar !== undefined) updateData.position_ar = formData.position_ar;
      if (formData.order_index !== undefined) updateData.order_index = formData.order_index;
      if (formData.is_active !== undefined) updateData.is_active = formData.is_active;

      // Handle image upload
      if (formData.image_file) {
        // Delete old image if exists
        const member = teamMembers.value.find((m) => m.id === id);
        if (member?.image_url) {
          try {
            // Extract path from Supabase public URL
            // URL format: https://...supabase.co/storage/v1/object/public/site-images/team-members/...
            const urlParts = member.image_url.split('/');
            const publicIndex = urlParts.indexOf('public');
            if (publicIndex !== -1 && urlParts.length > publicIndex + 2) {
              const filePath = urlParts.slice(publicIndex + 2).join('/');
              await supabase.storage.from('site-images').remove([filePath]);
            }
          } catch {
            // Ignore deletion errors
          }
        }

        // Upload new image
        const fileExt = formData.image_file.name.split('.').pop() || 'jpg';
        const fileName = `team-member_${id}_${Date.now()}.${fileExt}`;
        const filePath = `team-members/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('site-images')
          .upload(filePath, formData.image_file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('site-images').getPublicUrl(filePath);
        updateData.image_url = data.publicUrl;
      } else if (formData.image_url !== undefined) {
        updateData.image_url = formData.image_url;
      }

      updateData.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchTeamMembers();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update team member';
      console.error('Error updating team member:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteTeamMember(id: string) {
    loading.value = true;
    error.value = null;

    try {
      // Delete image from storage if exists
      const member = teamMembers.value.find((m) => m.id === id);
      if (member?.image_url) {
        try {
          // Extract path from Supabase public URL
          const urlParts = member.image_url.split('/');
          const publicIndex = urlParts.indexOf('public');
          if (publicIndex !== -1 && urlParts.length > publicIndex + 2) {
            const filePath = urlParts.slice(publicIndex + 2).join('/');
            await supabase.storage.from('site-images').remove([filePath]);
          }
        } catch {
          // Ignore deletion errors
        }
      }

      const { error: deleteError } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchTeamMembers();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete team member';
      console.error('Error deleting team member:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    aboutCompany,
    teamMembers,
    loading,
    error,
    // Getters
    activeTeamMembers,
    // Actions
    fetchAboutCompany,
    fetchTeamMembers,
    fetchAll,
    createOrUpdateAboutCompany,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCompanyTeamStore, import.meta.hot));
}

