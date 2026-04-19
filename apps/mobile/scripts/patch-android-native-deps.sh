#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

python3 - "$ROOT_DIR" <<'PY'
from pathlib import Path
import sys

root = Path(sys.argv[1])

targets = [
    (
        root / "node_modules/@react-native-menu/menu/android/build.gradle",
        """      // MenuViewManager
      if (getReactNativeMinorVersion() <= 75) {
        java.srcDirs += "src/reactNativeVersionPatch/MenuViewManager/75"
      } else {
        java.srcDirs += "src/reactNativeVersionPatch/MenuViewManager/latest"
      }
""",
        """      // MenuViewManager
      if (getReactNativeMinorVersion() <= 75) {
        java.srcDirs += "src/reactNativeVersionPatch/MenuViewManager/75"
      } else {
        java.srcDirs += "src/reactNativeVersionPatch/MenuViewManager/latest"
      }

      // Kotlin sources declared via java.srcDirs are skipped by recent AGP/KGP
      // combinations unless they are mirrored into kotlin.srcDirs as well.
      kotlin.srcDirs += java.srcDirs
""",
    ),
    (
        root / "node_modules/react-native-keyboard-controller/android/build.gradle",
        """      if (project.ext.shouldUseBaseReactPackage()) {
        java.srcDirs += ['src/base']
      } else {
        java.srcDirs += ['src/turbo']
      }
""",
        """      if (project.ext.shouldUseBaseReactPackage()) {
        java.srcDirs += ['src/base']
      } else {
        java.srcDirs += ['src/turbo']
      }

      // Kotlin sources declared via java.srcDirs are skipped by recent AGP/KGP
      // combinations unless they are mirrored into kotlin.srcDirs as well.
      kotlin.srcDirs += java.srcDirs
""",
    ),
]

for path, needle, replacement in targets:
    if not path.exists():
        raise SystemExit(f"Missing dependency Gradle file: {path}")

    text = path.read_text()
    if "kotlin.srcDirs += java.srcDirs" in text:
        continue
    if needle not in text:
        raise SystemExit(f"Unable to patch expected block in {path}")

    path.write_text(text.replace(needle, replacement))
    print(f"Patched Android native dependency Gradle file: {path}")
PY
