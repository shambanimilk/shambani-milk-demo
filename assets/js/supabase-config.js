/* Shambani Milk — Supabase connection for the contact form.
 *
 * To activate the form backend:
 *   1. Create a project at https://supabase.com (free tier is fine)
 *   2. Run supabase/migrations/20260910_contact_messages.sql in the project's SQL editor
 *   3. Copy "Project URL" and the "anon public" key from Settings → API
 *   4. Paste them below and redeploy the site
 *
 * The anon key is SAFE to expose on a static site: the migration's row-level
 * security allows anonymous users to INSERT contact messages only — never read,
 * update or delete them. Until both values are filled in, the form falls back
 * to opening the visitor's email app (mailto).
 */
window.SUPABASE_CONFIG = {
  url: "https://sgdxmhitojtwjcxmsppm.supabase.co",
  anonKey: "sb_publishable_sX_hH50tZz1tCqL00aReHQ_QHuUSM94"
};
