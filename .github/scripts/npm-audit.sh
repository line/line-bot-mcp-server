#!/usr/bin/env bash
set -euo pipefail

dirs=()
while IFS= read -r path; do
  dirs+=("$(dirname "$path")")
done < <(
  find . \( -path '*/node_modules' -o -path '*/dist' \) -prune -o \
       \( -name package.json -o -name package-lock.json \) -print
)

IFS=$'\n' dirs=($(printf '%s\n' "${dirs[@]}" | sort -u)); unset IFS

declare -a failed=()

for dir in "${dirs[@]}"; do
  printf '\n\n\033[1;34m==> %s\033[0m\n' "$dir"

  pushd "$dir" >/dev/null
  if ! npm audit --audit-level moderate; then
    failed+=("$dir")
  fi
  popd >/dev/null
done

if ((${#failed[@]})); then
  echo -e "\n\033[0;31mnpm audit reported vulnerabilities in:\033[0m"
  printf '  - %s\n' "${failed[@]}"
  echo "You can run 'npm audit fix' in these directories to resolve the issues."
  echo "If running 'npm audit fix' does not resolve the issues, you may need to manually update dependencies."
  exit 1
else
  echo "npm audit passed: no vulnerabilities detected"
  exit 0
fi
