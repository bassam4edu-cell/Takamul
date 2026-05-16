/**
 * EXAMPLES: How to update server.ts endpoints to use transactions
 * Replace the unsafe code with these safe versions
 */

import { 
  withTransaction, 
  deleteStudentSafely, 
  deleteClassSafely,
  saveSmartTrackerSessionSafely,
  updateGradeSafely,
  transferStudentSafely,
  withRetry
} from '../utils/transactions';

// ==========================================
// EXAMPLE 1: Delete Student (Admin Endpoint)
// ==========================================

// ❌ OLD CODE (UNSAFE):
app.delete("/api/admin/students/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM notifications WHERE reference_id IN (SELECT id FROM referrals WHERE student_id = ${id})`;
    await sql`DELETE FROM referral_logs WHERE referral_id IN (SELECT id FROM referrals WHERE student_id = ${id})`;
    await sql`DELETE FROM referrals WHERE student_id = ${id}`;
    await sql`DELETE FROM student_score_logs WHERE student_id = ${id}`;
    await sql`DELETE FROM attendance_records WHERE student_id = ${id}`;
    await sql`DELETE FROM smart_tracker_student_states WHERE student_id = ${id}`;
    await sql`DELETE FROM students WHERE id = ${id}`;
    // If any DELETE fails here... data corruption! ❌
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete student" });
  }
});

// ✅ NEW CODE (SAFE WITH TRANSACTION):
app.delete("/api/admin/students/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await deleteStudentSafely(parseInt(id));
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete student:', err);
    res.status(500).json({ error: "Failed to delete student" });
  }
});


// ==========================================
// EXAMPLE 2: Delete Class
// ==========================================

