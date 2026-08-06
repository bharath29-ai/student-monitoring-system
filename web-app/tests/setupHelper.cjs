const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyATbqIQJ3acmu1gCStojlfRkwK_qjRImq4",
  authDomain: "app-084e0d55.firebaseapp.com",
  projectId: "app-084e0d55",
  storageBucket: "app-084e0d55.firebasestorage.app",
  messagingSenderId: "525714936206",
  appId: "1:525714936206:web:9a2737cbf65f7ca24694df"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function ensureUser(email, password, role, status) {
  let user = null;
  console.log(`Checking if user exists: ${email}...`);
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    user = userCred.user;
    console.log(`User ${email} already exists.`);
  } catch (error) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      console.log(`User ${email} not found. Creating...`);
      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        user = userCred.user;
        console.log(`User ${email} created successfully.`);
      } catch (createError) {
        console.error(`Failed to create user ${email}:`, createError.message);
        throw createError;
      }
    } else {
      console.error(`Error logging in as ${email}:`, error.message);
      throw error;
    }
  }

  if (user) {
    console.log(`Ensuring Firestore document for ${email} with role=${role}, status=${status}...`);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        name: email.split('@')[0],
        email: email,
        role: role,
        status: status,
        createdAt: new Date().toISOString()
      }, { merge: true });
      console.log(`Firestore document for ${email} updated successfully.`);
      return user.uid;
    } catch (dbError) {
      console.error(`Failed to update Firestore document for ${email}:`, dbError.message);
      throw dbError;
    }
  }
}

async function runSetup() {
  console.log('--- Initializing Test Users Setup ---');
  try {
    // 1. Ensure Admin exists and is approved
    const adminUid = await ensureUser('testadmin@example.com', 'adminpass123', 'admin', 'approved');
    console.log(`Admin user setup complete. UID: ${adminUid}`);

    // 2. Ensure Teacher exists and is approved
    const teacherUid = await ensureUser('testteacher@example.com', 'teacherpass123', 'teacher', 'approved');
    console.log(`Teacher user setup complete. UID: ${teacherUid}`);

    console.log('--- Test Users Setup Complete ---');
    return { adminUid, teacherUid };
  } catch (err) {
    console.error('Setup failed:', err);
    throw err;
  }
}

const { collection, query, where, getDocs, updateDoc } = require('firebase/firestore');

async function approveUserByEmail(email) {
  try {
    console.log(`Programmatic approval: Logging in as admin to update status for ${email}...`);
    await signInWithEmailAndPassword(auth, 'testadmin@example.com', 'adminpass123');
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const userDoc = snap.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), { status: 'approved' });
      console.log(`Programmatically approved user ${email} successfully as admin.`);
    } else {
      console.warn(`User document not found for email: ${email}`);
    }
  } catch (err) {
    console.error(`Failed to programmatically approve user ${email}:`, err.message);
  }
}

module.exports = { runSetup, firebaseConfig, approveUserByEmail };
if (require.main === module) {
  runSetup().then(() => process.exit(0)).catch(() => process.exit(1));
}
