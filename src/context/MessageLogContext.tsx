import React, { createContext, useContext, useState, useEffect } from 'react';

export interface MessageLogEntry {
  id: string;
  timestamp: string;
  recipient: string;
  recipientPhone: string;
  messageType: string;
  messageText: string;
  status: 'success' | 'failed';
}

interface MessageLogContextType {
  globalMessageLog: MessageLogEntry[];
  addLogEntry: (entry: Omit<MessageLogEntry, 'id' | 'timestamp'>) => void;
  clearLog: () => void;
}

const MessageLogContext = createContext<MessageLogContextType | undefined>(undefined);

export const MessageLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [globalMessageLog, setGlobalMessageLog] = useState<MessageLogEntry[]>(() => {
    const saved = localStorage.getItem('globalMessageLog');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('globalMessageLog', JSON.stringify(globalMessageLog));
  }, [globalMessageLog]);

  const addLogEntry = (entry: Omit<MessageLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: MessageLogEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString()
    };
    setGlobalMessageLog(prev => [newEntry, ...prev]);
  };

  const clearLog = () => {
    setGlobalMessageLog([]);
  };

  return (
    <MessageLogContext.Provider value={{ globalMessageLog, addLogEntry, clearLog }}>
      {children}
    </MessageLogContext.Provider>
  );
};

export const useMessageLog = () => {
  const context = useContext(MessageLogContext);
  if (context === undefined) {
    throw new Error('useMessageLog must be used within a MessageLogProvider');
  }
  return context;
};
