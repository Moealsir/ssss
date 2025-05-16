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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateApiKey: (name: string, rateLimit: number, expiresAt?: Date) => Promise<void>;
}

export function ApiKeyModal({ isOpen, onClose, onCreateApiKey }: ApiKeyModalProps) {
  const [name, setName] = useState("");
  const [rateLimit, setRateLimit] = useState("60");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "API key name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      const parsedRateLimit = parseInt(rateLimit, 10);
      const parsedExpiresAt = expiresAt ? new Date(expiresAt) : undefined;
      
      await onCreateApiKey(name, parsedRateLimit, parsedExpiresAt);
      
      toast({
        title: "API Key Created",
        description: "Your new API key has been created successfully.",
      });
      
      // Reset form
      setName("");
      setRateLimit("60");
      setExpiresAt("");
      
      onClose();
    } catch (error) {
      console.error("Create API key error:", error);
      toast({
        title: "Error",
        description: "Failed to create API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New API Key</DialogTitle>
          <DialogDescription>
            Create a new API key to access the WhatsApp API programmatically.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="api-key-name">API Key Name</Label>
            <Input
              id="api-key-name"
              name="apiKeyName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production Key"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              A descriptive name to help you identify this key later.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rate-limit">Rate Limit</Label>
            <Select
              value={rateLimit}
              onValueChange={setRateLimit}
              disabled={loading}
            >
              <SelectTrigger id="rate-limit">
                <SelectValue placeholder="Select rate limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 requests/minute</SelectItem>
                <SelectItem value="60">60 requests/minute</SelectItem>
                <SelectItem value="120">120 requests/minute</SelectItem>
                <SelectItem value="300">300 requests/minute</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Maximum number of requests allowed per minute.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expires-at">Expiry (Optional)</Label>
            <Input
              id="expires-at"
              name="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Leave blank for a non-expiring key.
            </p>
          </div>
          
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create API Key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
