import { useState, useEffect } from "react";
import { relativeTime, formatDateTime } from "@/lib/utils";

interface RelativeTimeProps {
  date: string | Date;
  updateInterval?: number;
}

export function RelativeTime({ date, updateInterval = 60000 }: RelativeTimeProps) {
  const [timeStr, setTimeStr] = useState(relativeTime(date));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeStr(relativeTime(date));
    }, updateInterval);
    
    return () => clearInterval(interval);
  }, [date, updateInterval]);
  
  return (
    <span title={formatDateTime(date)}>
      {timeStr}
    </span>
  );
}
