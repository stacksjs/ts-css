#!/usr/bin/env bash
#
# One-shot setup for npm publishing via an encrypted .env.production.
#
# Prompts for the npm token (never echoed, never passed as an argument, so it
# stays out of `ps` and shell history), encrypts it, registers the decryption
# key as a repository secret, commits the encrypted file, and re-runs the
# release workflow.
#
# Usage:  bash scripts/setup-publishing.sh [tag]
#         tag defaults to the newest v* tag.

set -euo pipefail

REPO="stacksjs/ts-css"
ENV_FILE=".env.production"
KEYS_FILE=".env.keys"

cd "$(dirname "$0")/.." || { echo "could not enter repo root" >&2; exit 1; }

command -v gh >/dev/null || { echo "gh CLI is required" >&2; exit 1; }
command -v bunx >/dev/null || { echo "bun is required" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "run 'gh auth login' first" >&2; exit 1; }

TAG="${1:-$(git tag --list 'v*' --sort=-v:refname | head -1)}"
[[ -n "$TAG" ]] || { echo "no v* tag found" >&2; exit 1; }

VERSION="${TAG#v}"

echo "Repository : $REPO"
echo "Release tag: $TAG (@stacksjs/ts-css@$VERSION)"
echo
echo "Paste the npm token, then press Enter. It will not be displayed."
echo "It needs publish permission for the existing @stacksjs/ts-css package."
printf 'npm token: '
read -rs NPM_TOKEN_VALUE
echo

[[ -n "$NPM_TOKEN_VALUE" ]] || { echo "no token entered, aborting" >&2; exit 1; }
case "$NPM_TOKEN_VALUE" in
  npm_*) ;;
  *) echo "warning: token does not start with 'npm_' — continuing anyway" >&2 ;;
esac

# Verify the token before anything is encrypted, committed, or pushed. An
# invalid token otherwise surfaces as a 401/404 several minutes into a CI run,
# with the failure looking like a workflow problem rather than a credential
# one. This is exactly how the previous two releases failed.
echo "Verifying the token with npm ..."
WHOAMI_FILE="/tmp/npm-whoami.$$"
WHOAMI_AUTH="Authorization: Bearer $NPM_TOKEN_VALUE"
WHOAMI_URL="https://registry.npmjs.org/-/whoami"
WHOAMI_STATUS="$(curl -s -o "$WHOAMI_FILE" -w '%{http_code}' -H "$WHOAMI_AUTH" "$WHOAMI_URL" || echo 000)"
WHOAMI_BODY="$(cat "$WHOAMI_FILE" 2>/dev/null || true)"
rm -f "$WHOAMI_FILE"
unset WHOAMI_AUTH

if [[ "$WHOAMI_STATUS" != "200" ]]; then
  unset NPM_TOKEN_VALUE
  echo >&2
  echo "npm rejected the token (HTTP $WHOAMI_STATUS)." >&2
  echo "Create a fresh one at https://www.npmjs.com/settings/~/tokens" >&2
  echo "It needs publish permission for @stacksjs/ts-css." >&2
  exit 1
fi
echo "  authenticated as: $(printf '%s' "$WHOAMI_BODY" | sed -E 's/.*"username":"([^"]*)".*/\1/')"

# Write, encrypt, and immediately drop the plaintext from this shell.
umask 077
printf 'NPM_TOKEN=%s\n' "$NPM_TOKEN_VALUE" > "$ENV_FILE"
unset NPM_TOKEN_VALUE

echo "Encrypting $ENV_FILE ..."
bunx --bun @dotenvx/dotenvx encrypt -f "$ENV_FILE" >/dev/null

# Refuse to continue if the value is still readable — committing that would
# publish the token to a public repo.
if ! grep -q 'NPM_TOKEN=encrypted:' "$ENV_FILE"; then
  rm -f "$ENV_FILE"
  echo "encryption did not produce ciphertext; aborting and removing $ENV_FILE" >&2
  exit 1
fi
[[ -f "$KEYS_FILE" ]] || { echo "$KEYS_FILE was not created" >&2; exit 1; }

PRIVATE_KEY="$(grep '^DOTENV_PRIVATE_KEY_PRODUCTION=' "$KEYS_FILE" | cut -d= -f2- | tr -d '"')"
[[ -n "$PRIVATE_KEY" ]] || { echo "could not read the private key from $KEYS_FILE" >&2; exit 1; }

echo "Registering DOTENV_PRIVATE_KEY_PRODUCTION ..."
printf '%s' "$PRIVATE_KEY" | gh secret set DOTENV_PRIVATE_KEY_PRODUCTION --repo "$REPO"
unset PRIVATE_KEY

# Belt and braces: .gitignore already excludes it, but a committed .env.keys
# would make every encrypted value in the repo readable.
if git check-ignore -q "$KEYS_FILE"; then
  echo "$KEYS_FILE is gitignored (correct)"
else
  echo "$KEYS_FILE is NOT gitignored — aborting before commit" >&2
  exit 1
fi

echo "Committing $ENV_FILE ..."
git add "$ENV_FILE"
git commit -q -m "chore: add encrypted production env for npm publishing"
git push origin main

echo "Re-running the release workflow for $TAG ..."
RUN_QUERY="[.[] | select(.headBranch==\"$TAG\")][0].databaseId"
RUN_ID="$(gh run list --workflow=Releaser --repo "$REPO" --limit 20 --json databaseId,headBranch --jq "$RUN_QUERY")"

if [[ -n "$RUN_ID" && "$RUN_ID" != "null" ]]; then
  gh run rerun "$RUN_ID" --repo "$REPO"
  echo "Watching run $RUN_ID ..."
  if gh run watch "$RUN_ID" --repo "$REPO" --exit-status; then
    echo "Published."
  else
    echo "Release failed — inspect with: gh run view $RUN_ID --log-failed --repo $REPO" >&2
    exit 1
  fi
else
  echo "No Releaser run found for $TAG. Trigger one with:" >&2
  echo "  gh workflow run Releaser --ref $TAG --repo $REPO" >&2
  exit 1
fi

# Confirm the package actually landed. A green workflow is not proof: the
# publish step has previously reported errors while the run itself succeeded,
# and the registry is the only authority on whether the version exists.
echo
echo "Confirming @stacksjs/ts-css@$VERSION on the registry ..."
for attempt in 1 2 3 4 5 6; do
  STATUS="$(curl -s -o /dev/null -w '%{http_code}' "https://registry.npmjs.org/@stacksjs%2Fts-css/$VERSION" || echo 000)"
  if [[ "$STATUS" == "200" ]]; then
    echo "  @stacksjs/ts-css@$VERSION is live: https://www.npmjs.com/package/@stacksjs/ts-css/v/$VERSION"
    PUBLISHED=1
    break
  fi
  echo "  not visible yet (HTTP $STATUS), retrying in 10s ... [$attempt/6]"
  sleep 10
done

if [[ "${PUBLISHED:-0}" != "1" ]]; then
  echo >&2
  echo "The workflow finished but @stacksjs/ts-css@$VERSION is not on the registry." >&2
  echo "Inspect the publish step with:" >&2
  echo "  gh run view $RUN_ID --log --repo $REPO | grep -A5 'Publish to npm'" >&2
  exit 1
fi

echo
echo "Done. Keep the token private and revoke it when it is no longer needed."
