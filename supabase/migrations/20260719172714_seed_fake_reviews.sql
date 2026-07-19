/*
# Seed fake customer reviews across all products

## Purpose
The storefront shows a "Customer reviews" section on each product page, but
most products have zero reviews — making the site look empty and untrusted.
This migration seeds 2-4 realistic, approved fake reviews per product so
every product page shows social proof. Real customers can still write their
own reviews via the existing review form (those inserts are unaffected).

## Approach
- Build a pool of realistic reviewer names + comment templates.
- For each product in `products`, insert 3 reviews cycling through the pool.
- Ratings skew 5-star (~75%) with some 4-star (~25%) for realism.
- `approved = true` so they show immediately.
- `user_id = NULL` (these are seeded, not tied to real auth users).
- `created_at` spread across the last ~120 days so reviews look organic.
- Idempotent: uses a sentinel comment marker (`[seeded]`) and a guard that
  skips products that already have seeded reviews, so re-running is safe.

## Tables touched
- `reviews` (INSERT only; no schema changes, no deletes)

## Notes
1. Real customer-submitted reviews are NOT touched — only inserts.
2. The admin can still hide/delete any review from the admin panel.
3. No RLS changes — existing public SELECT + authenticated/owner INSERT
   policies remain in effect.
*/

DO $$
DECLARE
  p RECORD;
  names text[] := ARRAY[
    'Aisha K.','Marco D.','Sara P.','Rahul M.','Yuki T.','Daniel L.',
    'Priya S.','Omar F.','Lina J.','Carlos R.','Mei W.','Tom H.',
    'Fatima Z.','Arjun V.','Sofia G.','Kenji A.','Nadia R.','Bilal K.',
    'Hannah B.','Diego M.','Rina P.','Alex T.','Jihan S.','Luca B.'
  ];
  comments text[] := ARRAY[
    'Delivery was instant, will buy again!',
    'Best price I found anywhere. Highly recommend.',
    'Smooth transaction, got my code in under a minute.',
    'Works perfectly. Customer support was very helpful.',
    'Trusted seller, have ordered multiple times now.',
    'Cheaper than other sites and delivered fast.',
    'No issues at all, code worked on the first try.',
    'Great service, will recommend to friends.',
    'Fast and reliable. Exactly as described.',
    'Five stars! Process was quick and easy.',
    'Good value for money. Would buy again.',
    'Legit and fast. My go-to store now.',
    'Got my order within seconds. Impressive!',
    'Very happy with the purchase. Smooth experience.',
    'Affordable and instant. What more could I ask?'
  ];
  seed_count int;
  total_inserted int := 0;
  idx int := 0;
  n_len int;
  c_len int;
  rating_val int;
  name_val text;
  comment_val text;
  days_ago int;
BEGIN
  n_len := array_length(names, 1);
  c_len := array_length(comments, 1);

  FOR p IN SELECT id FROM products ORDER BY id LOOP
    SELECT count(*) INTO seed_count
    FROM reviews
    WHERE product_id = p.id
      AND comment LIKE '%[seeded]';

    IF seed_count > 0 THEN
      CONTINUE;
    END IF;

    FOR i IN 1..3 LOOP
      idx := idx + 1;
      name_val := names[((idx - 1) % n_len) + 1];
      comment_val := comments[(((idx + i) - 1) % c_len) + 1];
      rating_val := CASE WHEN (idx + i) % 4 = 0 THEN 4 ELSE 5 END;
      days_ago := ((idx * 7) + (i * 13)) % 120;

      INSERT INTO reviews (product_id, user_id, author_name, rating, comment, approved, created_at)
      VALUES (
        p.id,
        NULL,
        name_val,
        rating_val,
        comment_val || ' [seeded]',
        true,
        now() - (days_ago || ' days')::interval
      );
      total_inserted := total_inserted + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Seeded % fake reviews', total_inserted;
END $$;