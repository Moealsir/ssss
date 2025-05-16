import { Button } from "@/components/ui/button";
import { Trash2, Clipboard } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { maskApiKey, copyToClipboard } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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

export interface ApiKey {
  id: number;
  user_id: number;
  name: string;
  key: string;
  is_active: boolean;
  rate_limit: number;
  expires_at: string | null;
  created_at: string;
  request_count: number;
}

interface ApiKeyItemProps {
  apiKey: ApiKey;
  onRevoke: (keyId: number) => Promise<void>;
  showFullKey?: boolean;
}

export function ApiKeyItem({ apiKey, onRevoke, showFullKey = false }: ApiKeyItemProps) {
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const displayKey = showFullKey ? apiKey.key : maskApiKey(apiKey.key);

  const handleCopyKey = async () => {
    const success = await copyToClipboard(apiKey.key);
    if (success) {
      toast({
        title: "Copied",
        description: "API key copied to clipboard",
      });
    } else {
      toast({
        title: "Copy Failed",
        description: "Failed to copy API key to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleRevoke = async () => {
    try {
      setLoading(true);
      await onRevoke(apiKey.id);
      toast({
        title: "API Key Revoked",
        description: `The API key "${apiKey.name}" has been revoked.`,
      });
    } catch (error) {
      console.error("Revoke API key error:", error);
      toast({
        title: "Revoke Failed",
        description: "There was an error revoking the API key.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRevokeDialogOpen(false);
    }
  };

  return (
    <li className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <div className="flex items-center">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{apiKey.name}</h4>
                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  apiKey.is_active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                }`}>
                  {apiKey.is_active ? 'Active' : 'Revoked'}
                </span>
              </div>
              <div className="mt-1 flex items-center">
                <code className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {displayKey}
                </code>
                <button 
                  className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" 
                  onClick={handleCopyKey}
                  title="Copy API key to clipboard"
                >
                  <Clipboard className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setRevokeDialogOpen(true)}
              disabled={!apiKey.is_active || loading}
              className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-700 dark:text-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Revoke
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
              Created: <span className="ml-1">{formatDate(apiKey.created_at)}</span>
            </p>
            <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              Usage: <span className="ml-1">{apiKey.request_count} requests</span>
            </p>
            <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Rate Limit: <span className="ml-1">{apiKey.rate_limit} req/min</span>
            </p>
            {apiKey.expires_at && (
              <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Expires: <span className="ml-1">{formatDate(apiKey.expires_at)}</span>
              </p>
            )}
          </div>
        </div>
      </div>
      
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke access for applications using this API key. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRevoke}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Revoking..." : "Revoke Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
