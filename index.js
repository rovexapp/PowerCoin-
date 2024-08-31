// مسار POST لاسترجاع بيانات المستخدم
app.post('/api/getUserData', (req, res) => {
    const { telegram_id, first_name, username } = req.body;

    db.get('SELECT * FROM users WHERE telegram_id = ?', [telegram_id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
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
                    return res.status(500).json({ error: err.message });
                }
                res.json({ telegram_id, first_name, username, points, progress: defaultProgress });
            });
        }
    });
});

// مسار POST لتحديث بيانات المستخدم
app.post('/api/updateUserData', (req, res) => {
    const { telegram_id, points, progress } = req.body;

    db.run('UPDATE users SET points = ?, progress = ? WHERE telegram_id = ?', 
        [points, progress, telegram_id], 
        (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).send('User data updated');
    });
});
