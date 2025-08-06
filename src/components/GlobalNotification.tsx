import React from 'react';
import { useGlobalNotification } from '@/contexts/NotificationContext';
import { Notification } from '@/components/ui/notification';

export default function GlobalNotification() {
  const { notification, hideNotification } = useGlobalNotification();

  if (!notification) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999]">
      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />
    </div>
  );
}