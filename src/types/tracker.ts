export interface Student {
  id: number;
  name: string;
  avatar: string;
  semesterAttendance: number;
}

export type TaskCategory = 'participation' | 'homework' | 'performance' | 'exams';

export interface Task {
  id: string;
  name: string;
  maxGrade: number;
  type: 'number' | 'binary';
  date?: string;
}

export interface TeacherAssignment {
  class_id: string;
  subject_name: string;
  subject_id: number;
  grade: string;
  semester: string;
}

export interface GradeRecord {
  score: number | '';
  recordedAtClassId?: string;
  teacherId?: number;
}

export interface StudentState {
  attendance: 'present' | 'late' | 'absent';
  grades: Record<string, GradeRecord>;
  behaviorChips: string[];
  noorExportData?: {
    performanceTotal: number;
    evaluationTotal: number;
  };
}
