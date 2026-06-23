"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { getNotifications, markAsRead, Notification } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Initial fetch
    getNotifications().then(data => setNotifications(data));
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    const success = await markAsRead(id);
    if (success) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative h-8 w-8 rounded-full outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-center text-slate-400 hover:bg-slate-800 transition-colors">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-slate-950"></span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 bg-slate-900 border-slate-800 text-slate-300 mr-4" align="end">
        <DropdownMenuLabel className="font-normal flex justify-between items-center">
          <span className="font-semibold text-white">Notifications</span>
          {unreadCount > 0 && <span className="text-xs text-indigo-400">{unreadCount} new</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-800" />
        
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={cn(
                  "p-3 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors cursor-pointer",
                  !notif.is_read && "bg-slate-800/20"
                )}
                onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "mt-1 h-2 w-2 rounded-full shrink-0",
                    !notif.is_read ? "bg-indigo-500" : "bg-transparent"
                  )} />
                  <div className="flex-1 space-y-1">
                    <p className={cn(
                      "text-sm leading-none",
                      notif.type === 'warning' ? "text-amber-400" :
                      notif.type === 'success' ? "text-emerald-400" : "text-slate-200",
                      !notif.is_read ? "font-medium" : "font-normal"
                    )}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
