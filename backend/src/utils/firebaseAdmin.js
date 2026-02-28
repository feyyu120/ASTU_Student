
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert('../backend/.firebase/service-account.json'), // your .firebase/service...json path
});

export default admin;