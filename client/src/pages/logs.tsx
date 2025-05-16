import { DashboardLayout } from "@/components/dashboard/layout";
import { LogsPanel, LogEntry } from "@/components/dashboard/logs-panel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { useState } from "react";
import { DownloadCloud } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Logs() {
  const { user, token, logout } = useAuth();
  const [filter, setFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const LOGS_PER_PAGE = 20;

  // Fetch logs with pagination
  const { 
    data: logsData,
    isLoading: logsLoading,
    isFetching: logsFetching,
    refetch: refetchLogs
  } = useQuery({
    queryKey: [`/api/logs`, filter, page],
    queryFn: async ({ queryKey }) => {
      const [baseUrl, currentFilter, currentPage] = queryKey;
      const url = new URL(`${baseUrl}`, window.location.origin);
      
      url.searchParams.append('limit', LOGS_PER_PAGE.toString());
      
      if (currentFilter) {
        url.searchParams.append('type', currentFilter);
      }
      
      // Skip parameter for pagination
      if (currentPage > 1) {
        url.searchParams.append('skip', ((currentPage - 1) * LOGS_PER_PAGE).toString());
      }
      
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json();
    },
  });

  // Handle filter change
  const handleFilterChange = (type: string) => {
    setFilter(type);
    setPage(1); // Reset to first page on filter change
  };

  // Handle load more logs
  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  // Combine logs from all pages
  const allLogs = logsData?.logs || [];

  // Check if there are more logs to load
  const hasMoreLogs = allLogs.length === page * LOGS_PER_PAGE;

  // Group logs by day for better organization
  const groupLogsByDay = (logs: LogEntry[]) => {
    const grouped: { [key: string]: LogEntry[] } = {};
    
    logs.forEach(log => {
      const date = new Date(log.created_at);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(log);
    });
    
    return grouped;
  };

  const groupedLogs = groupLogsByDay(allLogs);
  const sortedDates = Object.keys(groupedLogs).sort().reverse();

  // Format date for display
  const formatDateHeading = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if the date is today or yesterday
    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      // Format as Month Day, Year
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  return (
    <DashboardLayout 
      user={user} 
      onLogout={logout}
      title="System Logs"
      actions={
        <Button variant="outline" onClick={() => window.open('/api/logs?export=true')}>
          <DownloadCloud className="-ml-1 mr-2 h-4 w-4" />
          Export Logs
        </Button>
      }
    >
      <div className="mt-2 space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-md p-4 md:p-6">
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">All System Logs</h3>
            <div className="mt-2 md:mt-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchLogs()}
                disabled={logsLoading || logsFetching}
              >
                {logsLoading || logsFetching ? "Refreshing..." : "Refresh Logs"}
              </Button>
            </div>
          </div>
          
          <LogsPanel
            logs={allLogs}
            isLoading={logsLoading}
            onFilterChange={handleFilterChange}
            onLoadMore={handleLoadMore}
            hasMore={hasMoreLogs}
          />
        </div>
        
        {/* Detailed logs organized by day */}
        <div className="space-y-6">
          {sortedDates.map(dateKey => (
            <div key={dateKey} className="bg-white dark:bg-gray-800 shadow rounded-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">
                  {formatDateHeading(dateKey)}
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {groupedLogs[dateKey].map(log => (
                  <div key={log.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{log.message}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          {log.type && (
                            <span className="flex items-center">
                              <span className="font-medium mr-1">Type:</span> {log.type}
                            </span>
                          )}
                          {log.session_id && (
                            <span className="flex items-center">
                              <span className="font-medium mr-1">Session:</span> 
                              <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{log.session_id}</code>
                            </span>
                          )}
                          {log.details && Object.entries(log.details).map(([key, value]) => (
                            typeof value === 'string' || typeof value === 'number' ? (
                              <span key={key} className="flex items-center">
                                <span className="font-medium mr-1">{key}:</span> 
                                {key === 'messageId' || key === 'sessionId' ? (
                                  <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{value}</code>
                                ) : String(value)}
                              </span>
                            ) : null
                          ))}
                        </div>
                      </div>
                      <div className="mt-2 md:mt-0 text-xs text-right text-gray-500 dark:text-gray-400">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Load more button (outside of panels) */}
        {hasMoreLogs && (
          <div className="text-center mt-4">
            <Button 
              variant="outline" 
              onClick={handleLoadMore}
              disabled={logsLoading || logsFetching}
            >
              {logsLoading || logsFetching ? "Loading..." : "Load More Logs"}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
