export type Role = 'teacher' | 'vice_principal' | 'counselor' | 'admin' | 'principal' | 'super_admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  school_id?: number;
  schoolId?: number;
  assigned_grades?: string[];
  is_active?: boolean;
}

export interface Student {
  id: number;
  name: string;
  national_id: string;
  grade: string;
  section: string;
  behavior_score?: number;
  bonus_score?: number;
  attendance_score?: number;
  parent_phone?: string;
}

export interface Referral {
  id: number;
  student_id: number;
  student_name: string;
  student_national_id?: string;
  student_grade: string;
  student_section: string;
  student_behavior_score?: number;
  teacher_id: number;
  teacher_name: string;
  assigned_to_id: number | null;
  type: 'behavior' | 'academic' | 'attendance' | 'uniform';
  severity: 'low' | 'medium' | 'high';
  reason: string;
  teacher_notes: string;
  remedial_plan?: string;
  remedial_plan_file?: string;
  status: 'pending_vp' | 'pending_counselor' | 'scheduled_meeting' | 'resolved' | 'closed' | 'returned_to_teacher';
  created_at: string;
  violation_id?: number;
  violation_name?: string;
  violation_degree?: number;
  violation_points?: number;
  applied_remedial_actions?: string[];
}

export interface ReferralLog {
  id: number;
  referral_id: number;
  user_id: number;
  user_name: string;
  user_role: Role;
  action: string;
  notes: string;
  evidence_file?: string;
  evidence_text?: string;
  created_at: string;
}
