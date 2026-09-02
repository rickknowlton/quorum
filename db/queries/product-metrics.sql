-- Weekly product pulse for accountless creation.
-- Postgres is the source of truth. Run against production when you want the numbers.
-- The demo poll is excluded.

SELECT
  count(*) FILTER (WHERE created_anonymous) AS anonymous_creates,
  count(*) FILTER (
    WHERE created_anonymous AND organizer_link_copied_at IS NOT NULL
  ) AS copied_organizer_link,
  count(*) FILTER (
    WHERE created_anonymous AND claimed_at IS NOT NULL
  ) AS claimed,
  count(*) FILTER (
    WHERE created_anonymous AND organizer_link_open_count >= 5
  ) AS likely_shared_private_link
FROM polls
WHERE created_at >= now() - interval '7 days'
  AND public_id <> 'demoBooze01';

SELECT
  round(
    (
      percentile_cont(0.5) WITHIN GROUP (
        ORDER BY extract(epoch FROM (claimed_at - created_at)) / 3600
      )
    )::numeric,
    1
  ) AS median_hours_to_claim
FROM polls
WHERE created_anonymous
  AND claimed_at IS NOT NULL
  AND created_at >= now() - interval '7 days'
  AND public_id <> 'demoBooze01';
