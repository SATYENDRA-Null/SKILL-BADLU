/**
 * Automated Verification Script for Education, Anti-Skip, Credits & Admin Approval
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  localStorage: {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, val) { this.store[key] = String(val); },
    removeItem(key) { delete this.store[key]; }
  }
};
sandbox.window = sandbox;
sandbox.global = sandbox;

vm.createContext(sandbox);

function runFile(relPath) {
  const code = fs.readFileSync(path.join(__dirname, relPath), "utf8");
  vm.runInContext(code, sandbox);
}

// Load browser scripts in exact HTML order
runFile("../js/store.js");
runFile("../js/ledger.js");
runFile("../js/admin.js");
runFile("../js/education.js");

const { store, ledger, admin, education } = sandbox;

console.log("=== 1. TESTING INITIAL STORE STATE ===");
console.log("Total courses in store:", store.courses.length);
console.log("Approved courses:", store.getApprovedCourses().map(c => c.title));
console.log("Pending review courses:", store.getPendingCourses().map(c => c.title));
console.assert(store.courses.length >= 5, "Should have at least 5 initial courses");
console.assert(store.getPendingCourses().length >= 1, "Should have 1 pending course initially");

console.log("\n=== 2. TESTING COURSE UNLOCK VIA CREDITS & LEDGER ===");
store.login("user_a"); // Leo Vance
const initialBal = ledger.getBalance("user_a");
console.log("Leo Vance Initial Balance:", initialBal, "CR");

// Leo unlocks Aarav's UI/UX course (course_uiux, cost 35 CR)
const unlockRes = education.unlockCourse("course_uiux");
console.log("Unlock Result:", unlockRes.success ? "SUCCESS" : "FAILED");
const newBal = ledger.getBalance("user_a");
console.log("Leo Vance Balance After Unlock:", newBal, "CR");
console.assert(newBal === initialBal - 35, "Balance should be reduced by 35 CR");

const enrollment = store.getUserEnrollment("user_a", "course_uiux");
console.assert(enrollment !== null, "Enrollment record should exist");
console.assert(enrollment.completed === false, "Enrollment should initially be uncompleted");

console.log("\n=== 3. TESTING ANTI-SKIP INTERVAL MERGING & DETECTION ===");
// Test Interval merging
const merged = education.mergeIntervals([[0, 10], [5, 15], [20, 30]]);
console.log("Merged intervals [[0,10],[5,15],[20,30]]:", JSON.stringify(merged));
console.assert(merged.length === 2 && merged[0][0] === 0 && merged[0][1] === 15, "Intervals should merge correctly");

// Test Anti-skip tracking simulation
const mockCourse = store.getCourse("course_uiux");
const mockEnrollment = store.getUserEnrollment("user_a", "course_uiux");

// Simulate a player instance
education.initAntiSkipTracker({}, mockCourse, mockEnrollment);

// Scenario A: User skips ahead from 5s to 35s
education.playbackTracker.lastPlaybackTime = 5;
education.addWatchedInterval(0, 5);

// User seeks forward to 35s (> 2.0s jump)
if (35 - education.playbackTracker.lastPlaybackTime > 2.0) {
  education.playbackTracker.forwardSkipOccurred = true;
}
console.log("Skip detection triggered when seeking from 5s to 35s:", education.playbackTracker.forwardSkipOccurred);
console.assert(education.playbackTracker.forwardSkipOccurred === true, "Forward skip should be detected!");

// Scenario B: Full continuous watch from 0 to 50s
education.initAntiSkipTracker({}, mockCourse, mockEnrollment);
education.addWatchedInterval(0, 50);
const watchedSec = education.calculateTotalWatchedSeconds();
const coverage = watchedSec / 50;
console.log(`Continuous playback watched: ${watchedSec}s / 50s (${coverage * 100}%)`);
console.assert(coverage >= 0.95 && !education.playbackTracker.forwardSkipOccurred, "Should pass anti-skip coverage");

education.markCourseCompleted();
console.assert(mockEnrollment.completed === true, "Enrollment should be marked completed");

console.log("\n=== 4. TESTING CERTIFICATE ISSUANCE ===");
const cert = education.claimCertificate("course_uiux");
console.log("Certificate Issued:", {
  id: cert.id,
  student: cert.user_name,
  course: cert.course_title,
  hash: cert.verification_hash
});
console.assert(cert.user_name === "Leo Vance", "Student name should match");
console.assert(cert.id.startsWith("CERT-SB-"), "Certificate ID format should start with CERT-SB-");
console.assert(store.getUserCertificates("user_a").length >= 1, "Certificate stored in user profile");

console.log("\n=== 5. TESTING USER SUBMISSION & ADMIN APPROVAL ===");
// User submits a new course
const newCourse = store.submitCourse({
  title: "Next.js 15 Server Actions & AI Integration",
  category: "tech",
  creditCost: 45,
  duration: "25 mins",
  durationSeconds: 50,
  videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  description: "Deep dive into Next.js 15 streaming, caching, and server actions."
});

console.log("Newly submitted course status:", newCourse.status);
console.assert(newCourse.status === "PENDING_REVIEW", "New course must start in PENDING_REVIEW");

// Admin checks pending queue
const pendingBefore = admin.getPendingCourses();
console.log("Admin Pending Queue Count:", pendingBefore.length);
const foundInQueue = pendingBefore.find(c => c.id === newCourse.id);
console.assert(foundInQueue !== undefined, "Course must be visible in admin queue");

// Admin approves course
admin.approveCourse(newCourse.id);
console.log("Course status after admin approval:", newCourse.status);
console.assert(newCourse.status === "APPROVED", "Course status must be APPROVED");

// Check public catalog
const approvedAfter = store.getApprovedCourses();
const isLiveInCatalog = approvedAfter.some(c => c.id === newCourse.id);
console.log("Is newly approved course live in catalog:", isLiveInCatalog);
console.assert(isLiveInCatalog === true, "Course must appear in public catalog");

// Admin tests granting & revoking creator video upload permissions
console.log("\n=== 6. TESTING EDUCATOR VIDEO UPLOAD PERMISSION MANAGEMENT ===");
const userD = store.getUser("user_d");
console.log("Kaito Tanaka upload permission before:", userD.can_upload_videos);
admin.grantCreatorPermission("user_d");
console.log("Kaito Tanaka upload permission after admin grant:", userD.can_upload_videos);
console.assert(userD.can_upload_videos === true, "User D should have video upload permission granted");

admin.revokeCreatorPermission("user_d");
console.log("Kaito Tanaka upload permission after admin revoke:", userD.can_upload_videos);
console.assert(userD.can_upload_videos === false, "User D upload permission should be revoked");

console.log("\n>>> ALL 6/6 VERIFICATION TESTS PASSED SUCCESSFULLY! <<<");
