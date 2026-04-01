import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export interface SchoolSettings {
  schoolName: string;
  schoolLogo?: string;
  generalDirectorateName: string;
  principalName: string;
}

interface SchoolContextType {
  settings: SchoolSettings;
  updateSettings: (newSettings: Partial<SchoolSettings>) => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: SchoolSettings = {
  schoolName: 'ثانوية أم القرى',
  generalDirectorateName: 'الإدارة العامة للتعليم بمنطقة الرياض',
  principalName: '',
};

export const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const useSchoolSettings = () => {
  const context = useContext(SchoolContext);
  if (!context) throw new Error('useSchoolSettings must be used within SchoolProvider');
  return context;
};

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SchoolSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiFetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings({
            schoolName: data.school_name || 'ثانوية أم القرى',
            schoolLogo: data.school_logo || '',
            generalDirectorateName: data.general_directorate_name || 'الإدارة العامة للتعليم بمنطقة الرياض',
            principalName: data.principal_name || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch school settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<SchoolSettings>) => {
    try {
      const payload = {
        settings: {
          school_name: newSettings.schoolName ?? settings.schoolName,
          school_logo: newSettings.schoolLogo ?? settings.schoolLogo,
          general_directorate_name: newSettings.generalDirectorateName ?? settings.generalDirectorateName,
          principal_name: newSettings.principalName ?? settings.principalName,
        }
      };

      const response = await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev, ...newSettings }));
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving school settings:', error);
      throw error;
    }
  };

  return (
    <SchoolContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SchoolContext.Provider>
  );
};
