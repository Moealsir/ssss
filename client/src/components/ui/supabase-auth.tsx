import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { FiMail, FiLock, FiUser, FiAlertTriangle } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "@/hooks/use-toast";

interface SupabaseAuthProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister: (email: string, password: string, name: string) => Promise<boolean>;
  onGoogleLogin?: () => Promise<void>;
}

export function SupabaseAuth({ onLogin, onRegister, onGoogleLogin }: SupabaseAuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const success = await onLogin(email, password);
        if (!success) {
          setError("Invalid email or password");
        }
      } else {
        if (!name.trim()) {
          setError("Name is required");
          setLoading(false);
          return;
        }
        
        const success = await onRegister(email, password, name);
        if (!success) {
          setError("Registration failed. Email may already be in use.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!onGoogleLogin) return;
    
    setError(null);
    setLoading(true);
    
    try {
      await onGoogleLogin();
    } catch (err) {
      console.error(err);
      setError("Google authentication failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
          {isLogin 
            ? "Sign in to your account to continue to WhatsApp API Gateway." 
            : "Create a new account to get started with WhatsApp API Gateway."}
        </p>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-800">
          <FiAlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <FiUser className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                id="name" 
                placeholder="Enter your name" 
                className="pl-10"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <FiMail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <FiLock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              className="pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading 
            ? "Loading..." 
            : isLogin ? "Sign In" : "Create Account"}
        </Button>
      </form>
      
      {onGoogleLogin && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <FcGoogle className="mr-2 h-5 w-5" />
            Google
          </Button>
        </>
      )}
      
      <div className="mt-6 text-center text-sm">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          className="text-primary underline hover:text-primary/80 font-medium"
          onClick={() => setIsLogin(!isLogin)}
          disabled={loading}
        >
          {isLogin ? "Sign up" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
