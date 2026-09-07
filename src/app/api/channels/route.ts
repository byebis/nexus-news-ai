import { supabase, toCamelCase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';

export interface ChannelRow {
  id: string;
  channel: string;
  label: string;
  enabled: boolean;
  config: Record<string, string>;
  last_test_at: string | null;
  last_test_status: string;
  last_test_detail: string;
}

/** Maschera i segreti: mostra solo le ultime 4 cifre. */
function maskSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return '••••';
  return `••••••••••••${value.slice(-4)}`;
}

const SECRET_FIELDS = new Set(['bot_token', 'secret', 'api_key', 'access_token']);
const ALLOWED_CHANNELS = new Set(['blog', 'telegram', 'webhook', 'twitter', 'linkedin', 'instagram', 'facebook']);

function maskChannel(row: ChannelRow) {
  const maskedConfig: Record<string, string> = {};
  for (const [k, v] of Object.entries(row.config || {})) {
    maskedConfig[k] = SECRET_FIELDS.has(k) ? maskSecret(v) : v;
  }
  const camel = toCamelCase(row as unknown as Record<string, unknown>) as Record<string, unknown>;
  return { ...camel, config: maskedConfig };
}

export async function GET(request: Request) {
  // Editor può vedere lo stato dei canali (lettura), solo admin può modificarli
  const guard = await requireRole(request, ['admin', 'editor']);
  if (guard.error) return guard.error;

  const { data, error } = await supabase
    .from('channel_configs')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    return Response.json({ error: 'Impossibile caricare i canali' }, { status: 500 });
  }
  return Response.json({ channels: (data || []).map((r) => maskChannel(r as unknown as ChannelRow)) });
}

export async function PUT(request: Request) {
  const guard = await requireRole(request, ['admin']);
  if (guard.error) return guard.error;

  try {
    const { channel, enabled, config } = await request.json();
    if (!channel || !ALLOWED_CHANNELS.has(channel)) {
      return Response.json({ error: 'Canale non valido' }, { status: 400 });
    }

    const { data: existingRow } = await supabase
      .from('channel_configs')
      .select('*')
      .eq('channel', channel)
      .single();

    const existingConfig = (existingRow?.config as Record<string, string>) || {};

    // Se il client rimanda un valore mascherato (••••), conserva il segreto salvato
    const mergedConfig: Record<string, string> = { ...existingConfig };
    if (config && typeof config === 'object') {
      for (const [k, v] of Object.entries(config as Record<string, unknown>)) {
        const strVal = String(v ?? '');
        if (SECRET_FIELDS.has(k) && strVal.includes('••••')) {
          continue; // mantieni il valore esistente
        }
        mergedConfig[k] = strVal;
      }
    }

    const updates: Record<string, unknown> = {
      enabled: enabled !== undefined ? !!enabled : (existingRow?.enabled ?? false),
      config: mergedConfig,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await supabase
      .from('channel_configs')
      .update(updates)
      .eq('channel', channel)
      .select()
      .single();

    if (error) {
      return Response.json({ error: 'Salvataggio fallito' }, { status: 500 });
    }

    await supabase.from('activity_logs').insert({
      agent_id: 'sys-redazione',
      action: 'channel_updated',
      detail: `${guard.user.name} ha aggiornato il canale "${channel}" (attivo: ${updates.enabled})`,
      status: 'info',
    });

    return Response.json({ channel: updated });
  } catch (err) {
    console.error('PUT /api/channels error:', err);
    return Response.json({ error: 'Errore nel salvataggio del canale' }, { status: 500 });
  }
}
