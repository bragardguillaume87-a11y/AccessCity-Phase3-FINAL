#!/bin/bash

orphans=()

# Function to check if a file is referenced
is_orphan() {
  local file=$1
  local basename="${file##*/}"
  local basename_no_ext="${basename%.*}"
  
  # Skip certain patterns
  if [[ "$basename_no_ext" =~ index$ ]] || [[ "$basename_no_ext" =~ \.d\.ts$ ]]; then
    return 1
  fi
  
  # Check for imports
  matches=$(grep -r "from.*$basename_no_ext\|import.*$basename_no_ext" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "^$file:" | wc -l)
  
  if [ "$matches" -eq 0 ]; then
    return 0
  else
    return 1
  fi
}

echo "=== Checking src/hooks/ ==="
for file in src/hooks/*.ts; do
  if is_orphan "$file"; then
    echo "ORPHAN: $file"
    orphans+=("$file")
  fi
done

echo ""
echo "=== Checking src/utils/ ==="
for file in src/utils/*.ts; do
  if is_orphan "$file"; then
    echo "ORPHAN: $file"
    orphans+=("$file")
  fi
done

echo ""
echo "=== Checking src/stores/ ==="
for file in src/stores/*.ts; do
  if is_orphan "$file"; then
    echo "ORPHAN: $file"
    orphans+=("$file")
  fi
done

echo ""
echo "=== Checking src/components/ (non-ui) ==="
find src/components -name "*.tsx" -type f ! -path "*/ui/*" | while read file; do
  if is_orphan "$file"; then
    echo "ORPHAN: $file"
    orphans+=("$file")
  fi
done

echo ""
echo "=== Checking src/components/ui/ ==="
find src/components/ui -name "*.tsx" -type f | while read file; do
  if is_orphan "$file"; then
    echo "ORPHAN: $file"
  fi
done
