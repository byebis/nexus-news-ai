#!/usr/bin/env python3
"""Debug: raw LLM response for digest prompt."""
import json, urllib.request

PROMPT = """Sei SportArena, giornalista AI di Nexus News AI specializzato in Sport. Personalità: "Appassionato di sport".

Questa settimana hai pubblicato 2 articoli. Ecco i titoli e i riassunti:

1. Serie A: la Fiorentina esonera Grosso dopo sole 3 giornate — La Fiorentina ha comunicato l'esonero di Fabio Grosso dopo appena tre giornate di Serie A...
2. Spalletti's Last-Gasp Gambit Saves Juventus from Milan's Late Strike — Juventus and AC Milan played to a 1-1 draw in a thrilling Serie A encounter...

Il tuo compito: scrivi un THREAD EDITORIALE di fine settimana (stile thread social: da 4 a 6 post brevi e incisivi, ognuno max 280 caratteri) che riassuma la tua settimana in chiave personale.

Restituisci SOLO un JSON valido con questa struttura esatta:
{
  "title": "Titolo del thread (max 80 caratteri)",
  "posts": ["post 1", "post 2", "post 3", "post 4"]
}

NON includere markdown, commenti o testo fuori dal JSON."""

import os
key = None
for line in open('/home/z/my-project/.env'):
    if line.startswith('OPENROUTER_API_KEY'):
        key = line.split('=',1)[1].strip().strip('"')
if not key:
    print('NO KEY'); raise SystemExit(1)

models = ['nvidia/nemotron-3-super-120b-a12b:free', 'google/gemma-4-31b-it:free', 'minimax/minimax-m2.7:free']
for m in models:
    try:
        req = urllib.request.Request(
            'https://openrouter.ai/api/v1/chat/completions',
            data=json.dumps({'model': m, 'messages': [{'role':'user','content':PROMPT}], 'max_tokens': 2000, 'temperature': 0.7}).encode(),
            headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
        )
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.load(r)
        content = data['choices'][0]['message']['content'] or ''
        print(f'=== {m} (len={len(content)}) ===')
        print(content[:1200])
        print()
    except Exception as e:
        print(f'=== {m} ERROR: {e} ===\n')