// ❌ OLD CODE (UNSAFE):
app.delete("/api/admin/class", async (req, res) => {
  const { grade, section } = req.body;
  try {
    const students = await sql`SELECT id FROM students WHERE grade = ${grade} AND section = ${section}`;
    const studentIds = students.rows.map(s => s.id);
    
    if (studentIds.length > 0) {
      await sql`DELETE FROM notifications WHERE reference_id IN (SELECT id FROM referrals WHERE student_id = ANY(${studentIds}))`;
      await sql`DELETE FROM referral_logs WHERE referral_id IN (SELECT id FROM referrals WHERE student_id = ANY(${studentIds}))`;
      await sql`DELETE FROM referrals WHERE student_id = ANY(${studentIds})`;
      await sql`DELETE FROM student_score_logs WHERE student_id = ANY(${studentIds})`;
      await sql`DELETE FROM attendance_records WHERE student_id = ANY(${studentIds})`;
      await sql`DELETE FROM smart_tracker_student_states WHERE student_id = ANY(${studentIds})`;
      await sql`DELETE FROM students WHERE id = ANY(${studentIds})`;
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete class" });
  }
});

// ✅ NEW CODE (SAFE):
app.delete("/api/admin/class", async (req, res) => {
  const { grade, section } = req.body;
  try {
    const result = await deleteClassSafely(grade, section);
    res.json({ 
      success: true, 
      deletedStudents: result.deletedStudents 
    });
  } catch (err) {
    console.error('Failed to delete class:', err);
    res.status(500).json({ error: "Failed to delete class" });
  }
});


// ==========================================
// EXAMPLE 3: Save SmartTracker Session
// ==========================================

// ❌ OLD CODE (UNSAFE - lots of separate INSERTs):
app.post("/api/tracker/session", async (req, res) => {
  const { teacherId, subject, grade, section, date, students, tasks } = req.body;
  
  try {
    // Create session
    const session = await sql`INSERT INTO smart_tracker_sessions (...) RETURNING id`;
    const sessionId = session.rows[0].id;
    
    // Save students (if this fails halfway, session exists but incomplete!)
    for (const student of students) {
      await sql`INSERT INTO smart_tracker_student_states (...)`;
      
      // Save grades (if this fails, some students have grades, others don't!)
      for (const [taskId, grade] of Object.entries(student.grades)) {
        await sql`INSERT INTO smart_grade_records_v2 (...)`;
      }
    }
    
    res.json({ success: true, sessionId });
  } catch (err) {
    // Session might be half-saved! ❌
    res.status(500).json({ error: "Failed to save session" });
  }
});

// ✅ NEW CODE (SAFE - all-or-nothing):
app.post("/api/tracker/session", async (req, res) => {
  const { teacherId, subject, grade, section, date, students, tasks } = req.body;
  
  try {
    const result = await saveSmartTrackerSessionSafely({
      teacherId,
      subject,
      grade,
      section,
      date,
      students,
      tasks
    });
    
    res.json({ success: true, sessionId: result.sessionId });
  } catch (err) {
    console.error('Failed to save session:', err);
    res.status(500).json({ error: "Failed to save session" });
  }
});


// ==========================================
// EXAMPLE 4: Update Grade (with race condition protection)
// ==========================================

// ❌ OLD CODE (RACE CONDITION POSSIBLE):
app.post("/api/grades/update", async (req, res) => {
  const { studentId, taskId, score, maxScore } = req.body;
  const teacherId = req.user.id;
  
  try {
    // Two teachers could update at the same time!
    // Last one wins, first one's change is lost ❌
    await sql`
      INSERT INTO smart_grade_records_v2 (student_id, task_id, score, max_score, teacher_id)
      VALUES (${studentId}, ${taskId}, ${score}, ${maxScore}, ${teacherId})
      ON CONFLICT (student_id, task_id) DO UPDATE SET score = ${score}
    `;
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update grade" });
  }
});

// ✅ NEW CODE (PROTECTED WITH LOCKING):
app.post("/api/grades/update", async (req, res) => {
  const { studentId, taskId, score, maxScore } = req.body;
  const teacherId = req.user.id;
  
  try {
    // Retry up to 3 times in case of deadlock
    await withRetry(async () => {
      await updateGradeSafely(studentId, taskId, score, maxScore, teacherId);
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to update grade:', err);
    res.status(500).json({ error: "Failed to update grade" });
  }
});


// ==========================================
// EXAMPLE 5: Transfer Student
// ==========================================

// ❌ OLD CODE (UNSAFE):
app.post("/api/students/:id/transfer", async (req, res) => {
  const { id } = req.params;
  const { newGrade, newSection } = req.body;
  
  try {
    await sql`UPDATE students SET grade = ${newGrade}, section = ${newSection} WHERE id = ${id}`;
    // What about their attendance records? Grades? Still point to old class! ❌
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to transfer student" });
  }
});

// ✅ NEW CODE (SAFE):
app.post("/api/students/:id/transfer", async (req, res) => {
  const { id } = req.params;
  const { newGrade, newSection } = req.body;
  
  try {
    await transferStudentSafely(parseInt(id), newGrade, newSection);
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to transfer student:', err);
    res.status(500).json({ error: "Failed to transfer student" });
  }
});


// ==========================================
// EXAMPLE 6: Batch Operations
// ==========================================

// ✅ NEW CODE: Delete multiple referrals safely
app.post("/api/referrals/delete-batch", async (req, res) => {
  const { referralIds } = req.body;
  
  try {
    await withTransaction(async () => {
      // Delete notifications first
      await sql`DELETE FROM notifications WHERE reference_id = ANY(${referralIds})`;
      
      // Delete logs
      await sql`DELETE FROM referral_logs WHERE referral_id = ANY(${referralIds})`;
      
      // Delete referrals
      await sql`DELETE FROM referrals WHERE id = ANY(${referralIds})`;
    });
    
    res.json({ success: true, deleted: referralIds.length });
  } catch (err) {
    console.error('Failed to delete referrals:', err);
    res.status(500).json({ error: "Failed to delete referrals" });
  }
});


// ==========================================
// EXAMPLE 7: Complex Multi-Table Update
// ==========================================

// ✅ NEW CODE: Update student and related data atomically
app.post("/api/students/:id/update-full", async (req, res) => {
  const { id } = req.params;
  const { name, nationalId, grade, section, parentPhone } = req.body;
  
  try {
    await withTransaction(async () => {
      // Update student
      await sql`
        UPDATE students
        SET name = ${name},
            national_id = ${nationalId},
            grade = ${grade},
            section = ${section}
        WHERE id = ${id}
      `;
      
      // Update parent contact
      if (parentPhone) {
        await sql`
          UPDATE students
          SET parent_phone = ${parentPhone}
          WHERE id = ${id}
        `;
      }
      
      // Log the change
      await sql`
        INSERT INTO audit_log (table_name, record_id, action, new_data, user_id)
        VALUES ('students', ${id}, 'UPDATE', ${JSON.stringify({ name, nationalId, grade, section })}, ${req.user.id})
      `;
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to update student:', err);
    res.status(500).json({ error: "Failed to update student" });
  }
});


// ==========================================
// MIGRATION CHECKLIST
// ==========================================

/**
 * To migrate your server.ts:
 * 
 * 1. Import transaction helpers at the top:
 *    import { withTransaction, deleteStudentSafely, ... } from './utils/transactions';
 * 
 * 2. Find all endpoints that do multiple DELETEs/INSERTs/UPDATEs
 * 
 * 3. Wrap them in withTransaction() or use the helper functions
 * 
 * 4. Test thoroughly:
 *    - Try deleting students
 *    - Try saving sessions
 *    - Try updating grades from multiple browsers simultaneously
 *    - Try killing the server mid-operation (should rollback)
 * 
 * 5. Monitor logs for "ROLLBACK" messages (indicates failed operations)
 * 
 * 6. Add more helper functions as needed for your specific operations
 */
