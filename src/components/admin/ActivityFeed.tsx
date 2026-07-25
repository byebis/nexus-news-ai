'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNexusStore } from '@/lib/store';
import { fetchActivityLogs } from '@/lib/api';

const ACTION_COLORS: Record<string, string> = {
  collecting: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  evaluating: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  rewriting: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  publishing: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  info: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300',
};

const ACTION_LABELS: Record<string, string> = {
  collecting: 'Raccolta',
  evaluating: 'Valutazione',
  rewriting: 'Riscrittura',
  publishing: 'Pubblicazione',
  info: 'Info',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  info: <Info className="h-4 w-4 text-muted-foreground" />,
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Adesso';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ore fa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} giorni fa`;
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });
}

function ActivityItem({ log, index }: { log: import('@/lib/store').ActivityLog; index: number }) {
  const actionColor = ACTION_COLORS[log.action] || ACTION_COLORS.info;
  const actionLabel = ACTION_LABELS[log.action] || log.action;
  const statusIcon = STATUS_ICONS[log.status] || STATUS_ICONS.info;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="flex gap-3 py-3 border-b last:border-b-0"
    >
      {/* Agent avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
        {log.agent?.avatar || '🤖'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">
            {log.agent?.name || 'AI Agent'}
          </span>
          <Badge className={`${actionColor} border-0 text-[10px] px-1.5 py-0`}>
            {actionLabel}
          </Badge>
          <span className="ml-auto text-[10px] text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(log.createdAt)}
          </span>
        </div>
        <div className="flex items-start gap-1.5">
          <span className="mt-0.5">{statusIcon}</span>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {log.detail}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function ActivityFeed() {
  const { activityLogs, setActivityLogs } = useNexusStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const fetchActivity = async () => {
    try {
      const data = await fetchActivityLogs();
      setActivityLogs(Array.isArray(data) ? data : []);
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [setActivityLogs]);

  // Auto-scroll to latest on new items
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activityLogs.length]);

  if (activityLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Radio className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Nessuna attività</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          L&apos;attività degli agenti apparirà qui in tempo reale.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {activityLogs.length} eventi registrati
        </p>
        <Button variant="outline" size="sm" onClick={fetchActivity} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Aggiorna
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="max-h-[600px] overflow-y-auto rounded-xl border bg-card"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="p-4">
          <AnimatePresence>
            {activityLogs.map((log, index) => (
              <ActivityItem key={log.id} log={log} index={index} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}