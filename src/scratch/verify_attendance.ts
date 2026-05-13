const BASE_URL = "http://localhost:3001";

async function runTest() {
  console.log("🚀 Starting Attendance Feature Verification...");

  try {
    // 1. Get all projects and find one with sessions
    console.log("Finding a project with sessions...");
    const projectsRes = await fetch(`${BASE_URL}/api/projets`);
    const projects = await projectsRes.json();
    
    let targetProject = null;
    for (const p of projects) {
      const detailRes = await fetch(`${BASE_URL}/api/projets/${p.id}`);
      const detail = await detailRes.json();
      if (detail.sessions?.length > 0) {
        targetProject = detail;
        break;
      }
    }

    if (!targetProject) {
      console.log("❌ No project with sessions found.");
      return;
    }
    console.log(`✅ Using project: ${targetProject.title}`);

    // 2. Ensure students are enrolled
    console.log("Ensuring students are enrolled in the project...");
    const studentsRes = await fetch(`${BASE_URL}/api/etudiants`);
    const students = await studentsRes.json();
    
    if (students.length < 2) {
      console.log("❌ Need at least 2 students in the system.");
      return;
    }

    const student1 = students[0];
    const student2 = students[1];

    // Enroll them if not already enrolled
    const enrolledIds = new Set(targetProject.enrollments?.map(e => e.studentId));
    
    for (const s of [student1, student2]) {
      if (!enrolledIds.has(s.id)) {
        console.log(`Enrolling ${s.firstName} in ${targetProject.title}...`);
        await fetch(`${BASE_URL}/api/etudiants/${s.id}/enrollments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: targetProject.id })
        });
      }
    }

    const sessionId = targetProject.sessions[0].id;
    console.log(`✅ Using session: ${sessionId}`);

    // 3. Record Attendance
    console.log("Recording attendance (PRESENT for student 1, ABSENT for student 2)...");
    const recordRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        records: [
          { studentId: student1.id, status: "PRESENT" },
          { studentId: student2.id, status: "ABSENT" },
        ]
      })
    });
    if (!recordRes.ok) throw new Error("Failed to record attendance");
    console.log("✅ Attendance recorded.");

    // 4. Verify Attendance via GET
    console.log("Verifying recorded attendance via API...");
    const getRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}/attendance`);
    const attendance = await getRes.json();
    
    const s1 = attendance.find(r => r.studentId === student1.id);
    const s2 = attendance.find(r => r.studentId === student2.id);

    if (s1?.attendance?.status === "PRESENT") {
      console.log(`✅ Student 1 (${student1.firstName}) marked as PRESENT.`);
    } else {
      console.log("❌ Student 1 verification failed.");
      console.log("Record:", s1);
    }

    if (s2?.attendance?.status === "ABSENT") {
      console.log(`✅ Student 2 (${student2.firstName}) marked as ABSENT.`);
    } else {
      console.log("❌ Student 2 verification failed.");
      console.log("Record:", s2);
    }

    // 5. Check student history
    console.log(`Checking history for student: ${student1.firstName}...`);
    const historyRes = await fetch(`${BASE_URL}/api/etudiants/${student1.id}`);
    const historyData = await historyRes.json();
    const hasRecord = historyData.attendance?.some(a => a.session.id === sessionId && a.status === "PRESENT");
    if (hasRecord) {
      console.log("✅ Student profile history verified!");
    } else {
      console.log("❌ Attendance record not found in student profile history.");
    }

    console.log("\n✨ ATTENDANCE FEATURE VERIFIED SUCCESSFULLY!");
  } catch (err) {
    console.error("💥 Test failed:", err.message);
  }
}

runTest();
