const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('users.db', (err) => {
    if (err) {
        console.error('Could not open database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            telegram_id TEXT PRIMARY KEY,
            first_name TEXT,
            username TEXT,
            points INTEGER,
            progress INTEGER,
            last_run_time TEXT
        )`);
    }
});

// وظيفة لاسترجاع بيانات المستخدم
export default function handler(req, res) {
    if (req.method === 'POST') {
        const { telegram_id, first_name, username } = req.body;

        db.get('SELECT * FROM users WHERE telegram_id = ?', [telegram_id], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            const currentTime = new Date();
            let lastRunTime = currentTime;

            if (row) {
                if (row.last_run_time) {
                    lastRunTime = new Date(row.last_run_time);
                }

                const elapsedTime = Math.floor((currentTime - lastRunTime) / 1000);
                let newProgress = Math.min(row.progress + elapsedTime, 1000);

                // تحديث وقت آخر تشغيل
                db.run('UPDATE users SET last_run_time = ?, progress = ? WHERE telegram_id = ?', [currentTime.toISOString(), newProgress, telegram_id], (err) => {
                    if (err) {
                        console.error('Error updating last run time and progress:', err.message);
                    }
                });

                res.json({ ...row, progress: newProgress });
            } else {
                const defaultProgress = 1000;
                const points = 0;

                db.run('INSERT INTO users (telegram_id, first_name, username, points, progress, last_run_time) VALUES (?, ?, ?, ?, ?, ?)', 
                    [telegram_id, first_name, username, points, defaultProgress, currentTime.toISOString()], 
                    (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    res.json({ telegram_id, first_name, username, points, progress: defaultProgress });
                });
            }
        });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
