export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'READ';
export type ActionCategory = 'إدارة مستخدمين' | 'أكاديمي' | 'سلوكي' | 'حضور وغياب' | 'إعدادات نظام' | 'مصادقة/دخول' | 'مصادقة/خروج' | 'التحويلات' | 'متابعة' | 'أخرى';

export interface AuditActor {
  id: string | number;
  name: string;
  role: string;
}

export interface StateDiff {
  old?: any;
  new?: any;
}

export interface AuditLog {
  id: string;
  actor: AuditActor;
  actionCategory: ActionCategory;
  actionType: ActionType;
  module: string;
  detailedMessage: string;
  stateDiff?: StateDiff;
  timestamp: string;
}

export const logAction = (
  actionCategory: ActionCategory,
  actionType: ActionType,
  module: string,
  detailedMessage: string,
  stateDiff?: StateDiff,
  explicitActor?: AuditActor // Optional, in case we want to override (like during login before state is set)
) => {
  try {
    let actor = explicitActor;
    if (!actor) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        actor = {
          id: user.id,
          name: user.name,
          role: user.role
        };
      } else {
        actor = {
          id: 'system',
          name: 'النظام',
          role: 'system'
        };
      }
    }

    const existingLogsStr = localStorage.getItem('takamol_audit_logs');
    const existingLogs: AuditLog[] = existingLogsStr ? JSON.parse(existingLogsStr) : [];
    
    const now = new Date();
    // Format: DD/MM/YYYY HH:mm:ss
    const timestamp = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    const newLog: AuditLog = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      actor,
      actionCategory,
      actionType,
      module,
      detailedMessage,
      stateDiff,
      timestamp
    };
    
    const updatedLogs = [newLog, ...existingLogs];
    localStorage.setItem('takamol_audit_logs', JSON.stringify(updatedLogs));
    
    // Dispatch event for real-time updates if needed
    window.dispatchEvent(new Event('takamol_audit_logs_updated'));
  } catch (error) {
    console.error('Failed to log action:', error);
  }
};
