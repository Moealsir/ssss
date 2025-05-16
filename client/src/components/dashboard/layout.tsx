import { Sidebar } from "./sidebar";
import { User } from "@/App";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  title?: string;
  actions?: React.ReactNode;
}

export function DashboardLayout({
  children,
  user,
  onLogout,
  title,
  actions
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} onLogout={onLogout} />
      
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          {/* Dashboard Header */}
          {(title || actions) && (
            <div className="md:flex md:items-center md:justify-between mb-6">
              {title && (
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl sm:truncate">
                    {title}
                  </h2>
                </div>
              )}
              {actions && (
                <div className="mt-4 md:mt-0 md:ml-4 flex space-x-3">
                  {actions}
                </div>
              )}
            </div>
          )}
          
          {/* Main Content */}
          {children}
        </div>
      </main>
    </div>
  );
}
