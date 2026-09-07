import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';

/** Test connessione REALE per canale: Telegram Bot API, webhook ping, relay social. */
export async function POST(request: Request) {
  const guard = await requireRole(request, ['admin']);
  if (guard.error) return guard.error;

  try {
    const { channel } = await request.json();
    if (!channel) {
      return Response.json({ error: 'Canale richiesto' }, { status: 400 });
    }

    const { data: row } = await supabase
      .from('channel_configs')
      .select('*')
      .eq('channel', channel)
      .single();

    if (!row) {
      return Response.json({ error: 'Canale non trovato' }, { status: 404 });
    }

    const config = (row.config as Record<string, string>) || {};
    let status = 'failed';
    let detail = '';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    try {
      if (channel === 'blog') {
        status = 'success';
        detail = 'Il blog è il sito stesso: sempre attivo.';
      } else if (channel === 'telegram') {
        const token = config.bot_token?.trim();
        const chatId = config.chat_id?.trim();
        if (!token || !chatId) {
          detail = 'Configura bot_token e chat_id prima del test.';
        } else {
          const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: controller.signal });
          const me = await meRes.json().catch(() => null);
          if (!me?.ok) {
            detail = `Bot non raggiungibile: ${me?.description || 'token non valido'}`;
          } else {
            const chatRes = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId)}`, {
              signal: controller.signal,
            });
            const chat = await chatRes.json().catch(() => null);
            if (!chat?.ok) {
              detail = `Bot OK (@${me.result?.username}) ma chat non accessibile: ${chat?.description || 'chat_id non valido'}. Assicurati di aver inviato almeno un messaggio al bot o aggiunto il bot nel gruppo.`;
            } else {
              status = 'success';
              const title = chat.result?.title || chat.result?.username || chat.result?.first_name || chatId;
              detail = `Connesso: bot @${me.result?.username} → chat "${title}"`;
            }
          }
        }
      } else if (channel === 'webhook') {
        const url = config.url?.trim();
        if (!url || !/^https?:\/\//.test(url)) {
          detail = 'Configura un URL https valido (Make/Zapier/n8n).';
        } else {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'test', service: 'nexus-news-ai', timestamp: new Date().toISOString() }),
            signal: controller.signal,
          });
          if (res.ok) {
            status = 'success';
            detail = `Webhook raggiunto (HTTP ${res.status})`;
          } else {
            detail = `Webhook ha risposto HTTP ${res.status}`;
          }
        }
      } else {
        // Canali social diretti (twitter/linkedin/instagram/facebook): pubblicano via relay webhook
        const relay = config.relay_webhook?.trim();
        if (relay && /^https?:\/\//.test(relay)) {
          const res = await fetch(relay, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'test', service: 'nexus-news-ai', channel, timestamp: new Date().toISOString() }),
            signal: controller.signal,
          });
          if (res.ok) {
            status = 'success';
            detail = `Relay raggiunto (HTTP ${res.status})`;
          } else {
            detail = `Relay ha risposto HTTP ${res.status}`;
          }
        } else {
          detail = 'Nessun relay configurato: questi social si collegano tramite webhook di automazione (Make/Zapier/n8n) nel campo relay_webhook.';
        }
      }
    } catch (fetchErr) {
      detail = fetchErr instanceof Error && fetchErr.name === 'AbortError'
        ? 'Timeout: il servizio non ha risposto in 12 secondi'
        : `Errore di rete: ${fetchErr instanceof Error ? fetchErr.message : 'sconosciuto'}`;
    } finally {
      clearTimeout(timeout);
    }

    await supabase
      .from('channel_configs')
      .update({
        last_test_at: new Date().toISOString(),
        last_test_status: status,
        last_test_detail: detail,
      })
      .eq('channel', channel);

    await supabase.from('activity_logs').insert({
      agent_id: 'sys-redazione',
      action: 'channel_test',
      detail: `${guard.user.name} ha testato il canale "${channel}": ${status === 'success' ? 'OK' : 'FALLITO'} — ${detail}`,
      status: status === 'success' ? 'success' : 'error',
    });

    return Response.json({ status, detail });
  } catch (err) {
    console.error('POST /api/channels/test error:', err);
    return Response.json({ error: 'Errore nel test del canale' }, { status: 500 });
  }
}
