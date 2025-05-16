import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Link } from "wouter";

interface StatsCardProps {
  icon: ReactNode;
  iconBackground: string;
  iconColor: string;
  title: string;
  value: number | string;
  linkHref: string;
  linkText: string;
}

export function StatsCard({
  icon,
  iconBackground,
  iconColor,
  title,
  value,
  linkHref,
  linkText
}: StatsCardProps) {
  return (
    <Card className="bg-white overflow-hidden shadow hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className={cn(
              "flex-shrink-0 rounded-md p-3",
              iconBackground
            )}>
              <div className={cn("text-xl", iconColor)}>
                {icon}
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {title}
                </dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {value}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <Link href={linkHref}>
              <a className="font-medium text-primary hover:text-primary/80 transition-colors">
                {linkText} <span aria-hidden="true">&rarr;</span>
              </a>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
