import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toCamelCase<T>(row: Record<string, unknown>): T {
  if (!row || typeof row !== 'object') return row as T;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const ck = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (Array.isArray(value)) {
      result[ck] = value.map((v) =>
        isObject(v) ? toCamelCase(v as Record<string, unknown>) : v
      );
    } else if (isObject(value)) {
      result[ck] = toCamelCase(value as Record<string, unknown>);
    } else {
      result[ck] = value;
    }
  }
  return result as T;
}

export function transformRows<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map(row => toCamelCase<T>(row));
}

export function generateId(): string {
  return crypto.randomUUID();
}
