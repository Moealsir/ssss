import { DashboardLayout } from "@/components/dashboard/layout";
import { ApiKeyItem, ApiKey } from "@/components/dashboard/api-key-item";
import { Button } from "@/components/ui/button";
import { ApiKeyModal } from "@/components/modals/api-key-modal";
import { useAuth } from "@/App";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Key } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ApiKeys() {
  const { user, logout } = useAuth();
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch API keys
  const { 
    data: apiKeysData,
    isLoading: apiKeysLoading 
  } = useQuery({
    queryKey: ['/api/api-keys'],
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

  // Handle creating a new API key
  const handleCreateApiKey = async (name: string, rateLimit: number, expiresAt?: Date) => {
    await createApiKeyMutation.mutateAsync({ name, rateLimit, expiresAt });
  };

  // Handle revoking an API key
  const handleRevokeApiKey = async (keyId: number) => {
    await revokeApiKeyMutation.mutateAsync(keyId);
  };

  return (
    <DashboardLayout 
      user={user} 
      onLogout={logout}
      title="API Keys"
      actions={
        <Button onClick={() => setApiKeyModalOpen(true)}>
          <Key className="-ml-1 mr-2 h-4 w-4" />
          Create API Key
        </Button>
      }
    >
      <div className="mt-2">
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
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
              {apiKeysData?.apiKeys.map((apiKey: ApiKey) => (
                <ApiKeyItem
                  key={apiKey.id}
                  apiKey={apiKey}
                  onRevoke={handleRevokeApiKey}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">About API Keys</h3>
        
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <p>
            API keys are used to authenticate requests to the WhatsApp API Gateway. Each key has a unique identifier
            and can be revoked at any time.
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  <strong>Security Notice:</strong> Keep your API keys secure. They grant full access to your WhatsApp accounts through the API.
                </p>
              </div>
            </div>
          </div>
          
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">Rate Limits</h4>
          <p>
            Each API key has a rate limit that determines how many requests can be made per minute. 
            If you exceed this limit, your requests will be rejected until the next minute.
          </p>
          
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">Expiration</h4>
          <p>
            API keys can have an optional expiration date. After this date, the key will automatically become invalid.
            This is useful for creating temporary access for integrations.
          </p>
        </div>
      </div>
      
      {/* Create API Key Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onCreateApiKey={handleCreateApiKey}
      />
    </DashboardLayout>
  );
}
