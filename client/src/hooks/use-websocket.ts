import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWebSocketOptions {
  onOpen?: (ev: Event) => void;
  onMessage?: (data: any) => void;
  onError?: (ev: Event) => void;
  onClose?: (ev: CloseEvent) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(
  url: string | null,
  token: string | null,
  options: UseWebSocketOptions = {}
) {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  
  const {
    onOpen,
    onMessage,
    onError,
    onClose,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;
  
  const connect = useCallback(() => {
    if (!url || !token) return;
    
    // Create websocket URL with token
    const wsUrl = `${url}?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = (ev) => {
      setIsConnected(true);
      setReconnectAttempt(0);
      if (onOpen) onOpen(ev);
    };
    
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (onMessage) onMessage(data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
    
    ws.onerror = (ev) => {
      if (onError) onError(ev);
    };
    
    ws.onclose = (ev) => {
      setIsConnected(false);
      if (onClose) onClose(ev);
      
      // Try to reconnect
      if (reconnectAttempt < maxReconnectAttempts) {
        setTimeout(() => {
          setReconnectAttempt(prev => prev + 1);
          connect();
        }, reconnectInterval);
      }
    };
    
    wsRef.current = ws;
    
    return () => {
      ws.close();
    };
  }, [url, token, onOpen, onMessage, onError, onClose, reconnectAttempt, maxReconnectAttempts, reconnectInterval]);
  
  useEffect(() => {
    const cleanup = connect();
    
    return () => {
      if (cleanup) cleanup();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);
  
  const sendMessage = useCallback((data: any) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, [isConnected]);
  
  return {
    isConnected,
    reconnectAttempt,
    sendMessage
  };
}
