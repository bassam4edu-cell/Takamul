/**
 * Transaction Helpers
 * Provides safe transaction wrappers for database operations
 */

import { sql } from '@vercel/postgres';

/**
 * Execute multiple operations in a transaction
 * Automatically handles BEGIN, COMMIT, and ROLLBACK
 * 
 * @example
 * await withTransaction(async () => {
 *   await sql`DELETE FROM notifications WHERE reference_id = ${id}`;
 *   await sql`DELETE FROM referrals WHERE id = ${id}`;
 * });
 */
export async function withTransaction<T>(
  operations: () => Promise<T>
): Promise<T> {
  try {
    await sql`BEGIN`;
    const result = await operations();
    await sql`COMMIT`;
    return result;
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('Transaction failed, rolled back:', error);
    throw error;
  }
}

/**
 * Execute operations with row-level locking
 * Prevents race conditions when multiple users modify same data
 * 
 * @example
 * await withLocking(async () => {
 *   const grade = await sql`
 *     SELECT * FROM smart_grade_records_v2 
 *     WHERE student_id = ${studentId} AND task_id = ${taskId}
 *     FOR UPDATE
 *   `;
 *   // Now we have exclusive lock, safe to update
 *   await sql`UPDATE smart_grade_records_v2 SET score = ${newScore} ...`;
 * });
 */
export async function withLocking<T>(
  operations: () => Promise<T>
): Promise<T> {
  return withTransaction(operations);
}

/**
 * Safely delete a student and all related data
 * Uses transaction to ensure all-or-nothing deletion
 */
export async function deleteStudentSafely(studentId: number): Promise<void> {
  await withTransaction(async () => {
    // Order matters: delete children first, then parent
    // But with CASCADE, PostgreSQL handles this automatically
    
    // Delete from tables without CASCADE first (if any)
    await sql`DELETE FROM notifications WHERE reference_id IN (
      SELECT id FROM referrals WHERE student_id = ${studentId}
    )`;
    
    // Now delete student - CASCADE will handle the rest
    const result = await sql`DELETE FROM students WHERE id = ${studentId} RETURNING *`;
    
    if (result.rowCount === 0) {
      throw new Error(`Student ${studentId} not found`);
    }
    
    console.log(`Successfully deleted student ${studentId} and all related data`);
  });
}

/**
 * Safely delete a class and all students
 * Uses transaction to ensure consistency
 */
export async function deleteClassSafely(
  grade: string, 
  section: string
): Promise<{ deletedStudents: number }> {
  return await withTransaction(async () => {
    // Get student IDs first
    const students = await sql`
      SELECT id FROM students 
      WHERE grade = ${grade} AND section = ${section}
    `;
    
    const studentIds = students.rows.map(s => s.id);
    
    if (studentIds.length === 0) {
      return { deletedStudents: 0 };
    }
    
    // Delete all notifications for these students' referrals
    await sql`
      DELETE FROM notifications 
      WHERE reference_id IN (
        SELECT id FROM referrals WHERE student_id = ANY(${studentIds})
      )
    `;
    
    // Delete students - CASCADE handles the rest
    await sql`
      DELETE FROM students 
      WHERE grade = ${grade} AND section = ${section}
    `;
    
    console.log(`Successfully deleted class ${grade}-${section}: ${studentIds.length} students`);
    
    return { deletedStudents: studentIds.length };
  });
}

/**
 * Safely save SmartTracker session with all grades
 * Uses transaction to ensure all data is saved or none
 */
