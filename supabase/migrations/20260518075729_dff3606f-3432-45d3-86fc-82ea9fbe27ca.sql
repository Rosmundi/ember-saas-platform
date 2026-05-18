BEGIN;

ALTER TABLE content_assets
DROP CONSTRAINT IF EXISTS content_assets_type_check;

ALTER TABLE content_assets
ADD CONSTRAINT content_assets_type_check
CHECK (type = ANY (ARRAY[
  'post'::text,
  'improvement'::text,
  'hook'::text,
  'visual_brief'::text,
  'carousel_brief'::text,
  'banner_brief'::text,
  'profile_audit'::text
]));

COMMENT ON CONSTRAINT content_assets_type_check ON content_assets IS
'Allowed asset types — v3.8.4: aggiunto profile_audit per la skill profile-optimizer.';

COMMIT;