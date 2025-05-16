import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";

// Validation schema for webhook
const webhookSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  event_type: z.enum(["message_received", "message_delivered", "message_read", "all"]),
  is_active: z.boolean().default(true),
  secret: z.string().optional(),
  custom_headers: z.string().optional()
});

type WebhookFormValues = z.infer<typeof webhookSchema>;

interface WebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWebhook: (data: any) => Promise<void>;
  webhook?: {
    id: number;
    url: string;
    event_type: string;
    is_active: boolean;
    secret?: string;
    custom_headers?: Record<string, string>;
  };
  isEditing?: boolean;
}

export function WebhookModal({
  isOpen,
  onClose,
  onCreateWebhook,
  webhook,
  isEditing = false
}: WebhookModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Parse the custom headers object to string for form
  const getCustomHeadersString = (): string => {
    if (!webhook?.custom_headers) return '';
    
    return Object.entries(webhook.custom_headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  };

  // Initialize form with default values
  const form = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      url: webhook?.url || '',
      event_type: (webhook?.event_type as any) || 'all',
      is_active: webhook?.is_active ?? true,
      secret: webhook?.secret || '',
      custom_headers: getCustomHeadersString()
    }
  });

  const onSubmit = async (values: WebhookFormValues) => {
    try {
      setLoading(true);
      
      // Parse custom headers from string to object
      let customHeaders: Record<string, string> | undefined;
      if (values.custom_headers) {
        customHeaders = {};
        const headerLines = values.custom_headers.split('\n');
        headerLines.forEach(line => {
          const [key, value] = line.split(':').map(s => s.trim());
          if (key && value) {
            customHeaders![key] = value;
          }
        });
      }
      
      // Prepare webhook data
      const webhookData = {
        ...values,
        custom_headers: customHeaders,
      };
      
      await onCreateWebhook(webhookData);
      
      toast({
        title: isEditing ? "Webhook Updated" : "Webhook Created",
        description: isEditing 
          ? "Your webhook has been updated successfully."
          : "Your new webhook has been created successfully.",
      });
      
      onClose();
    } catch (error) {
      console.error(isEditing ? "Update webhook error:" : "Create webhook error:", error);
      toast({
        title: "Error",
        description: isEditing 
          ? "Failed to update webhook. Please try again."
          : "Failed to create webhook. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Webhook" : "Create New Webhook"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your webhook configuration."
              : "Create a new webhook to receive real-time WhatsApp events."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://your-server.com/webhook" 
                      {...field} 
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    The URL that will receive webhook events
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="event_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="message_received">Message Received</SelectItem>
                      <SelectItem value="message_delivered">Message Delivered</SelectItem>
                      <SelectItem value="message_read">Message Read</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of events you want to receive
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="secret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook Secret (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Secret for HMAC signature" 
                      {...field} 
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Used to sign payloads for verification
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="custom_headers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Headers (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Key: Value (one per line)" 
                      {...field} 
                      disabled={loading}
                      className="h-20"
                    />
                  </FormControl>
                  <FormDescription>
                    Add custom HTTP headers (one per line)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Enable or disable this webhook
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading 
                  ? isEditing ? "Updating..." : "Creating..."
                  : isEditing ? "Update Webhook" : "Create Webhook"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
