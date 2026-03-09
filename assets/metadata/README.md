# MonoPay Metadata Assets

This folder holds the versioned ID-card metadata template used by the sandbox Metaplex flow.

## Files

- `monopay-id-card-v1.json`: Metadata JSON for the `v1` MonoPay identity card asset.
- `images/`: Place your branded card cover image here before upload.

## Publish to Supabase Storage

1. In Supabase, create a public bucket named `monopay-assets`.
2. Upload:
   - `assets/metadata/monopay-id-card-v1.json` to `metadata/monopay-id-card-v1.json`
   - your image to `images/monopay-id-card-cover-v1.png`
3. Confirm these public URLs load in the browser:
   - `https://rgpduszdifmvojvdyaad.supabase.co/storage/v1/object/public/monopay-assets/metadata/monopay-id-card-v1.json`
   - `https://rgpduszdifmvojvdyaad.supabase.co/storage/v1/object/public/monopay-assets/images/monopay-id-card-cover-v1.png`

## Versioning

- Keep old files immutable.
- Publish changes as new version files (`monopay-id-card-v2.json`, etc).
- Update `EXPO_PUBLIC_MONOPAY_IDCARD_METADATA_URI` to the new version only when you intentionally roll metadata.
