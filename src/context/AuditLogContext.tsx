import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  actionType: string;
  details: string;
  userName?: string;
  userRole?: string;
  ip?: string;
}

interface AuditLogContextType {
  auditLog: AuditLogEntry[];
  logAction: (actionType: string, details: string) => void;
}

const AuditLogContext = createContext<AuditLogContextType | undefined>(undefined);

export const AuditLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const { user } = useAuth();

  const logAction = (actionType: string, details: string) => {
    const newEntry: AuditLogEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      actionType,
      details,
      userName: user ? user.name : 'النظام الآلي',
      userRole: user ? user.role : 'نظام',
      ip: '127.0.0.1'
    };
    setAuditLog(prev => [newEntry, ...prev]);
  };

  return (
    <AuditLogContext.Provider value={{ auditLog, logAction }}>
      {children}
    </AuditLogContext.Provider>
  );
};

export const useAuditLog = () => {
  const context = useContext(AuditLogContext);
  if (context === undefined) {
    throw new Error('useAuditLog must be used within an AuditLogProvider');
  }
  return context;
};
