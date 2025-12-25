import { supabase } from 'src/boot/supabase';

type TableProbeError = { code?: string; message?: string } | null;

async function tableExists(tableName: string): Promise<boolean> {
  const { error } = await supabase.from(tableName).select('*').limit(1);
  const err = error as TableProbeError;
  if (!err) return true;
  if (err.code === 'PGRST205') return false; // not in schema cache
  // Other errors mean the table likely exists but access/rls/etc failed.
  return true;
}

async function pickFirstExistingTable(names: string[]): Promise<string> {
  for (const name of names) {
    if (await tableExists(name)) return name;
  }
  throw new Error(`Could not find any of these tables in Supabase: ${names.join(', ')}`);
}

export type TranslationSchema = {
  baseTable: string;
  translationsTable: string;
  translationsFkColumn: string;
};

export type ImageLinkSchema = {
  baseTable: string;
  imagesTable: string;
  imagesFkColumn: string;
  mediaIdColumn: string;
  sortColumn: string;
};

export type SimpleImagesSchema = {
  imagesTable: string;
  mediaIdColumn: string;
  sortColumn: string;
};

let cachedTimelineSchema: TranslationSchema | null = null;
let cachedInstallationSchema: TranslationSchema | null = null;
let cachedLocationsSchema: TranslationSchema | null = null;
let cachedTimelineImagesSchema: ImageLinkSchema | null = null;
let cachedInstallationImagesSchema: SimpleImagesSchema | null = null;

export async function resolveTimelineSchema(): Promise<TranslationSchema> {
  if (cachedTimelineSchema) return cachedTimelineSchema;

  // Prefer *_items first to avoid a noisy PGRST205 if the project uses items naming.
  const baseTable = await pickFirstExistingTable(['timeline_items', 'timeline_events', 'timeline']);

  // Prefer matching naming patterns based on the base table
  const candidates =
    baseTable === 'timeline_items'
      ? [
          { table: 'timeline_item_translations', fk: 'timeline_item_id' },
          { table: 'timeline_items_translations', fk: 'timeline_item_id' },
          { table: 'timeline_translations', fk: 'timeline_item_id' },
        ]
      : [
          { table: 'timeline_event_translations', fk: 'timeline_event_id' },
          { table: 'timeline_events_translations', fk: 'timeline_event_id' },
          { table: 'timeline_translations', fk: 'timeline_event_id' },
        ];

  const translationsTable = await pickFirstExistingTable(candidates.map((c) => c.table));
  const fk = candidates.find((c) => c.table === translationsTable)?.fk;
  const translationsFkColumn = fk || (baseTable === 'timeline_items' ? 'timeline_item_id' : 'timeline_event_id');

  cachedTimelineSchema = { baseTable, translationsTable, translationsFkColumn };
  return cachedTimelineSchema;
}

export async function resolveTimelineImagesSchema(): Promise<ImageLinkSchema> {
  if (cachedTimelineImagesSchema) return cachedTimelineImagesSchema;

  const base = await resolveTimelineSchema();
  const baseTable = base.baseTable;

  const imagesTable = await pickFirstExistingTable(
    baseTable === 'timeline_items'
      ? ['timeline_item_images', 'timeline_items_images', 'timeline_images']
      : ['timeline_event_images', 'timeline_events_images', 'timeline_images']
  );

  // We avoid extra column-probe requests here. These are the most common column names.
  // If your schema differs, the API call will fail and we can add a project-specific override later.
  const imagesFkColumn = baseTable === 'timeline_items' ? 'timeline_item_id' : 'timeline_event_id';
  const mediaIdColumn = 'media_id';
  const sortColumn = 'sort_order';

  cachedTimelineImagesSchema = { baseTable, imagesTable, imagesFkColumn, mediaIdColumn, sortColumn };
  return cachedTimelineImagesSchema;
}

export async function resolveInstallationSchema(): Promise<TranslationSchema> {
  if (cachedInstallationSchema) return cachedInstallationSchema;

  // Prefer the real schema first: installations + installation_translations
  const baseTable = await pickFirstExistingTable(['installations', 'installation_steps', 'installation_items', 'installation']);

  const candidates =
    baseTable === 'installations'
      ? [
          { table: 'installation_translations', fk: 'installation_id' },
          { table: 'installations_translations', fk: 'installation_id' },
        ]
      : baseTable === 'installation_items'
        ? [
            { table: 'installation_item_translations', fk: 'installation_item_id' },
            { table: 'installation_items_translations', fk: 'installation_item_id' },
            { table: 'installation_translations', fk: 'installation_item_id' },
          ]
        : [
            { table: 'installation_step_translations', fk: 'installation_step_id' },
            { table: 'installation_steps_translations', fk: 'installation_step_id' },
            { table: 'installation_translations', fk: 'installation_step_id' },
          ];

  const translationsTable = await pickFirstExistingTable(candidates.map((c) => c.table));
  const fk = candidates.find((c) => c.table === translationsTable)?.fk;
  const translationsFkColumn =
    fk ||
    (baseTable === 'installations'
      ? 'installation_id'
      : baseTable === 'installation_items'
        ? 'installation_item_id'
        : 'installation_step_id');

  cachedInstallationSchema = { baseTable, translationsTable, translationsFkColumn };
  return cachedInstallationSchema;
}

export async function resolveInstallationImagesSchema(): Promise<SimpleImagesSchema> {
  if (cachedInstallationImagesSchema) return cachedInstallationImagesSchema;

  // Your project uses installation_images.
  const imagesTable = await pickFirstExistingTable([
    'installation_images',
    'installation_image_items',
    'installation_item_images',
    'installation_step_images',
    'installation_gallery',
  ]);

  // Most projects follow the same pattern as hero/timeline.
  cachedInstallationImagesSchema = {
    imagesTable,
    mediaIdColumn: 'media_id',
    sortColumn: 'sort_order',
  };
  return cachedInstallationImagesSchema;
}

export async function resolveLocationsSchema(): Promise<TranslationSchema> {
  if (cachedLocationsSchema) return cachedLocationsSchema;

  // Support both plural and singular naming
  const baseTable = await pickFirstExistingTable(['locations', 'location']);

  const candidates =
    baseTable === 'locations'
      ? [
          { table: 'location_translations', fk: 'location_id' },
          { table: 'locations_translations', fk: 'location_id' },
          { table: 'location_translation', fk: 'location_id' },
        ]
      : [
          { table: 'location_translations', fk: 'location_id' },
          { table: 'location_translation', fk: 'location_id' },
          { table: 'location_translations', fk: 'location_id' },
        ];

  const translationsTable = await pickFirstExistingTable(candidates.map((c) => c.table));
  const fk = candidates.find((c) => c.table === translationsTable)?.fk;
  const translationsFkColumn = fk || 'location_id';

  cachedLocationsSchema = { baseTable, translationsTable, translationsFkColumn };
  return cachedLocationsSchema;
}


