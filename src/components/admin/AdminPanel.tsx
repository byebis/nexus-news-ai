'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  ClipboardCheck,
  Send,
  Activity,
  Settings,
  BarChart3,
  HeartPulse,
  Link2,
  Users,
  LogOut,
  Loader2,
  ShieldCheck,
  PenLine,
  Newspaper,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNexusStore, TAB_ROLES, type AdminTab, type SessionUser } from '@/lib/store';
import { fetchAgents, fetchPendingArticles, fetchActivityLogs, fetchSettings } from '@/lib/api';
import LoginGate from './LoginGate';
import AgentManager from './AgentManager';
import ApprovalQueue from './ApprovalQueue';
import PublishingPanel from './PublishingPanel';
import ActivityFeed from './ActivityFeed';
import SettingsPanel from './SettingsPanel';
import StatsPanel from './StatsPanel';
import HealthPanel from './HealthPanel';
import ChannelsPanel from './ChannelsPanel';
import UsersPanel from './UsersPanel';
import DigestPanel from './DigestPanel';

const TAB_CONFIG: { value: AdminTab; label: string; short: string; icon: React.ReactNode }[] = [
  { value: 'agents', label: 'Agenti AI', short: 'Agenti', icon: <Bot className="h-4 w-4" /> },
  { value: 'approval', label: 'Coda Approvazione', short: 'Coda', icon: <ClipboardCheck className="h-4 w-4" /> },
  { value: 'publishing', label: 'Pubblicazione', short: 'Pubblica', icon: <Send className="h-4 w-4" /> },
  { value: 'activity', label: 'Attività', short: 'Attività', icon: <Activity className="h-4 w-4" /> },
  { value: 'stats', label: 'Statistiche', short: 'Stats', icon: <BarChart3 className="h-4 w-4" /> },
  { value: 'health', label: 'Salute Sistema', short: 'Salute', icon: <HeartPulse className="h-4 w-4" /> },
  { value: 'digest', label: 'Digest', short: 'Digest', icon: <Newspaper className="h-4 w-4" /> },
  { value: 'settings', label: 'Impostazioni', short: 'Impost.', icon: <Settings className="h-4 w-4" /> },
  { value: 'channels', label: 'Canali', short: 'Canali', icon: <Link2 className="h-4 w-4" /> },
  { value: 'users', label: 'Utenti', short: 'Utenti', icon: <Users className="h-4 w-4" /> },
];

const ROLE_INFO: Record<string, { label: string; icon: React.ReactNode; badge: string }> = {
  admin: {
    label: 'Amministratore',
    icon: <ShieldCheck className="h-3 w-3" />,
    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  },
  editor: {
    label: 'Editore',
    icon: <PenLine className="h-3 w-3" />,
    badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  },
};

export default function AdminPanel() {
  const {
    adminTab,
    setAdminTab,
    currentUser,
    authChecked,
    setCurrentUser,
    setAuthChecked,
    setAgents,
    setPendingArticles,
    setActivityLogs,
    setSettings,
  } = useNexusStore();
  const [loggingOut, setLoggingOut] = useState(false);

  // Verifica sessione esistente al mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) setCurrentUser(data.user as SessionUser);
        }
      } catch {
        // non autenticato
      } finally {
        setAuthChecked(true);
      }
    }
    checkSession();
  }, [setCurrentUser, setAuthChecked]);

  const fetchAllData = async () => {
    try {
      const [agentsRes, pendingRes, activityRes, settingsRes] = await Promise.allSettled([
        fetchAgents(),
        fetchPendingArticles(),
        fetchActivityLogs(),
        fetchSettings(),
      ]);

      if (agentsRes.status === 'fulfilled' && agentsRes.value) {
        setAgents(Array.isArray(agentsRes.value) ? agentsRes.value : []);
      }
      if (pendingRes.status === 'fulfilled' && pendingRes.value) {
        setPendingArticles(Array.isArray(pendingRes.value) ? pendingRes.value : []);
      }
      if (activityRes.status === 'fulfilled' && activityRes.value) {
        setActivityLogs(Array.isArray(activityRes.value) ? activityRes.value : []);
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value) {
        setSettings(settingsRes.value);
      }
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    if (currentUser) fetchAllData();
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setCurrentUser(null);
      setLoggingOut(false);
    }
  };

  // Caricamento sessione in corso
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Verifica sessione…</span>
      </div>
    );
  }

  // Non autenticato: mostra login
  if (!currentUser) {
    return <LoginGate />;
  }

  const role = currentUser.role;
  const visibleTabs = TAB_CONFIG.filter((t) => TAB_ROLES[t.value].includes(role));
  const visibleValues = visibleTabs.map((t) => t.value);
  const activeTab = visibleValues.includes(adminTab) ? adminTab : visibleValues[0];
  const roleInfo = ROLE_INFO[role];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pannello di Amministrazione</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestisci i tuoi agenti AI, approva articoli e monitora l&apos;attività.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium leading-tight">{currentUser.name}</span>
            <Badge className={`${roleInfo.badge} border-0 text-[10px] gap-1 mt-0.5`}>
              {roleInfo.icon} {roleInfo.label}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="gap-1.5"
          >
            {loggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
            Esci
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setAdminTab(v as AdminTab)}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          {visibleTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-1.5 text-xs sm:text-sm data-[state=active]:shadow-sm"
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.short}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="agents" className="mt-4">
          <AgentManager />
        </TabsContent>
        <TabsContent value="approval" className="mt-4">
          <ApprovalQueue />
        </TabsContent>
        <TabsContent value="publishing" className="mt-4">
          <PublishingPanel />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ActivityFeed />
        </TabsContent>
        <TabsContent value="stats" className="mt-4">
          <StatsPanel />
        </TabsContent>
        <TabsContent value="health" className="mt-4">
          <HealthPanel />
        </TabsContent>
        <TabsContent value="digest" className="mt-4">
          <DigestPanel />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SettingsPanel />
        </TabsContent>
        <TabsContent value="channels" className="mt-4">
          <ChannelsPanel />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UsersPanel />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
