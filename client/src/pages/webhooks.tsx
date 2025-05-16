import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Webhook, PlayCircle, ExternalLink, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { WebhookModal } from "@/components/modals/webhook-modal";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface WebhookConfig {
  id: number;
  user_id: number;
  url: string;
  event_type: string;
  is_active: boolean;
  custom_headers: Record<string, string> | null;
  secret: string | null;
  created_at: string;
  last_triggered: string | null;
  delivery_success_count: number;
  delivery_failure_count: number;
}

export default function Webhooks() {
  const { user, logout } = useAuth();
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState<number | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch webhooks
  const { 
    data: webhooksData,
    isLoading: webhooksLoading 
  } = useQuery({
    queryKey: ['/api/webhooks'],
  });

  // Create a new webhook
  const createWebhookMutation = useMutation({
    mutationFn: async (webhookData: any) => {
      const res = await apiRequest('POST', '/api/webhooks', webhookData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Webhook Created",
        description: "Your webhook has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
    },
    onError: (error) => {
      console.error("Create webhook error:", error);
      toast({
        title: "Error",
        description: "Failed to create webhook",
        variant: "destructive",
      });
    }
  });

  // Update a webhook
  const updateWebhookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest('PATCH', `/api/webhooks/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Webhook Updated",
        description: "Your webhook has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
    },
    onError: (error) => {
      console.error("Update webhook error:", error);
      toast({
        title: "Error",
        description: "Failed to update webhook",
        variant: "destructive",
      });
    }
  });

  // Delete a webhook
  const deleteWebhookMutation = useMutation({
    mutationFn: async (webhookId: number) => {
      const res = await apiRequest('DELETE', `/api/webhooks/${webhookId}`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Webhook Deleted",
        description: "Your webhook has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
    },
    onError: (error) => {
      console.error("Delete webhook error:", error);
      toast({
        title: "Error",
        description: "Failed to delete webhook",
        variant: "destructive",
      });
    }
  });

  // Test a webhook
  const testWebhookMutation = useMutation({
    mutationFn: async (webhookId: number) => {
      const res = await apiRequest('POST', `/api/webhooks/${webhookId}/test`, {});
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Test Successful",
          description: "The test webhook was delivered successfully.",
        });
      } else {
        toast({
          title: "Test Failed",
          description: "The test webhook delivery failed. Check your endpoint.",
          variant: "destructive",
        });
      }
      setTestingWebhook(null);
    },
    onError: (error) => {
      console.error("Test webhook error:", error);
      toast({
        title: "Error",
        description: "Failed to test webhook",
        variant: "destructive",
      });
      setTestingWebhook(null);
    }
  });

  // Toggle webhook active state
  const toggleWebhookActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const res = await apiRequest('PATCH', `/api/webhooks/${id}`, { is_active: isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
    },
    onError: (error) => {
      console.error("Toggle webhook error:", error);
      toast({
        title: "Error",
        description: "Failed to update webhook status",
        variant: "destructive",
      });
    }
  });

  // Handle creating/updating a webhook
  const handleSaveWebhook = async (webhookData: any) => {
    if (editingWebhook) {
      await updateWebhookMutation.mutateAsync({ id: editingWebhook.id, data: webhookData });
    } else {
      await createWebhookMutation.mutateAsync(webhookData);
    }
    setWebhookModalOpen(false);
    setEditingWebhook(null);
  };

  // Handle deleting a webhook
  const handleDeleteWebhook = async () => {
    if (webhookToDelete === null) return;
    
    await deleteWebhookMutation.mutateAsync(webhookToDelete);
    setDeleteDialogOpen(false);
    setWebhookToDelete(null);
  };

  // Handle testing a webhook
  const handleTestWebhook = async (webhookId: number) => {
    setTestingWebhook(webhookId);
    await testWebhookMutation.mutateAsync(webhookId);
  };

  // Handle toggling webhook active state
  const handleToggleActive = async (webhookId: number, isActive: boolean) => {
    await toggleWebhookActiveMutation.mutateAsync({ id: webhookId, isActive });
  };

  // Format event type for display
  const formatEventType = (eventType: string): string => {
    switch (eventType) {
      case 'message_received':
        return 'Message Received';
      case 'message_delivered':
        return 'Message Delivered';
      case 'message_read':
        return 'Message Read';
      case 'all':
        return 'All Events';
      default:
        return eventType;
    }
  };

  // Get event type color
  const getEventTypeColor = (eventType: string): string => {
    switch (eventType) {
      case 'message_received':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'message_delivered':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'message_read':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'all':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  // Calculate success rate
  const calculateSuccessRate = (webhook: WebhookConfig): number => {
    const total = webhook.delivery_success_count + webhook.delivery_failure_count;
    if (total === 0) return 0;
    return Math.round((webhook.delivery_success_count / total) * 100);
  };

  return (
    <DashboardLayout 
      user={user} 
      onLogout={logout}
      title="Webhooks"
      actions={
        <Button onClick={() => {
          setEditingWebhook(null);
          setWebhookModalOpen(true);
        }}>
          <Webhook className="-ml-1 mr-2 h-4 w-4" />
          Create Webhook
        </Button>
      }
    >
      <div className="mt-2">
        {webhooksLoading ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">
            Loading webhooks...
          </div>
        ) : webhooksData?.webhooks.length === 0 ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 shadow rounded-md">
            <p className="mb-4">No webhooks configured yet</p>
            <Button onClick={() => {
              setEditingWebhook(null);
              setWebhookModalOpen(true);
            }}>
              <Webhook className="mr-2 h-4 w-4" /> Create Webhook
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {webhooksData?.webhooks.map((webhook: WebhookConfig) => (
              <Card key={webhook.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold truncate" title={webhook.url}>
                        {new URL(webhook.url).hostname}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <a 
                          href={webhook.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 dark:text-gray-400 flex items-center hover:underline"
                        >
                          {webhook.url.length > 40 ? webhook.url.substring(0, 40) + '...' : webhook.url}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </CardDescription>
                    </div>
                    <div>
                      <Badge 
                        variant="secondary"
                        className={getEventTypeColor(webhook.event_type)}
                      >
                        {formatEventType(webhook.event_type)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`webhook-active-${webhook.id}`}>Active</Label>
                      <Switch
                        id={`webhook-active-${webhook.id}`}
                        checked={webhook.is_active}
                        onCheckedChange={(checked) => handleToggleActive(webhook.id, checked)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Created</p>
                        <p className="font-medium">{formatDate(webhook.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Last Triggered</p>
                        <p className="font-medium">{webhook.last_triggered ? formatDate(webhook.last_triggered) : 'Never'}</p>
                      </div>
                    </div>
                    
                    {(webhook.delivery_success_count > 0 || webhook.delivery_failure_count > 0) && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
                          <p className="text-sm font-medium">{calculateSuccessRate(webhook)}%</p>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="bg-green-500 h-2.5 rounded-full" 
                            style={{ width: `${calculateSuccessRate(webhook)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <p>Success: {webhook.delivery_success_count}</p>
                          <p>Failure: {webhook.delivery_failure_count}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingWebhook(webhook);
                        setWebhookModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-700 dark:text-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
                      onClick={() => {
                        setWebhookToDelete(webhook.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleTestWebhook(webhook.id)}
                    disabled={testingWebhook === webhook.id || !webhook.is_active}
                  >
                    {testingWebhook === webhook.id ? (
                      <>Testing...</>
                    ) : (
                      <>
                        <PlayCircle className="mr-1 h-4 w-4" />
                        Test
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">About Webhooks</h3>
        
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <p>
            Webhooks allow external applications to receive real-time updates about events from your WhatsApp connections.
            When a specified event occurs, our system will make an HTTP POST request to the URL you provide.
          </p>
          
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">Webhook Event Types</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Message Received</strong> - Triggered when a new message is received from a contact</li>
            <li><strong>Message Delivered</strong> - Triggered when a message you sent has been delivered</li>
            <li><strong>Message Read</strong> - Triggered when a message you sent has been read</li>
            <li><strong>All Events</strong> - Triggered for all event types</li>
          </ul>
          
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">Webhook Security</h4>
          <p>
            You can set a webhook secret to verify that requests are coming from our service.
            When a secret is set, we'll include an HMAC signature in the <code>X-Signature</code> header of the request.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-600 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400 dark:text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  <strong>Tip:</strong> Use the Test button to verify your endpoint is correctly set up to receive webhook events.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Create/Edit Webhook Modal */}
      <WebhookModal
        isOpen={webhookModalOpen}
        onClose={() => {
          setWebhookModalOpen(false);
          setEditingWebhook(null);
        }}
        onCreateWebhook={handleSaveWebhook}
        webhook={editingWebhook || undefined}
        isEditing={!!editingWebhook}
      />

      {/* Delete Webhook Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this webhook configuration. 
              External applications will no longer receive events from this webhook.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteWebhook}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
