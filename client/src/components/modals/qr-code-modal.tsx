import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string | null;
  sessionName: string;
}

export function QRCodeModal({ isOpen, onClose, qrCode, sessionName }: QRCodeModalProps) {
  const [progress, setProgress] = useState(30);
  const [status, setStatus] = useState("Waiting for scan...");
  
  // Mock QR code expiration progress bar
  useEffect(() => {
    if (!isOpen || !qrCode) return;
    
    setProgress(30);
    setStatus("Waiting for scan...");
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus("QR code expired. Please generate a new one.");
          return 100;
        }
        return prev + 1;
      });
    }, 300);
    
    return () => clearInterval(interval);
  }, [isOpen, qrCode]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect WhatsApp Account</DialogTitle>
          <DialogDescription>
            Scan this QR code with WhatsApp on your phone to connect {sessionName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center py-4">
          {qrCode ? (
            <img 
              src={qrCode} 
              alt="WhatsApp QR Code" 
              className="w-64 h-64 border-2 border-gray-200 dark:border-gray-700 rounded-lg"
            />
          ) : (
            <div className="w-64 h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <rect x="7" y="7" width="3" height="3"></rect>
                  <rect x="14" y="7" width="3" height="3"></rect>
                  <rect x="7" y="14" width="3" height="3"></rect>
                  <rect x="14" y="14" width="3" height="3"></rect>
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">QR Code loading...</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-2">
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            Connection status: <span className="font-medium text-yellow-600 dark:text-yellow-400">{status}</span>
          </p>
          <div className="mt-2 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-500 dark:bg-yellow-600 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
