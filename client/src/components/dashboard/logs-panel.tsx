import { useState } from "react";
import { RelativeTime } from "./relative-time";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface LogEntry {
  id: number;
  user_id: number;
  session_id: string | null;
  type: 'message' | 'api_call' | 'connection' | 'webhook' | 'error' | 'system';
  message: string;
  details: Record<string, any>;
  created_at: string;
}

interface LogsPanelProps {
  logs: LogEntry[];
  isLoading?: boolean;
  onFilterChange?: (type: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function LogsPanel({
  logs,
  isLoading = false,
  onFilterChange,
  onLoadMore,
  hasMore = false
}: LogsPanelProps) {
  const [filter, setFilter] = useState<string>("all");

  const handleFilterChange = (value: string) => {
    setFilter(value);
    if (onFilterChange) {
      onFilterChange(value === "all" ? "" : value);
    }
  };

  const getIconForLogType = (type: LogEntry['type']) => {
    switch (type) {
      case 'message':
        return (
          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
        );
      case 'api_call':
        return (
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 6 23 6 23 12"></polyline>
              <path d="M22 17a10 10 0 1 1-17-8"></path>
            </svg>
          </div>
        );
      case 'connection':
        return (
          <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12s2.545-5 7-5c4.454 0 7 5 7 5s-2.546 5-7 5c-4.455 0-7-5-7-5z"></path>
              <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path>
              <path d="M21 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2"></path>
              <path d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"></path>
            </svg>
          </div>
        );
      case 'webhook':
        return (
          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
        );
      case 'system':
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="flow-root">
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm leading-6 font-medium text-gray-900 dark:text-gray-100">System Logs</h3>
            <div>
              <Select value={filter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-[160px] text-sm">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="message">Messages</SelectItem>
                  <SelectItem value="api_call">API Calls</SelectItem>
                  <SelectItem value="connection">Connections</SelectItem>
                  <SelectItem value="webhook">Webhooks</SelectItem>
                  <SelectItem value="error">Errors</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading logs...
            </div>
          )}
          
          {!isLoading && logs.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No logs to display.
            </div>
          )}
          
          {logs.map((log) => (
            <li key={log.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getIconForLogType(log.type)}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {log.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {log.session_id && `Session ID: ${log.session_id} | `}
                      {log.details && Object.entries(log.details)
                        .filter(([key]) => key !== 'error' && key !== 'messageId')
                        .map(([key, value]) => 
                          typeof value === 'string' || typeof value === 'number' 
                            ? `${key}: ${value}`
                            : null
                        )
                        .filter(Boolean)
                        .join(' | ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    <RelativeTime date={log.created_at} />
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-4 sm:px-6 text-center">
          {hasMore && (
            <button 
              className="text-sm font-medium text-primary hover:text-primary/80"
              onClick={onLoadMore}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load more logs"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
