#!/usr/bin/env node
/**
 * sync-env-from-wrangler.js
 * --------------------------
 * PERMANENT FIX for the recurring "empty site" disaster:
 * NEXT_PUBLIC_* vars are inlined by Next.js at BUILD time (client bundle).
 * They live in wrangler.toml [vars] (used at runtime by CF Pages),
 * but if .env is missing them, the client bundle ships WITHOUT keys
 * -> browser cannot reach Supabase -> "Nessun articolo" everywhere.
 *
 * This script parses wrangler.toml [vars] and merges any missing keys
 * into .env before `next build` runs. Never prints secret values.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const wranglerPath = path.join(root, 'wrangler.toml');
const envPath = path.join(root, '.env');

function parseWranglerVars(src) {
  const vars = {};
  let inVars = false;
  for (const rawLine of src.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (/^\[.*\]$/.test(line)) {
      inVars = line === '[vars]';
      continue;
    }
    if (!inVars) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"(.*)"\s*$/);
    if (m) vars[m[1]] = m[2];
  }
  return vars;
}

function parseEnvFile(src) {
  const map = {};
  for (const rawLine of src.split(/\r?\n/)) {
    const m = rawLine.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) map[m[1]] = m[2];
  }
  return map;
}

try {
  if (!fs.existsSync(wranglerPath)) {
    console.error('[sync-env] wrangler.toml not found — skipping');
    process.exit(0);
  }
  const wranglerVars = parseWranglerVars(fs.readFileSync(wranglerPath, 'utf8'));
  const existing = fs.existsSync(envPath) ? parseEnvFile(fs.readFileSync(envPath, 'utf8')) : {};

  const missing = Object.keys(wranglerVars).filter(
    (k) => !(k in existing) || !existing[k] || existing[k].length < 8
  );

  if (missing.length === 0) {
    console.log(`[sync-env] .env already complete (${Object.keys(existing).length} keys) — nothing to do`);
    process.exit(0);
  }

  const lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split(/\r?\n/).filter(Boolean) : [];
  for (const k of missing) lines.push(`${k}=${wranglerVars[k]}`);
  fs.writeFileSync(envPath, lines.join('\n') + '\n', { mode: 0o600 });
  console.log(`[sync-env] Added ${missing.length} missing key(s) from wrangler.toml: ${missing.join(', ')}`);
} catch (err) {
  console.error('[sync-env] ERROR:', err.message);
  process.exit(1);
}
