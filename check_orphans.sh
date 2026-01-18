#!/bin/bash

# Check all hooks
echo "=== Checking hooks ==="
for file in src/hooks/*.ts; do
  basename="${file##*/}"
  basename_no_ext="${basename%.*}"
  # Search for imports of this file
  matches=$(grep -r "from.*$basename_no_ext\|import.*$basename_no_ext" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "^$file:" | wc -l)
  if [ "$matches" -eq 0 ]; then
    echo "ORPHAN: $file"
  fi
done

echo ""
echo "=== Checking utils ==="
for file in src/utils/*.ts; do
  basename="${file##*/}"
  basename_no_ext="${basename%.*}"
  matches=$(grep -r "from.*$basename_no_ext\|import.*$basename_no_ext" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "^$file:" | wc -l)
  if [ "$matches" -eq 0 ]; then
    echo "ORPHAN: $file"
  fi
done

echo ""
echo "=== Checking stores ==="
for file in src/stores/*.ts; do
  basename="${file##*/}"
  basename_no_ext="${basename%.*}"
  if [ "$basename" != "index.ts" ]; then
    matches=$(grep -r "from.*$basename_no_ext\|import.*$basename_no_ext" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "^$file:" | wc -l)
    if [ "$matches" -eq 0 ]; then
      echo "ORPHAN: $file"
    fi
  fi
done
