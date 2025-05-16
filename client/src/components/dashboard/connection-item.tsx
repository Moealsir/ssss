import { formatPhoneNumber, formatDate, relativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export interface WhatsAppSession {
  id: number;
  user_id: number;
  session_id: string;
  name: string;
  phone_number: string | null;
  is_active: boolean;
  last_connected: string | null;
  created_at: string;
  message_count: number;
}

interface ConnectionItemProps {
  session: WhatsAppSession;
  onReconnect: (sessionId: string) => Promise<void>;
  onDisconnect: (sessionId: string) => Promise<void>;
  onDelete: (sessionId: string) => Promise<void>;
  onGetQRCode: (sessionId: string) => Promise<void>;
}

export function ConnectionItem({
  session,
  onReconnect,
  onDisconnect,
  onDelete,
  onGetQRCode
}: ConnectionItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReconnect = async () => {
    try {
      setLoading(true);
      await onReconnect(session.session_id);
      toast({
        title: "Reconnecting",
        description: `Attempting to reconnect ${session.name}...`,
      });
    } catch (error) {
      console.error("Reconnect error:", error);
      toast({
        title: "Reconnect Failed",
        description: "There was an error reconnecting to WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await onDisconnect(session.session_id);
      toast({
        title: "Disconnected",
        description: `${session.name} has been disconnected.`,
      });
    } catch (error) {
      console.error("Disconnect error:", error);
      toast({
        title: "Disconnect Failed",
        description: "There was an error disconnecting from WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    try {
      setLoading(true);
      await onDelete(session.session_id);
      toast({
        title: "Deleted",
        description: `${session.name} has been deleted.`,
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the WhatsApp connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };
  
  const handleGetQRCode = async () => {
    try {
      await onGetQRCode(session.session_id);
    } catch (error) {
      console.error("QR Code error:", error);
      toast({
        title: "QR Code Failed",
        description: "There was an error generating the QR code.",
        variant: "destructive",
      });
    }
  };

  return (
    <li className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`h-10 w-10 rounded-full ${session.is_active ? 'bg-primary' : 'bg-gray-400'} flex items-center justify-center text-white`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                  <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                  <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <div className="flex items-center">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {session.name} {session.phone_number && `(${formatPhoneNumber(session.phone_number)})`}
                </h4>
                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  session.is_active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                }`}>
                  {session.is_active ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Session ID: <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{session.session_id}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {session.is_active ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDisconnect} 
                disabled={loading}
              >
                <RefreshCw className="mr-1 h-4 w-4" />
                Disconnect
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReconnect} 
                  disabled={loading}
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Reconnect
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGetQRCode} 
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <rect x="7" y="7" width="3" height="3"></rect>
                    <rect x="14" y="7" width="3" height="3"></rect>
                    <rect x="7" y="14" width="3" height="3"></rect>
                    <rect x="14" y="14" width="3" height="3"></rect>
                  </svg>
                  New QR Code
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDeleteDialogOpen(true)} 
              disabled={loading}
              className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-700 dark:text-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
        <div className="mt-2 sm:flex sm:justify-between">
          <div className="sm:flex space-y-2 sm:space-y-0 sm:space-x-6">
            <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {session.last_connected 
                ? `Connected since: ${formatDate(session.last_connected)}` 
                : 'Never connected'}
            </p>
            <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Messages: <span className="ml-1">{session.message_count.toLocaleString()}</span>
            </p>
          </div>
        </div>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the WhatsApp connection "{session.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
