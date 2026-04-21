import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface AppNotification {
    id: string;
    employeId: number;
    message: string;
    read: boolean;
    timestamp: string;
}

const STORAGE_KEY = 'rh_notifications';

function loadNotifications(): AppNotification[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveNotifications(notifs: AppNotification[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
}

interface NotificationContextType {
    notifications: AppNotification[];
    addNotification: (employeId: number, message: string) => void;
    markAllRead: (employeId: number) => void;
    unreadCount: (employeId: number) => number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>(loadNotifications);

    const addNotification = useCallback((employeId: number, message: string) => {
        const newNotif: AppNotification = {
            id: `${Date.now()}-${Math.random()}`,
            employeId,
            message,
            read: false,
            timestamp: new Date().toISOString(),
        };
        setNotifications((prev) => {
            const updated = [newNotif, ...prev];
            saveNotifications(updated);
            return updated;
        });
    }, []);

    const markAllRead = useCallback((employeId: number) => {
        setNotifications((prev) => {
            const updated = prev.map((n) =>
                n.employeId === employeId ? { ...n, read: true } : n
            );
            saveNotifications(updated);
            return updated;
        });
    }, []);

    const unreadCount = useCallback(
        (employeId: number) =>
            notifications.filter((n) => n.employeId === employeId && !n.read).length,
        [notifications]
    );

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, markAllRead, unreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
};
