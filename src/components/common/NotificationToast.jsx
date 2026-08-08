import React, { useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext';
import { X, Bell } from 'lucide-react';

let socket = null;

export default function NotificationToast() {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    if (!socket) {
      socket = io('http://localhost:5001');
    }

    const handleWorkflowUpdate = (data) => {
      // Don't show toast if the user themselves triggered the action
      if (data.actionBy === user.name) return;

      const newNotif = {
        id: Date.now(),
        ...data
      };

      setNotifications((prev) => [newNotif, ...prev]);

      // Auto-hide after 5 seconds
      setTimeout(() => {
        removeNotification(newNotif.id);
      }, 5000);
    };

    socket.on('workflow_update', handleWorkflowUpdate);

    return () => {
      socket.off('workflow_update', handleWorkflowUpdate);
    };
  }, [user]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {notifications.map((notif) => (
        <div key={notif.id} className="bg-white dark:bg-slate-800 border-l-4 border-blue-500 shadow-xl rounded-r-lg flex items-start gap-3 p-4 min-w-[300px] max-w-sm pointer-events-auto transform transition-all duration-300 translate-y-0 opacity-100">
          <div className="text-blue-500 mt-0.5">
            <Bell size={18} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              ওয়ার্কফ্লো আপডেট ({notif.track})
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-blue-600 dark:text-blue-400">{notif.actionBy}</span> নিউজটি 
              <span className="italic"> "{notif.title}" </span> 
              <span className="font-semibold bg-gray-100 dark:bg-slate-700 px-1 mx-1 rounded">{notif.workflowStage}</span> 
              স্টেজে পাঠিয়েছেন।
            </p>
            {notif.note && (
              <p className="text-[11px] mt-2 text-gray-500 italic bg-gray-50 dark:bg-slate-700/50 p-2 rounded">
                "{notif.note}"
              </p>
            )}
          </div>
          <button onClick={() => removeNotification(notif.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
