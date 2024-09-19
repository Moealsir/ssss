import React, { useEffect } from "react";

interface FloatingMessageProps {
  message: string;
  onClose: () => void;
}

const FloatingMessage: React.FC<FloatingMessageProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000); // Auto close after 3 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg">
      {message}
    </div>
  );
};

export default FloatingMessage;
