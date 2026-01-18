#!/bin/bash

# Get all .tsx files in components
find src/components -name "*.tsx" -type f | while read file; do
  # Skip index.ts files (they're for exports)
  if [[ "$file" == *"/index.ts"* ]]; then
    continue
  fi
  
  # Get the component name (filename without .tsx)
  basename="${file##*/}"
  basename_no_ext="${basename%.tsx}"
  
  # Skip test files
  if [[ "$basename_no_ext" == *".test"* ]] || [[ "$basename_no_ext" == *".spec"* ]]; then
    continue
  fi
  
  # Search for imports of this component
  matches=$(grep -r "from.*$basename_no_ext\|import.*$basename_no_ext" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "^$file:" | wc -l)
  
  if [ "$matches" -eq 0 ]; then
    echo "ORPHAN: $file"
  fi
done
