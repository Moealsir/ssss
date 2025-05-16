import { Button } from "@/components/ui/button";
import { Clipboard, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showCopy?: boolean;
}

export function CodeBlock({ code, language = "bash", title, showCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy code to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md mb-4">
      {title && (
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{title}</p>
      )}
      <div className="relative">
        <pre className="code-block overflow-x-auto">
          <code className={`language-${language} text-xs text-gray-800 dark:text-gray-300`}>
            {code}
          </code>
        </pre>
        {showCopy && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Clipboard className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
