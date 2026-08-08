-- Add corrected_fact column to claims table
-- Stores the contradicting fact from sources when a claim is stale

alter table public.claims add column corrected_fact text;
