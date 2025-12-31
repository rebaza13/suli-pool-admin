# Sort Order Fix - GENERATED ALWAYS Identity Column

## Problem
The `sort_order` column in several tables is defined as `GENERATED ALWAYS` (identity column), which means:
- The database automatically generates the value
- You **cannot** insert or update values for this column
- Attempting to do so causes error: `"cannot insert a non-DEFAULT value into column \"sort_order\""`

## Solution Applied

### 1. Removed sort_order from INSERT Operations
Updated all stores to exclude `sort_order` from INSERT operations:
- ✅ `hero-store.ts`
- ✅ `installation-store.ts`
- ✅ `timeline-store.ts`
- ✅ `projects-store.ts`
- ✅ `why-we-different-store.ts`
- ✅ `site-section-store.ts`
- ✅ `social-media-store.ts`

### 2. Removed sort_order from UPDATE Operations
Since `GENERATED ALWAYS` columns cannot be updated, removed from all UPDATE operations in the same stores.

### 3. Removed sort_order Input Fields from Forms
Removed the "Sort Order" input field from all modal forms:
- ✅ HeroPage
- ✅ InstallationPage
- ✅ TimelinePage
- ✅ ProjectsPage
- ✅ WhyWeDifferentPage
- ✅ SiteSectionPage
- ✅ SocialMediaPage

## What Still Works

✅ **Display**: The `sort_order` value is still displayed in cards/badges (read-only)
✅ **Reading**: Form data still reads `sort_order` when editing (for display purposes)
✅ **Auto-generation**: Database automatically assigns `sort_order` when creating new records

## How GENERATED ALWAYS Works

When you create a new record:
```typescript
// ❌ WRONG - This will cause an error
.insert({ sort_order: 0, is_enabled: true })

// ✅ CORRECT - Let database generate it
.insert({ is_enabled: true })
```

The database will automatically assign the next available `sort_order` value.

## Tables Affected

Based on the error, these tables likely have `sort_order` as GENERATED ALWAYS:
- `hero_slides`
- `installation_timeline`
- `timeline_events`
- `projects`
- `why_we_different`
- `site_section`
- `social_links`

## Verification

To verify which tables have GENERATED ALWAYS columns, run this SQL in Supabase:

```sql
SELECT 
  table_name,
  column_name,
  is_identity,
  identity_generation
FROM information_schema.columns
WHERE column_name = 'sort_order'
  AND is_identity = 'YES'
  AND table_schema = 'public';
```

This will show all tables where `sort_order` is an identity column.

