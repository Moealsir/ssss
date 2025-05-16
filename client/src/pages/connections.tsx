import { DashboardLayout } from "@/components/dashboard/layout";
import { ConnectionItem, WhatsAppSession } from "@/components/dashboard/connection-item";
import { Button } from "@/components/ui/button";
import { QRCodeModal } from "@/components/modals/qr-code-modal";
import { useAuth } from "@/App";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MessageSquareText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Connections() {
  const { user, token, logout } = useAuth();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionToConnect, setSessionToConnect] = useState<string>('');
  const [newSessionName, setNewSessionName] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch WhatsApp sessions
  const { 
    data: sessionsData,
    isLoading: sessionsLoading 
  } = useQuery({
    queryKey: ['/api/whatsapp/sessions'],
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

  return (
    <DashboardLayout 
      user={user} 
      onLogout={logout}
      title="WhatsApp Connections"
      actions={
        <Button onClick={handleConnectNew}>
          <MessageSquareText className="-ml-1 mr-2 h-4 w-4" />
          Connect New
        </Button>
      }
    >
      <div className="mt-2 bg-white dark:bg-gray-800 shadow sm:rounded-md">
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
      
      {/* QR Code Scanning Modal */}
      <QRCodeModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        qrCode={qrCode}
        sessionName={newSessionName}
      />
    </DashboardLayout>
  );
}
