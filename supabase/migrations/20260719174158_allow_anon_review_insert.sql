/*
# Allow guest (anon) customers to post reviews

## Purpose
The storefront review form lets customers write a review with their name,
even when they are not logged in. The existing INSERT policy only allowed
`authenticated` users to insert, so guest submissions were silently rejected
by RLS. This migration adds an `anon` INSERT policy so any visitor can post
a review.

## Approach
- Add a new INSERT policy `anon_insert_reviews` scoped to `anon, authenticated`.
- `WITH CHECK (true)` — no ownership check needed (guests have no uid);
  the application layer sets `approved = true` and validates the payload.
- Keep the existing `auth_insert_reviews` policy untouched (it is now
  redundant but harmless; leaving it avoids touching authenticated flow).

## Tables touched
- `reviews` (policy only; no schema change, no data change)

## Notes
1. The application already validates: non-empty comment, rating 1-5,
   author name fallback. Spam moderation can be added later via an
   admin approval toggle if needed.
2. No SELECT/UPDATE/DELETE policy changes — read stays public, edit/delete
   stays owner-only (authenticated).
*/

CREATE POLICY "anon_insert_reviews" ON reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);