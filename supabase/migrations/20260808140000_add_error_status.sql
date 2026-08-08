-- Add 'error' status to claims check constraint
ALTER TABLE public.claims
  DROP CONSTRAINT IF EXISTS claims_status_check;

ALTER TABLE public.claims
  ADD CONSTRAINT claims_status_check
  CHECK (status IN ('confirmed', 'stale', 'unverifiable', 'pending', 'error'));
