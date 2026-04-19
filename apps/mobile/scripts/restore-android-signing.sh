#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE_PROPERTIES_PATH="$ROOT_DIR/android/app/keystore.properties"

KEY_ALIAS_DEFAULT="upload"
STORE_PASSWORD_SERVICE="clawket-android-keystore-store-password"
KEY_PASSWORD_SERVICE="clawket-android-keystore-key-password"

resolve_value() {
  local explicit_value="$1"
  local keychain_service="$2"

  if [[ -n "$explicit_value" ]]; then
    printf '%s' "$explicit_value"
    return
  fi

  security find-generic-password -s "$keychain_service" -w 2>/dev/null || true
}

KEYSTORE_PATH_VALUE="${CLAWKET_ANDROID_KEYSTORE_PATH:-}"
KEY_ALIAS_VALUE="${CLAWKET_ANDROID_KEY_ALIAS:-$KEY_ALIAS_DEFAULT}"
STORE_PASSWORD_VALUE="$(resolve_value "${CLAWKET_ANDROID_KEYSTORE_PASSWORD:-}" "$STORE_PASSWORD_SERVICE")"
KEY_PASSWORD_VALUE="$(resolve_value "${CLAWKET_ANDROID_KEY_PASSWORD:-}" "$KEY_PASSWORD_SERVICE")"

if [[ -z "$KEYSTORE_PATH_VALUE" ]]; then
  echo "Missing Android keystore path."
  echo "Set CLAWKET_ANDROID_KEYSTORE_PATH before restoring local signing."
  exit 1
fi

if [[ ! -f "$KEYSTORE_PATH_VALUE" ]]; then
  echo "Android upload keystore not found: $KEYSTORE_PATH_VALUE"
  exit 1
fi

if [[ -z "$STORE_PASSWORD_VALUE" ]]; then
  echo "Missing Android keystore store password."
  echo "Set CLAWKET_ANDROID_KEYSTORE_PASSWORD or add Keychain item: $STORE_PASSWORD_SERVICE"
  exit 1
fi

if [[ -z "$KEY_PASSWORD_VALUE" ]]; then
  echo "Missing Android keystore key password."
  echo "Set CLAWKET_ANDROID_KEY_PASSWORD or add Keychain item: $KEY_PASSWORD_SERVICE"
  exit 1
fi

mkdir -p "$(dirname "$KEYSTORE_PROPERTIES_PATH")"
cat > "$KEYSTORE_PROPERTIES_PATH" <<EOF
storeFile=$KEYSTORE_PATH_VALUE
storePassword=$STORE_PASSWORD_VALUE
keyAlias=$KEY_ALIAS_VALUE
keyPassword=$KEY_PASSWORD_VALUE
EOF

echo "Restored Android signing config:"
echo "  $KEYSTORE_PROPERTIES_PATH"
echo "  keystore=$KEYSTORE_PATH_VALUE"
echo "  alias=$KEY_ALIAS_VALUE"
