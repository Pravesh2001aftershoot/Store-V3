#!/bin/sh
# Regenerates src/gallery/assets/photos/dims.json — pixel sizes of the gallery photos, so the
# store knows each photo's shape up front (crops, print-quality checks). Run after adding photos.
# Uses macOS `sips`.
cd "$(dirname "$0")/../src/gallery/assets/photos" || exit 1
{
  echo "{"
  first=1
  for f in *.jpg *.jpeg *.png *.webp *.avif *.JPG *.JPEG *.PNG *.WEBP; do
    [ -f "$f" ] || continue
    w=$(sips -g pixelWidth "$f" | awk '/pixelWidth/ {print $2}')
    h=$(sips -g pixelHeight "$f" | awk '/pixelHeight/ {print $2}')
    [ $first -eq 1 ] || echo ","
    printf '  "%s": [%s, %s]' "$f" "$w" "$h"
    first=0
  done
  echo
  echo "}"
} > dims.json
echo "Wrote $(grep -c '\[' dims.json) entries to dims.json"
