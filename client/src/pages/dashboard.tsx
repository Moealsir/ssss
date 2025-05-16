import { DashboardLayout } from "@/components/dashboard/layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ConnectionItem, WhatsAppSession } from "@/components/dashboard/connection-item";
import { ApiKeyItem, ApiKey } from "@/components/dashboard/api-key-item";
import { LogsPanel, LogEntry } from "@/components/dashboard/logs-panel";
import { CodeBlock } from "@/components/dashboard/code-block";
import { Button } from "@/components/ui/button";
import { QRCodeModal } from "@/components/modals/qr-code-modal";
import { ApiKeyModal } from "@/components/modals/api-key-modal";
import { useAuth } from "@/App";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/use-websocket";
import { 
  DownloadCloud, 
  FileText,
  MessageSquareText,
  Activity,
  Key,
  Webhook,
} from "lucide-react";

interface DashboardStats {
  activeSessions: number;
  totalSessions: number;
  totalMessages: number;
  activeApiKeys: number;
  totalApiKeys: number;
  totalRequests: number;
  activeWebhooks: number;
  totalWebhooks: number;
  totalWebhookCalls: number;
}

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionToConnect, setSessionToConnect] = useState<string>('');
  const [newSessionName, setNewSessionName] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Setup websocket connection
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = `${wsProtocol}://${window.location.host}/ws`;
  
  useWebSocket(wsUrl, token, {
    onMessage: (data) => {
      // Handle different event types
      if (data.type === 'session_created' || 
          data.type === 'session_connected' || 
          data.type === 'session_disconnected' || 
          data.type === 'session_deleted') {
        queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/sessions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      }
      
      if (data.type === 'api_key_created' || 
          data.type === 'api_key_revoked') {
        queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
        queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      }
      
      if (data.type === 'message_sent' || 
          data.type === 'media_sent' || 
          data.type === 'message_replied' || 
          data.type === 'group_message_sent') {
        queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
      }
    },
    onError: (err) => {
      console.error("WebSocket error:", err);
    }
  });

  // Fetch dashboard stats
  const { 
    data: stats,
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch WhatsApp sessions
  const { 
    data: sessionsData,
    isLoading: sessionsLoading 
  } = useQuery({
    queryKey: ['/api/whatsapp/sessions'],
  });

  // Fetch API keys
  const { 
    data: apiKeysData,
    isLoading: apiKeysLoading 
  } = useQuery({
    queryKey: ['/api/api-keys'],
  });

  // Fetch logs
  const { 
    data: logsData,
    isLoading: logsLoading 
  } = useQuery({
    queryKey: ['/api/logs'],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`${queryKey[0]}?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json();
    },
  });

  // Create a new WhatsApp session
  const createSessionMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest('POST', '/api/whatsapp/sessions', { name });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Session Created",
        description: `New WhatsApp session "${data.session.name}" created. Scan the QR code to connect.`,
      });
      setQrCode(data.qrCode);
      setSessionToConnect(data.session.session_id);
      setNewSessionName(data.session.name);
      setConnectModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      console.error("Create session error:", error);
      toast({
        title: "Error",
        description: "Failed to create WhatsApp session",
        variant: "destructive",
      });
    }
  });

  // Reconnect a WhatsApp session
  const reconnectSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiRequest('POST', `/api/whatsapp/sessions/${sessionId}/connect`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      console.error("Reconnect session error:", error);
      toast({
        title: "Error",
        description: "Failed to reconnect WhatsApp session",
        variant: "destructive",
      });
    }
  });

  // Disconnect a WhatsApp session
  const disconnectSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiRequest('POST', `/api/whatsapp/sessions/${sessionId}/disconnect`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      console.error("Disconnect session error:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect WhatsApp session",
        variant: "destructive",
      });
    }
  });

  // Delete a WhatsApp session
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiRequest('DELETE', `/api/whatsapp/sessions/${sessionId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      console.error("Delete session error:", error);
      toast({
        title: "Error",
        description: "Failed to delete WhatsApp session",
        variant: "destructive",
      });
    }
  });

  // Get QR code for a session
  const getQrCodeMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch(`/api/whatsapp/sessions/${sessionId}/qr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to get QR code');
      return res.json();
    },
    onSuccess: (data, sessionId) => {
      setQrCode(data.qrCode);
      setSessionToConnect(sessionId);
      const session = sessionsData?.sessions.find(s => s.session_id === sessionId);
      setNewSessionName(session?.name || 'WhatsApp Session');
      setConnectModalOpen(true);
    },
    onError: (error) => {
      console.error("Get QR code error:", error);
      toast({
        title: "Error",
        description: "Failed to get QR code",
        variant: "destructive",
      });
    }
  });

  // Create a new API key
  const createApiKeyMutation = useMutation({
    mutationFn: async (keyData: { name: string, rateLimit: number, expiresAt?: Date }) => {
      const data = {
        name: keyData.name,
        rate_limit: keyData.rateLimit,
        expires_at: keyData.expiresAt ? keyData.expiresAt.toISOString() : null,
        user_id: user?.id, // This will be overridden by the server
        is_active: true
      };
      const res = await apiRequest('POST', '/api/api-keys', data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "API Key Created",
        description: "Your new API key has been created. Keep it secure!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      // Show full key to user
      toast({
        title: "API Key",
        description: (
          <div className="mt-2">
            <p className="mb-2 text-sm">Copy your API key now. It won't be shown again.</p>
            <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded block overflow-x-auto">
              {data.apiKey.key}
            </code>
          </div>
        ),
        duration: 10000, // Show for 10 seconds
      });
    },
    onError: (error) => {
      console.error("Create API key error:", error);
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    }
  });

  // Revoke an API key
  const revokeApiKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      const res = await apiRequest('DELETE', `/api/api-keys/${keyId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      console.error("Revoke API key error:", error);
      toast({
        title: "Error",
        description: "Failed to revoke API key",
        variant: "destructive",
      });
    }
  });

  // Handle connecting a new WhatsApp session
  const handleConnectNew = () => {
    const sessionName = prompt("Enter a name for this WhatsApp connection:");
    if (!sessionName) return;
    
    createSessionMutation.mutate(sessionName);
  };

  // Handle reconnecting a WhatsApp session
  const handleReconnect = async (sessionId: string) => {
    await reconnectSessionMutation.mutateAsync(sessionId);
  };

  // Handle disconnecting a WhatsApp session
  const handleDisconnect = async (sessionId: string) => {
    await disconnectSessionMutation.mutateAsync(sessionId);
  };

  // Handle deleting a WhatsApp session
  const handleDelete = async (sessionId: string) => {
    await deleteSessionMutation.mutateAsync(sessionId);
  };

  // Handle getting a QR code for a session
  const handleGetQRCode = async (sessionId: string) => {
    await getQrCodeMutation.mutateAsync(sessionId);
  };

  // Handle creating a new API key
  const handleCreateApiKey = async (name: string, rateLimit: number, expiresAt?: Date) => {
    await createApiKeyMutation.mutateAsync({ name, rateLimit, expiresAt });
  };

  // Handle revoking an API key
  const handleRevokeApiKey = async (keyId: number) => {
    await revokeApiKeyMutation.mutateAsync(keyId);
  };

  // Actions for dashboard header
  const headerActions = (
    <>
      <Button variant="outline" onClick={() => window.open('/api/logs?export=true')}>
        <DownloadCloud className="-ml-1 mr-2 h-4 w-4" />
        Export Logs
      </Button>
      <Button onClick={handleConnectNew}>
        <MessageSquareText className="-ml-1 mr-2 h-4 w-4" />
        Connect WhatsApp
      </Button>
    </>
  );

  return (
    <DashboardLayout 
      user={user} 
      onLogout={logout}
      title="Dashboard"
      actions={headerActions}
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Sessions Card */}
        <StatsCard
          icon={<MessageSquareText className="h-5 w-5" />}
          iconBackground="bg-primary-100 dark:bg-primary-900"
          iconColor="text-primary-600 dark:text-primary-400"
          title="Active Sessions"
          value={statsLoading ? "..." : stats?.activeSessions || 0}
          linkHref="/connections"
          linkText="View all sessions"
        />
        
        {/* API Requests Card */}
        <StatsCard
          icon={<Activity className="h-5 w-5" />}
          iconBackground="bg-blue-100 dark:bg-blue-900"
          iconColor="text-blue-600 dark:text-blue-400"
          title="API Requests (24h)"
          value={statsLoading ? "..." : stats?.totalRequests?.toLocaleString() || 0}
          linkHref="/logs"
          linkText="View analytics"
        />
        
        {/* Active API Keys Card */}
        <StatsCard
          icon={<Key className="h-5 w-5" />}
          iconBackground="bg-yellow-100 dark:bg-yellow-900"
          iconColor="text-yellow-600 dark:text-yellow-400"
          title="Active API Keys"
          value={statsLoading ? "..." : stats?.activeApiKeys || 0}
          linkHref="/api-keys"
          linkText="Manage keys"
        />
        
        {/* Webhook Calls Card */}
        <StatsCard
          icon={<Webhook className="h-5 w-5" />}
          iconBackground="bg-purple-100 dark:bg-purple-900"
          iconColor="text-purple-600 dark:text-purple-400"
          title="Webhook Calls (24h)"
          value={statsLoading ? "..." : stats?.totalWebhookCalls?.toLocaleString() || 0}
          linkHref="/webhooks"
          linkText="Configure webhooks"
        />
      </div>
      
      {/* WhatsApp Connections Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">WhatsApp Connections</h3>
          <Button 
            size="sm" 
            onClick={handleConnectNew}
          >
            <MessageSquareText className="mr-1 h-4 w-4" /> Connect New
          </Button>
        </div>
        
        <div className="mt-4 bg-white dark:bg-gray-800 shadow sm:rounded-md">
          {sessionsLoading ? (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">
              Loading WhatsApp connections...
            </div>
          ) : sessionsData?.sessions.length === 0 ? (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">
              <p className="mb-4">No WhatsApp connections yet</p>
              <Button onClick={handleConnectNew}>
                <MessageSquareText className="mr-2 h-4 w-4" /> Connect WhatsApp
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {sessionsData?.sessions.map((session: WhatsAppSession) => (
                <ConnectionItem
                  key={session.session_id}
                  session={session}
                  onReconnect={handleReconnect}
                  onDisconnect={handleDisconnect}
                  onDelete={handleDelete}
                  onGetQRCode={handleGetQRCode}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* API Keys Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">API Keys</h3>
          <Button 
            size="sm"
            onClick={() => setApiKeyModalOpen(true)}
          >
            <Key className="mr-1 h-4 w-4" /> Create API Key
          </Button>
        </div>
        
        <div className="mt-4 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          {apiKeysLoading ? (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">
              Loading API keys...
            </div>
          ) : apiKeysData?.apiKeys.length === 0 ? (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">
              <p className="mb-4">No API keys yet</p>
              <Button onClick={() => setApiKeyModalOpen(true)}>
                <Key className="mr-2 h-4 w-4" /> Create API Key
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {apiKeysData?.apiKeys.slice(0, 2).map((apiKey: ApiKey) => (
                <ApiKeyItem
                  key={apiKey.id}
                  apiKey={apiKey}
                  onRevoke={handleRevokeApiKey}
                />
              ))}
              {apiKeysData?.apiKeys.length > 2 && (
                <li className="px-4 py-4 text-center">
                  <Button variant="link" onClick={() => window.location.href = '/api-keys'}>
                    View all {apiKeysData.apiKeys.length} API keys
                  </Button>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
      
      {/* API Documentation Preview */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">API Documentation</h3>
          <Button variant="link" onClick={() => window.location.href = '/docs'}>
            View full documentation <span aria-hidden="true">&rarr;</span>
          </Button>
        </div>
        
        <div className="mt-4 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Quick Reference</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Common endpoints and usage examples.</p>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
            <div className="mt-1 mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">Send a text message</h4>
              <CodeBlock 
                title="POST /api/send"
                code={`curl -X POST ${window.location.protocol}//${window.location.host}/api/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sessionId": "wa_123", 
    "to": "+1234567890", 
    "text": "Hello from the WhatsApp API Gateway!"
  }'`}
              />
            </div>
            
            <div className="mt-6 mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">Send a media message</h4>
              <CodeBlock
                title="POST /api/send-media"
                code={`curl -X POST ${window.location.protocol}//${window.location.host}/api/send-media \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sessionId": "wa_123", 
    "to": "+1234567890", 
    "mediaUrl": "https://example.com/image.jpg",
    "caption": "Check out this image!"
  }'`}
              />
            </div>
            
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">Reply to a message</h4>
              <CodeBlock 
                title="POST /api/reply"
                code={`curl -X POST ${window.location.protocol}//${window.location.host}/api/reply \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sessionId": "wa_123", 
    "messageId": "msg_abc", 
    "text": "This is a reply to your message"
  }'`}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity Log */}
      <div className="mt-8 mb-12">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Recent Activity</h3>
          <Button variant="link" onClick={() => window.location.href = '/logs'}>
            View all logs <span aria-hidden="true">&rarr;</span>
          </Button>
        </div>
        
        <LogsPanel
          logs={logsData?.logs || []}
          isLoading={logsLoading}
          onLoadMore={() => window.location.href = '/logs'}
          hasMore={true}
        />
      </div>
      
      {/* QR Code Scanning Modal */}
      <QRCodeModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        qrCode={qrCode}
        sessionName={newSessionName}
      />
      
      {/* Create API Key Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onCreateApiKey={handleCreateApiKey}
      />
    </DashboardLayout>
  );
}
