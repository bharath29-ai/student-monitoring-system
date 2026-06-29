const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');
const { firebaseConfig } = require('./setupHelper.cjs');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  const email = 'teststudent_1781808123120@example.com';
  console.log('Logging in as admin...');
  await signInWithEmailAndPassword(auth, 'testadmin@example.com', 'adminpass123');
  console.log(`Searching for student: ${email}...`);
  const q = query(collection(db, 'users'), where('email', '==', email));
  const snap = await getDocs(q);
  if (snap.empty) {
    console.log('No user document found in Firestore.');
  } else {
    snap.forEach(doc => {
      console.log(`Document ID: ${doc.id} -> Data:`, JSON.stringify(doc.data(), null, 2));
    });
  }
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
