#!/bin/sh
# Builds the portfolio's web-sized photos from a folder of genre sub-folders:
#
#   <source>/Wedding/*.jpg   →  src/portfolio/assets/work/wedding/*.jpg
#   <source>/Couple/*.gif    →  src/portfolio/assets/work/couple/*.jpg   (first frame)
#
# Every image is resized to 1000px on the long edge (JPEG, q72) and its size written to
# src/portfolio/assets/work/dims.json, so the grid knows each photo's shape up front.
# Each sub-folder becomes a genre. Uses macOS `sips`.
#
#   npm run portfolio:photos                       # default source: ~/Desktop/Work Portfolio
#   npm run portfolio:photos -- "/path/to/folder"

SRC="${1:-$HOME/Desktop/Work Portfolio}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/src/portfolio/assets/work"
[ -d "$SRC" ] || { echo "Source folder not found: $SRC"; exit 1; }

rm -rf "$OUT"
mkdir -p "$OUT"

for dir in "$SRC"/*/; do
  genre=$(basename "$dir" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
  mkdir -p "$OUT/$genre"
  for f in "$dir"*; do
    case "$f" in *.jpg|*.jpeg|*.png|*.gif|*.webp|*.JPG|*.JPEG|*.PNG|*.GIF|*.heic|*.HEIC) ;; *) continue ;; esac
    # Safe, stable file name: no spaces or brackets.
    name=$(basename "$f" | sed -E 's/\.[^.]+$//; s/[^A-Za-z0-9_-]+/-/g; s/-+$//')
    sips -Z 1000 -s format jpeg -s formatOptions 72 "$f" --out "$OUT/$genre/$name.jpg" >/dev/null 2>&1
  done
  echo "$genre: $(ls "$OUT/$genre" | wc -l | tr -d ' ') photos"
done

cd "$OUT" || exit 1
{
  echo "{"
  first=1
  for f in */*.jpg; do
    w=$(sips -g pixelWidth "$f" | awk '/pixelWidth/ {print $2}')
    h=$(sips -g pixelHeight "$f" | awk '/pixelHeight/ {print $2}')
    [ $first -eq 1 ] || echo ","
    printf '  "%s": [%s, %s]' "$f" "$w" "$h"
    first=0
  done
  echo
  echo "}"
} > dims.json
echo "Wrote $(grep -c '\[' dims.json) entries to dims.json ($(du -sh "$OUT" | cut -f1))"
