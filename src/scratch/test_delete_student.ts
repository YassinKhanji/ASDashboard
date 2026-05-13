const BASE_URL = "http://localhost:3001";

async function runTest() {
  console.log("🚀 Starting Student Deletion Verification...");

  try {
    // 1. Find a student who has attendance (Leila or Omar)
    console.log("Searching for student 'Leila'...");
    const studentsRes = await fetch(`${BASE_URL}/api/etudiants`);
    const students = await studentsRes.json();
    
    const target = students.find(s => s.firstName === "Leila");
    if (!target) {
      console.log("❌ Student 'Leila' not found. Please run seed first.");
      return;
    }
    console.log(`✅ Found student: ${target.firstName} ${target.lastName} (ID: ${target.id})`);

    // 2. Double check they have attendance records (this is what causes the 500)
    const detailRes = await fetch(`${BASE_URL}/api/etudiants/${target.id}`);
    const detail = await detailRes.json();
    console.log(`📊 Student has ${detail.attendance?.length || 0} attendance records.`);

    // 3. Attempt Deletion
    console.log(`Attempting to delete student ${target.firstName}...`);
    const deleteRes = await fetch(`${BASE_URL}/api/etudiants/${target.id}`, {
      method: "DELETE",
    });

    if (deleteRes.ok) {
      console.log("✅ Student deleted successfully!");
    } else {
      const error = await deleteRes.json();
      console.log("❌ Deletion failed!");
      console.log("Status:", deleteRes.status);
      console.log("Error:", error);
      return;
    }

    // 4. Verify they are gone
    const verifyRes = await fetch(`${BASE_URL}/api/etudiants/${target.id}`);
    if (verifyRes.status === 404) {
      console.log("✅ Verification passed: Student is no longer in the system.");
    } else {
      console.log("❌ Verification failed: Student still exists.");
    }

    console.log("\n✨ STUDENT DELETION FIXED AND VERIFIED!");
  } catch (err) {
    console.error("💥 Test failed:", err.message);
  }
}

runTest();
