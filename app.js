/*
 * Prayer times mini app for Telegram.
 * Replicates simple functionality of the original Android app
 * by computing prayer times based on a fixed set of base times
 * and shifting them according to the selected calculation method.
 */

// Define the base prayer times (HH:MM) for Fajr, Dhuhr, Asr, Maghrib, Isha
const BASE_TIMES = [
    { key: 'Fajr', label: 'Fajr', time: '06:35' },
    { key: 'Dhuhr', label: 'Dhuhr', time: '12:30' },
    { key: 'Asr', label: 'Asr', time: '13:47' },
    { key: 'Maghrib', label: 'Maghrib', time: '16:00' },
    { key: 'Isha', label: 'Isha', time: '17:30' }
];

// Minute shifts for each calculation method, matching the Kotlin code
const METHOD_SHIFTS = {
    ISNA: 0,
    MWL: 2,
    UMM_AL_QURA: 4,
    EGYPT: 3,
    MOONSIGHTING: 1
};

// Convert HH:MM string to minutes since midnight
function toMinutes(str) {
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
}

// Convert minutes since midnight back to HH:MM
function fromMinutes(mins) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Compute prayer times list based on selected method
function computeTimes(method) {
    const shift = METHOD_SHIFTS[method] || 0;
    return BASE_TIMES.map(item => {
        const mins = toMinutes(item.time) + shift;
        return { ...item, adjusted: fromMinutes(mins) };
    });
}

// Render the table rows for the given times
function renderTimes(times) {
    const tbody = document.getElementById('timesTable');
    tbody.innerHTML = '';
    times.forEach(item => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td');
        tdName.textContent = item.label;
        const tdTime = document.createElement('td');
        tdTime.textContent = item.adjusted;
        tr.appendChild(tdName);
        tr.appendChild(tdTime);
        tbody.appendChild(tr);
    });
}

// Determine the next prayer and the time remaining
function getNextPrayer(now, times) {
    // Now is minutes since midnight
    for (let i = 0; i < times.length; i++) {
        const t = toMinutes(times[i].adjusted);
        if (t > now) {
            return { next: times[i], isNextDay: false };
        }
    }
    // All prayers have passed; the next one is the first prayer of the next day
    return { next: times[0], isNextDay: true };
}

// Update countdown timer every second
function startCountdown(times) {
    function tick() {
        const nowDate = new Date();
        const now = nowDate.getHours() * 60 + nowDate.getMinutes();
        const { next, isNextDay } = getNextPrayer(now, times);
        const nextTimeMins = toMinutes(next.adjusted) + (isNextDay ? 24 * 60 : 0);
        let diff = nextTimeMins - now;
        // Compute hours, minutes, seconds
        const dh = Math.floor(diff / 60);
        const dm = diff % 60;
        const ds = 60 - nowDate.getSeconds();
        // Adjust for seconds
        let remainingSeconds = diff * 60 + (60 - nowDate.getSeconds());
        if (remainingSeconds < 0) remainingSeconds = 0;
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = remainingSeconds % 60;
        document.getElementById('nextPrayer').textContent = next.label;
        document.getElementById('countdown').textContent = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
    }
    tick();
    return setInterval(tick, 1000);
}

// Main initialization
window.addEventListener('load', () => {
    const methodSelect = document.getElementById('method');
    let currentTimes = computeTimes(methodSelect.value);
    renderTimes(currentTimes);
    let timerId = startCountdown(currentTimes);

    // Update when method changes
    methodSelect.addEventListener('change', () => {
        clearInterval(timerId);
        currentTimes = computeTimes(methodSelect.value);
        renderTimes(currentTimes);
        timerId = startCountdown(currentTimes);
    });

    // Setup Telegram Web App if present
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.setHeaderColor('#0a0f14');
        Telegram.WebApp.setBackgroundColor('#0a0f14');
        Telegram.WebApp.ready();
    }
});
