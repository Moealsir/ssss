import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/App";
import { 
  LayoutDashboard, 
  MessageSquareText, 
  Key, 
  Webhook, 
  ScrollText, 
  FileText,
  LogOut
} from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const handleLogout = () => {
    onLogout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | null): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-10">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white">
              <MessageSquareText className="h-4 w-4" />
            </div>
            <h1 className="ml-2 text-lg font-semibold text-gray-900 dark:text-gray-100">WA Gateway</h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-500 dark:text-gray-400 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-20" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white">
                  <MessageSquareText className="h-4 w-4" />
                </div>
                <h1 className="ml-2 text-lg font-semibold text-gray-900 dark:text-gray-100">WA Gateway</h1>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-500 dark:text-gray-400 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <nav className="space-y-1">
              <NavLink href="/" icon={<LayoutDashboard className="mr-3 h-5 w-5" />} active={location === "/"}>
                Dashboard
              </NavLink>
              <NavLink 
                href="/connections" 
                icon={<MessageSquareText className="mr-3 h-5 w-5" />} 
                active={location === "/connections"}
              >
                WhatsApp Connections
              </NavLink>
              <NavLink 
                href="/api-keys" 
                icon={<Key className="mr-3 h-5 w-5" />} 
                active={location === "/api-keys"}
              >
                API Keys
              </NavLink>
              <NavLink 
                href="/webhooks" 
                icon={<Webhook className="mr-3 h-5 w-5" />} 
                active={location === "/webhooks"}
              >
                Webhooks
              </NavLink>
              <NavLink 
                href="/logs" 
                icon={<ScrollText className="mr-3 h-5 w-5" />} 
                active={location === "/logs"}
              >
                Logs
              </NavLink>
              <NavLink 
                href="/docs" 
                icon={<FileText className="mr-3 h-5 w-5" />} 
                active={location === "/docs"}
              >
                Documentation
              </NavLink>
            </nav>
            
            <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center">
                <Avatar>
                  <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || "User"} />
                  <AvatarFallback>{getUserInitials(user?.name)}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name || user?.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{user?.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
              <MessageSquareText className="h-6 w-6" />
            </div>
            <h1 className="ml-3 text-xl font-semibold text-gray-900 dark:text-gray-100">WA Gateway</h1>
          </div>
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <NavLink href="/" icon={<LayoutDashboard className="mr-3 h-5 w-5" />} active={location === "/"}>
            Dashboard
          </NavLink>
          <NavLink 
            href="/connections" 
            icon={<MessageSquareText className="mr-3 h-5 w-5" />} 
            active={location === "/connections"}
          >
            WhatsApp Connections
          </NavLink>
          <NavLink 
            href="/api-keys" 
            icon={<Key className="mr-3 h-5 w-5" />} 
            active={location === "/api-keys"}
          >
            API Keys
          </NavLink>
          <NavLink 
            href="/webhooks" 
            icon={<Webhook className="mr-3 h-5 w-5" />} 
            active={location === "/webhooks"}
          >
            Webhooks
          </NavLink>
          <NavLink 
            href="/logs" 
            icon={<ScrollText className="mr-3 h-5 w-5" />} 
            active={location === "/logs"}
          >
            Logs
          </NavLink>
          <NavLink 
            href="/docs" 
            icon={<FileText className="mr-3 h-5 w-5" />} 
            active={location === "/docs"}
          >
            Documentation
          </NavLink>
        </nav>
        
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || "User"} />
              <AvatarFallback>{getUserInitials(user?.name)}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name || user?.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{user?.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
}

function NavLink({ href, children, icon, active }: NavLinkProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-4 py-2.5 text-sm font-medium rounded-md nav-item-transition",
          active
            ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
        )}
      >
        {icon}
        {children}
      </a>
    </Link>
  );
}
