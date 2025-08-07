import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface NotificationData {
  type: 'success' | 'error';
  title: string;
  message: string;
}

interface NotificationContextType {
  notification: NotificationData | null;
  showNotification: (notification: NotificationData) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationData | null>(null);

  const showNotification = (notificationData: NotificationData) => {
    setNotification(notificationData);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ notification, showNotification, hideNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useGlobalNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useGlobalNotification must be used within a NotificationProvider');
  }
  return context;
}