export async function saveSmartTrackerSessionSafely(
  sessionData: {
    teacherId: number;
    subject: string;
    grade: string;
    section: string;
    date: string;
    students: Array<{
      id: number;
      attendance: string;
      behaviorChips: string[];
      grades: Record<string, { score: number; maxScore: number }>;
    }>;
    tasks: Array<{
      id: string;
      name: string;
      type: string;
      maxGrade: number;
      category: string;
    }>;
  }
): Promise<{ sessionId: number }> {
  return await withTransaction(async () => {
    // 1. Create session
    const sessionResult = await sql`
      INSERT INTO smart_tracker_sessions (
        teacher_id, subject, grade, section, created_at
      ) VALUES (
        ${sessionData.teacherId},
        ${sessionData.subject},
        ${sessionData.grade},
        ${sessionData.section},
        ${sessionData.date}
      ) RETURNING id
    `;
    
    const sessionId = sessionResult.rows[0].id;
    
    // 2. Save all student states
    for (const student of sessionData.students) {
      await sql`
        INSERT INTO smart_tracker_student_states (
          session_id, student_id, attendance, behavior_chips
        ) VALUES (
          ${sessionId},
          ${student.id},
          ${student.attendance},
          ${JSON.stringify(student.behaviorChips)}
        )
      `;
      
      // 3. Save all grades for this student
      for (const [taskId, gradeData] of Object.entries(student.grades)) {
        if (gradeData.score !== null && gradeData.score !== undefined) {
          // Use upsert to handle duplicate entries
          await sql`
            INSERT INTO smart_grade_records_v2 (
              student_id,
              task_id,
              score,
              max_score,
              updated_at
            ) VALUES (
              ${student.id},
              ${taskId},
              ${gradeData.score},
              ${gradeData.maxScore},
              ${sessionData.date}
            )
            ON CONFLICT (student_id, task_id) 
            DO UPDATE SET 
              score = ${gradeData.score},
              max_score = ${gradeData.maxScore},
              updated_at = ${sessionData.date}
          `;
        }
      }
    }
    
    console.log(`Successfully saved session ${sessionId} with ${sessionData.students.length} students`);
    
    return { sessionId };
  });
}

/**
 * Safely update student grade with locking
 * Prevents race conditions when multiple teachers grade same student
 */
export async function updateGradeSafely(
  studentId: number,
  taskId: string,
  score: number,
  maxScore: number,
  teacherId: number
): Promise<void> {
  await withLocking(async () => {
    // Lock the row for update
    const existing = await sql`
      SELECT * FROM smart_grade_records_v2
      WHERE student_id = ${studentId} AND task_id = ${taskId}
      FOR UPDATE
    `;
    
    if (existing.rowCount === 0) {
      // Insert new
      await sql`
        INSERT INTO smart_grade_records_v2 (
          student_id, task_id, score, max_score, teacher_id, updated_at
        ) VALUES (
          ${studentId}, ${taskId}, ${score}, ${maxScore}, ${teacherId}, NOW()
        )
      `;
    } else {
      // Update existing
      await sql`
        UPDATE smart_grade_records_v2
        SET score = ${score},
            max_score = ${maxScore},
            teacher_id = ${teacherId},
            updated_at = NOW()
        WHERE student_id = ${studentId} AND task_id = ${taskId}
      `;
    }
  });
}

/**
 * Safely transfer student to another class
 * Ensures student data remains consistent
 */
export async function transferStudentSafely(
  studentId: number,
  newGrade: string,
  newSection: string
): Promise<void> {
  await withTransaction(async () => {
    // Get current student data
    const student = await sql`
      SELECT * FROM students WHERE id = ${studentId} FOR UPDATE
    `;
    
    if (student.rowCount === 0) {
      throw new Error(`Student ${studentId} not found`);
    }
    
    const oldGrade = student.rows[0].grade;
    const oldSection = student.rows[0].section;
    
    // Update student
    await sql`
      UPDATE students
      SET grade = ${newGrade}, section = ${newSection}
      WHERE id = ${studentId}
    `;
    
    console.log(`Student ${studentId} transferred from ${oldGrade}-${oldSection} to ${newGrade}-${newSection}`);
  });
}

/**
 * Error types for better error handling
 */
export class TransactionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'TransactionError';
  }
}

export class DeadlockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeadlockError';
  }
}

/**
 * Retry logic for deadlock situations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a deadlock (PostgreSQL error code 40P01)
      if (error && typeof error === 'object' && 'code' in error) {
        const pgError = error as { code: string };
        if (pgError.code === '40P01') {
          console.warn(`Deadlock detected, retry ${attempt}/${maxRetries}`);
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          continue;
        }
      }
      
      // Not a deadlock, throw immediately
      throw error;
    }
  }
  
  throw new DeadlockError(`Operation failed after ${maxRetries} retries: ${lastError?.message}`);
}
