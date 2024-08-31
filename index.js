const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/your-service-account-file.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://powercoin-ee849-default-rtdb.firebaseio.com"
});

const db = admin.firestore();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

app.post('/getUserData', async (req, res) => {
  const { telegram_id, first_name, username } = req.body;

  try {
    const userRef = db.collection('users').doc(telegram_id);
    const doc = await userRef.get();

    const currentTime = new Date();
    let lastRunTime = currentTime;

    if (doc.exists) {
      const data = doc.data();
      if (data.last_run_time) {
        lastRunTime = new Date(data.last_run_time);
      }

      const elapsedTime = Math.floor((currentTime - lastRunTime) / 1000);
      let newProgress = Math.min(data.progress + elapsedTime, 1000);

      await userRef.update({
        last_run_time: currentTime.toISOString(),
        progress: newProgress
      });

      res.json({ ...data, progress: newProgress });
    } else {
      const defaultProgress = 1000;
      const points = 0;

      await userRef.set({
        telegram_id,
        first_name,
        username: username || null,
        points,
        progress: defaultProgress,
        last_run_time: currentTime.toISOString()
      });

      res.json({ telegram_id, first_name, username, points, progress: defaultProgress });
    }
  } catch (error) {
    console.error('Error retrieving or saving user data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/updateUserData', async (req, res) => {
  const { telegram_id, points, progress } = req.body;

  try {
    const userRef = db.collection('users').doc(telegram_id);
    await userRef.update({ points, progress });
    res.status(200).send('User data updated');
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
