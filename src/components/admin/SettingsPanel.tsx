'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, Zap, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useNexusStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { updateSettings as updateSettingsApi } from '@/lib/api';

function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default function SettingsPanel() {
  const { settings, setSettings } = useNexusStore();
  const [isSaving, setIsSaving] = useState(false);

  // Local form state
  const [mode, setMode] = useState(settings?.mode || 'semi_autonomous');
  const [autoCollect, setAutoCollect] = useState(settings?.autoCollect ?? true);
  const [autoEvaluate, setAutoEvaluate] = useState(settings?.autoEvaluate ?? false);
  const [autoRewrite, setAutoRewrite] = useState(settings?.autoRewrite ?? false);
  const [autoPublish, setAutoPublish] = useState(settings?.autoPublish ?? false);
  const [collectInterval, setCollectInterval] = useState(settings?.collectInterval ?? 30);
  const [maxArticlesPerDay, setMaxArticlesPerDay] = useState(settings?.maxArticlesPerDay ?? 10);
  const [siteName, setSiteName] = useState(settings?.siteName ?? 'NEXUS NEWS AI');
  const [siteTagline, setSiteTagline] = useState(settings?.siteTagline ?? "Il futuro dell'informazione, guidato dall'intelligenza artificiale");

  const isAutonomous = mode === 'fully_autonomous';

  // Sync with store settings
  useEffect(() => {
    if (settings) {
      setMode(settings.mode || 'semi_autonomous');
      setAutoCollect(settings.autoCollect ?? true);
      setAutoEvaluate(settings.autoEvaluate ?? false);
      setAutoRewrite(settings.autoRewrite ?? false);
      setAutoPublish(settings.autoPublish ?? false);
      setCollectInterval(settings.collectInterval ?? 30);
      setMaxArticlesPerDay(settings.maxArticlesPerDay ?? 10);
      setSiteName(settings.siteName ?? 'NEXUS NEWS AI');
      setSiteTagline(settings.siteTagline ?? "Il futuro dell'informazione, guidato dall'intelligenza artificiale");
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = await updateSettingsApi({
        mode,
        autoCollect,
        autoEvaluate,
        autoRewrite,
        autoPublish,
        collectInterval,
        maxArticlesPerDay,
        siteName,
        siteTagline,
      });
      setSettings(data);
      toast({ title: 'Impostazioni salvate', description: 'Le impostazioni sono state aggiornate con successo.' });
    } catch {
      toast({ title: 'Errore', description: 'Impossibile salvare le impostazioni.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const modeAccent = isAutonomous
    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20'
    : 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20';

  const modeIconAccent = isAutonomous ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';
  const modeTitle = isAutonomous ? 'Completamente Autonomo' : 'Semi-Autonomo';
  const modeDescription = isAutonomous
    ? 'Gli agenti raccolgono, valutano, riscrivono e pubblicano automaticamente senza intervento umano.'
    : 'Gli agenti raccolgono notizie automaticamente, ma le approvazioni richiedono la tua revisione.';

  return (
    <div className="max-w-2xl space-y-6">
      {/* Mode Selection */}
      <motion.div
        layout
        className={`rounded-xl border-2 p-5 sm:p-6 transition-colors ${modeAccent}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isAutonomous ? (
              <ShieldCheck className={`h-5 w-5 ${modeIconAccent}`} />
            ) : (
              <Zap className={`h-5 w-5 ${modeIconAccent}`} />
            )}
            <h3 className="font-semibold">{modeTitle}</h3>
          </div>
          <Switch
            checked={isAutonomous}
            onCheckedChange={(checked) => setMode(checked ? 'fully_autonomous' : 'semi_autonomous')}
          />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {modeDescription}
        </p>
      </motion.div>

      <Separator />

      {/* Auto toggles */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm">Automazioni</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">Auto-raccolta</Label>
              <p className="text-xs text-muted-foreground">Raccogli notizie automaticamente</p>
            </div>
            <Switch checked={autoCollect} onCheckedChange={setAutoCollect} />
          </div>

          <div className={`flex items-center justify-between rounded-lg border p-3 transition-opacity ${isAutonomous || autoCollect ? '' : 'opacity-50'}`}>
            <div>
              <Label className="text-sm font-medium">Auto-valutazione</Label>
              <p className="text-xs text-muted-foreground">Valuta la qualità automaticamente</p>
            </div>
            <Switch
              checked={autoEvaluate}
              onCheckedChange={setAutoEvaluate}
              disabled={!isAutonomous && !autoCollect}
            />
          </div>

          <div className={`flex items-center justify-between rounded-lg border p-3 transition-opacity ${isAutonomous || autoEvaluate ? '' : 'opacity-50'}`}>
            <div>
              <Label className="text-sm font-medium">Auto-riscrittura</Label>
              <p className="text-xs text-muted-foreground">Riscrivi gli articoli con lo stile dell&apos;agente</p>
            </div>
            <Switch
              checked={autoRewrite}
              onCheckedChange={setAutoRewrite}
              disabled={!isAutonomous && !autoEvaluate}
            />
          </div>

          <div className={`flex items-center justify-between rounded-lg border p-3 transition-opacity ${isAutonomous || autoRewrite ? '' : 'opacity-50'}`}>
            <div>
              <Label className="text-sm font-medium">Auto-pubblicazione</Label>
              <p className="text-xs text-muted-foreground">Pubblica automaticamente sulle piattaforme</p>
            </div>
            <Switch
              checked={autoPublish}
              onCheckedChange={setAutoPublish}
              disabled={!isAutonomous && !autoRewrite}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Collect interval */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm">Pianificazione</h3>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Intervallo di raccolta</Label>
            <span className="text-sm font-semibold">{formatInterval(collectInterval)}</span>
          </div>
          <Slider
            value={[collectInterval]}
            onValueChange={([v]) => setCollectInterval(v)}
            min={15}
            max={360}
            step={15}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>15 min</span>
            <span>6 ore</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Massimo articoli al giorno</Label>
          <Input
            type="number"
            value={maxArticlesPerDay}
            onChange={(e) => setMaxArticlesPerDay(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={100}
            className="w-32"
          />
        </div>
      </div>

      <Separator />

      {/* Site settings */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm">Sito</h3>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome del sito</Label>
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="NEXUS NEWS AI"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Sottotitolo</Label>
            <Input
              value={siteTagline}
              onChange={(e) => setSiteTagline(e.target.value)}
              placeholder="Il futuro dell'informazione..."
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Save button */}
      <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Salva Impostazioni
      </Button>
    </div>
  );
}