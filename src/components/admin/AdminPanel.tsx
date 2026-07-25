'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  ClipboardCheck,
  Send,
  Activity,
  Settings,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useNexusStore, type AdminTab } from '@/lib/store';
import { fetchAgents, fetchPendingArticles, fetchActivityLogs, fetchSettings } from '@/lib/api';
import AgentManager from './AgentManager';
import ApprovalQueue from './ApprovalQueue';
import PublishingPanel from './PublishingPanel';
import ActivityFeed from './ActivityFeed';
import SettingsPanel from './SettingsPanel';

const TAB_CONFIG: { value: AdminTab; label: string; icon: React.ReactNode }[] = [
  { value: 'agents', label: 'Agenti AI', icon: <Bot className="h-4 w-4" /> },
  { value: 'approval', label: 'Coda Approvazione', icon: <ClipboardCheck className="h-4 w-4" /> },
  { value: 'publishing', label: 'Pubblicazione', icon: <Send className="h-4 w-4" /> },
  { value: 'activity', label: 'Attività', icon: <Activity className="h-4 w-4" /> },
  { value: 'settings', label: 'Impostazioni', icon: <Settings className="h-4 w-4" /> },
];

export default function AdminPanel() {
  const {
    adminTab,
    setAdminTab,
    setAgents,
    setPendingArticles,
    setActivityLogs,
    setSettings,
  } = useNexusStore();

  useEffect(() => {
    async function fetchAllData() {
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
    }
    fetchAllData();
  }, [setAgents, setPendingArticles, setActivityLogs, setSettings]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Pannello di Amministrazione</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gestisci i tuoi agenti AI, approva articoli e monitora l&apos;attività.
        </p>
      </div>

      <Tabs value={adminTab} onValueChange={(v) => setAdminTab(v as AdminTab)}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          {TAB_CONFIG.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-1.5 text-xs sm:text-sm data-[state=active]:shadow-sm"
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">
                {tab.label.split(' ')[0]}
              </span>
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
        <TabsContent value="settings" className="mt-4">
          <SettingsPanel />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}