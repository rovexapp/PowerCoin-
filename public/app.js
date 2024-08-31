const pointsDisplay = document.getElementById('points');
const circle = document.getElementById('circle');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressBarText = document.getElementById('progress-bar-text');
const levelBarFill = document.getElementById('level-bar-fill');
const levelBarText = document.getElementById('level-bar-text');

const telegram = window.Telegram.WebApp;
telegram.ready();

const user = telegram.initDataUnsafe.user;

if (user) {
    fetch('/api/getUserData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            telegram_id: user.id,
            first_name: user.first_name,
            username: user.username || null
        })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('user-name').textContent = data.first_name;
        document.getElementById('user-id').textContent = data.username ? `@${data.username}` : data.telegram_id;

        let points = data.points || 0;
        let progress = data.progress || 1000;

        const levelRanges = [
            { level: 1, min: 0, max: 1000 },
            { level: 2, min: 1001, max: 5000 },
            { level: 3, min: 5001, max: 10000 },
            { level: 4, min: 10001, max: 20000 },
            { level: 5, min: 20001, max: Infinity },
        ];

        function getCurrentLevel(points) {
            return levelRanges.find(range => points >= range.min && points <= range.max);
        }

        function updateUI() {
            pointsDisplay.textContent = `Points: ${points}`;
            progressBarFill.style.width = `${progress / 10}%`;
            progressBarText.textContent = `${progress}`;

            const currentLevel = getCurrentLevel(points);
            if (currentLevel.level < 5) {
                const levelProgress = points - currentLevel.min + 1;
                const levelMax = currentLevel.max - currentLevel.min + 1;
                levelBarFill.style.width = `${(levelProgress / levelMax) * 100}%`;
                levelBarText.textContent = `Level ${currentLevel.level}: ${points}/${currentLevel.max}`;
            } else {
                levelBarFill.style.width = `100%`;
                levelBarText.textContent = `Level ${currentLevel.level}: ${points}`;
            }

            circle.style.cursor = progress > 0 ? 'pointer' : 'not-allowed';
        }

        circle.addEventListener('touchstart', (event) => {
            const clickCount = event.touches.length;

            if (progress >= clickCount) {
                points += clickCount;
                progress -= clickCount;
                updateUI();
                saveData(points, progress);
            }
        });

        circle.addEventListener('click', () => {
            if (progress >= 1) {
                points += 1;
                progress -= 1;
                updateUI();
                saveData(points, progress);
            }
        });

        setInterval(() => {
            if (progress < 1000) {
                progress += 1;
                updateUI();
                saveData(points, progress);
            }
        }, 1000);

        updateUI();
    });
}

function saveData(points, progress) {
    fetch('/api/updateUserData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ telegram_id: user.id, points, progress })
    });
}
