import { supabase } from 'src/boot/supabase';

export interface MediaAssetRef {
  id: number;
  bucket: string;
  path: string;
}

// Every table that links to media_assets, and the FK column name it uses
// (about_section_images is the one outlier: media_asset_id, not media_id).
// Checked before permanently deleting a media_assets row + its storage
// file, so an image still used by another section is never silently
// broken out from under it.
const IMAGE_LINK_TABLES: Array<{ table: string; column: string }> = [
  { table: 'about_section_images', column: 'media_asset_id' },
  { table: 'hero_slide_images', column: 'media_id' },
  { table: 'installation_images', column: 'media_id' },
  { table: 'timeline_item_images', column: 'media_id' },
  { table: 'site_section_images', column: 'media_id' },
  { table: 'project_images', column: 'media_id' },
];

/**
 * Deletes a media_assets row and its storage file, but only if no
 * *_images link table still references it. Call this AFTER deleting the
 * link row you're cleaning up (so that row doesn't count as "still in use").
 */
export async function deleteMediaAssetIfUnused(asset: MediaAssetRef): Promise<void> {
  for (const { table, column } of IMAGE_LINK_TABLES) {
    const { data, error } = await supabase.from(table).select('id').eq(column, asset.id).limit(1);
    if (error) {
      console.warn(`Could not check ${table} for media_asset ${asset.id}:`, error);
      continue;
    }
    if (data && data.length > 0) {
      console.warn(`media_asset ${asset.id} is still referenced by ${table}, skipping deletion`);
      return;
    }
  }

  if (asset.bucket && asset.path) {
    const { error: storageError } = await supabase.storage.from(asset.bucket).remove([asset.path]);
    if (storageError) console.warn('Error deleting file from storage:', storageError);
  }

  const { error: mediaError } = await supabase.from('media_assets').delete().eq('id', asset.id);
  if (mediaError) console.warn('Could not delete media_asset (may be referenced elsewhere):', mediaError);
}
