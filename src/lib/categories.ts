/**
 * @fileoverview Shared Supabase filters for expense categories.
 * Default categories (`is_default`, often `user_id` null) must be included alongside user-owned rows.
 *
 * Use with a **string-literal** `.select(...)` at each call site so Supabase types infer correctly.
 *
 * @module lib/categories
 */

/**
 * PostgREST `.or()` filter: shared defaults visible to all users, plus this user's custom categories.
 */
export function categoriesForUserOrFilter(userId: string): string {
  return `is_default.eq.true,user_id.eq.${userId}`
}

/** True if the category is a shared default (not editable/deletable by users). */
export function isReadOnlyCategory(category: {
  is_default: boolean
}): boolean {
  return category.is_default === true
}
