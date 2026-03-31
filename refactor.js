import React, { createContext, useContext, useState, useEffect } from 'react';

export type PassStatus = 'pending' | 'confirmed' | 'rejected';
export type PassType = 'entry' | 'call' | 'exit';

export interface Pass {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  teacherPhone: string;
  period: string;
  type: PassType;
  reason: string;
  timestamp: string;
  status: PassStatus;
  agentName: string;
}

interface PassContextType {
  passes: Pass[];
  addPass: (pass: Omit<Pass, 'status' | 'timestamp'>) => void;
  updatePassStatus: (id: string, status: PassStatus) => void;
}

const PassContext = createContext<PassContextType | undefined>(undefined);

export const PassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPasses = async () => {
    try {
      const response = await fetch('/api/passes');
      if (response.ok) {
        const data = await response.json();
        setPasses(data);
      }
    } catch (error) {
      console.error('Failed to fetch passes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
    // Poll for updates every 10 seconds for "Live" feel
    const interval = setInterval(fetchPasses, 10000);
    return () => clearInterval(interval);
  }, []);

  const addPass = async (newPassData: Omit<Pass, 'status' | 'timestamp'>) => {
    const timestamp = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const newPass: Pass = {
      ...newPassData,
      status: 'pending',
      timestamp,
    };

    // Optimistic update
    setPasses(prev => [newPass, ...prev]);

    try {
      const response = await fetch('/api/passes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPass),
      });
      if (!response.ok) {
        throw new Error('Failed to save pass');
      }
    } catch (error) {
      console.error('Error adding pass:', error);
      // Rollback or show error
      fetchPasses();
    }
  };

  const updatePassStatus = async (id: string, status: PassStatus) => {
    // Optimistic update
    setPasses(prev => prev.map(p => p.id === id ? { ...p, status } : p));

    try {
      const response = await fetch(`/api/passes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update pass status');
      }
    } catch (error) {
      console.error('Error updating pass status:', error);
      fetchPasses();
    }
  };

  return (
    <PassContext.Provider value={{ passes, addPass, updatePassStatus }}>
      {children}
    </PassContext.Provider>
  );
};

export const usePasses = () => {
  const context = useContext(PassContext);
  if (!context) {
    throw new Error('usePasses must be used within a PassProvider');
  }
  return context;
};
