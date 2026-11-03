#!/usr/bin/env bash
set -euo pipefail
DEMO_DIR="docs/demo"
INPUT="$DEMO_DIR/collab-docs-demo.webm"
OUT="$DEMO_DIR/collab-docs-preview.gif"
if [[ ! -f "$INPUT" ]]; then
  echo "Missing $INPUT — run Playwright demo first."
  exit 1
fi
ffmpeg -y -i "$INPUT" -vf "fps=10,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "$OUT"
echo "Wrote $OUT"
