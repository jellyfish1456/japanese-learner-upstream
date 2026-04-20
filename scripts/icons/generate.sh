#!/usr/bin/env bash
# Regenerate PWA/iOS icons from source SVGs.
# Requires: sips (macOS). Rerun after editing scripts/icons/icon*.svg.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
out="$here/../../public"

sips -s format png --resampleHeightWidth 180 180 "$here/icon.svg"          --out "$out/apple-touch-icon-180.png"    >/dev/null
sips -s format png --resampleHeightWidth 192 192 "$here/icon.svg"          --out "$out/pwa-192x192.png"             >/dev/null
sips -s format png --resampleHeightWidth 512 512 "$here/icon.svg"          --out "$out/pwa-512x512.png"             >/dev/null
sips -s format png --resampleHeightWidth 512 512 "$here/icon-maskable.svg" --out "$out/pwa-maskable-512x512.png"    >/dev/null
cp "$here/icon.svg" "$out/favicon.svg"

echo "Icons regenerated in $out"
