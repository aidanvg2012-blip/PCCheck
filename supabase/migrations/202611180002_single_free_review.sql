-- Transition the earlier three-plan beta allowance to one new full review.
-- Run once after 202611180001_build_finder_trials.sql.
-- Existing beta trial counts are reset so every account receives the new one-time review.
update public.build_finder_trials
set used_count = 0,
    updated_at = now();
