#!/usr/bin/env zsh
# Restructure samples directory to remove redundant machine prefixes
# Creates a new structure, preserving the original

set -e  # Exit on error

MACHINES_DIR="/Users/macbook/dev/ridm/public/samples/machines"
NEW_DIR="/Users/macbook/dev/ridm/public/samples/machines-new"
BACKUP_DIR="/Users/macbook/dev/ridm/public/samples/machines.backup"

echo "🔍 Analyzing current structure..."
ORIGINAL_COUNT=$(find "$MACHINES_DIR" -name "*.WAV" -o -name "*.wav" | wc -l | tr -d ' ')
echo "Found $ORIGINAL_COUNT sample files"

# Create backup
echo "\n📦 Creating backup..."
if [ -d "$BACKUP_DIR" ]; then
  echo "⚠️  Removing existing backup..."
  rm -rf "$BACKUP_DIR"
fi
cp -r "$MACHINES_DIR" "$BACKUP_DIR"
echo "✓ Backup created at $BACKUP_DIR"

# Create new structure
echo "\n🔨 Creating new structure..."
mkdir -p "$NEW_DIR"

MACHINES_PROCESSED=0
TYPES_PROCESSED=0

for machine_dir in "$MACHINES_DIR"/*; do
  if [ ! -d "$machine_dir" ] || [[ $(basename "$machine_dir") == "machines-new" ]] || [[ $(basename "$machine_dir") == "machines.backup" ]]; then
    continue
  fi

  machine_name=$(basename "$machine_dir")
  echo "\n  Processing: $machine_name"
  mkdir -p "$NEW_DIR/$machine_name"

  MACHINES_PROCESSED=$((MACHINES_PROCESSED + 1))

  # Find all type folders
  for type_dir in "$machine_dir"/*; do
    if [ ! -d "$type_dir" ]; then continue; fi

    full_name=$(basename "$type_dir")

    # Skip hidden directories and system files
    if [[ "$full_name" == .* ]]; then continue; fi

    # Extract type (everything after last dash)
    type="${full_name##*-}"

    # Skip if it's the same (no dash found)
    if [ "$type" = "$full_name" ]; then
      echo "    ℹ️  Skipping $full_name (no machine prefix found)"
      continue
    fi

    echo "    $full_name → $type/"

    # Copy samples to new structure
    mkdir -p "$NEW_DIR/$machine_name/$type"

    # Copy both .WAV and .wav files (turn off error exit temporarily)
    set +e
    cp "$type_dir"/*.WAV "$NEW_DIR/$machine_name/$type/" 2>/dev/null
    cp "$type_dir"/*.wav "$NEW_DIR/$machine_name/$type/" 2>/dev/null

    # Check if any files were copied
    file_count=$(find "$NEW_DIR/$machine_name/$type" -name "*.WAV" -o -name "*.wav" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$file_count" -eq 0 ]; then
      echo "      ⚠️  No .WAV or .wav files found"
    fi
    set -e

    TYPES_PROCESSED=$((TYPES_PROCESSED + 1))
  done
done

echo "\n\n✅ Restructuring complete!"
echo "   Machines processed: $MACHINES_PROCESSED"
echo "   Type folders processed: $TYPES_PROCESSED"

# Verify file count
NEW_COUNT=$(find "$NEW_DIR" -name "*.WAV" -o -name "*.wav" | wc -l | tr -d ' ')
echo "\n📊 Verification:"
echo "   Original files: $ORIGINAL_COUNT"
echo "   New files: $NEW_COUNT"

if [ "$ORIGINAL_COUNT" -eq "$NEW_COUNT" ]; then
  echo "   ✓ File counts match!"
  echo "\n📂 New structure created at: $NEW_DIR"
  echo "\n🔄 To apply the changes:"
  echo "   cd /Users/macbook/dev/ridm/public/samples"
  echo "   mv machines machines-old"
  echo "   mv machines-new machines"
else
  echo "   ⚠️  WARNING: File counts don't match!"
  echo "   Please investigate before applying changes."
  exit 1
fi
