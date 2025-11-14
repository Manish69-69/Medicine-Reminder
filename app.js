const LS_KEY = "medicines_v1";

const listEl = document.getElementById("list");
const upcomingEl = document.getElementById("upcoming");
const overallBar = document.getElementById("overallBar");
const takenText = document.getElementById("takenText");
const totalText = document.getElementById("totalText");

function uid() {
    return Date.now().toString(36);
}

function load() {
    return JSON.parse(localStorage.getItem(LS_KEY)) || [];
}

function save(data) {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

function escapeHtml(s) {
    return String(s).replace(/[&<>\"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    }[c]));
}

function render() {
    const meds = load();
    listEl.innerHTML = "";
    let totalNeeded = 0;
    let totalTaken = 0;

    meds.forEach(m => {
        const taken = (m.logs?.[todayStr()] || 0);
        totalNeeded += m.dailyCount;
        totalTaken += taken;

        const row = document.createElement("div");
        row.className = "med-row";
        row.innerHTML = `
            <div>
                <strong>${escapeHtml(m.name)}</strong>
                <br>
                <small>Times: ${m.times.join(", ")}</small>
            </div>

            <button onclick="markTaken('${m.id}')" class="btn">Mark Taken</button>
        `;

        listEl.appendChild(row);
    });

    totalText.textContent = `Total: ${totalNeeded}`;
    takenText.textContent = `Taken: ${totalTaken}`;
    overallBar.style.width = (totalTaken / totalNeeded * 100 || 0) + "%";

    renderUpcoming();
}

function renderUpcoming() {
    upcomingEl.innerHTML = "";
    const meds = load();
    const now = new Date();

    const upcoming = [];

    meds.forEach(m => {
        m.times.forEach(t => {
            const [hh, mm] = t.split(":").map(Number);
            const time = new Date();
            time.setHours(hh, mm, 0, 0);
            if (time > now) {
                upcoming.push({
                    name: m.name,
                    time,
                });
            }
        });
    });

    upcoming.sort((a, b) => a.time - b.time);

    upcoming.slice(0, 5).forEach(u => {
        const li = document.createElement("li");
        li.textContent = `${u.name} — ${u.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
        upcomingEl.appendChild(li);
    });
}

function markTaken(id) {
    const meds = load();
    const med = meds.find(m => m.id === id);
    if (!med) return;

    med.logs = med.logs || {};
    med.logs[todayStr()] = (med.logs[todayStr()] || 0) + 1;

    save(meds);
    render();
}

document.getElementById("addForm").addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const timesRaw = document.getElementById("times").value.trim();
    const dailyCount = parseInt(document.getElementById("dailyCount").value);

    const times = timesRaw.split(",").map(t => t.trim());

    const meds = load();
    meds.push({
        id: uid(),
        name,
        times,
        dailyCount,
        logs: {},
    });

    save(meds);
    e.target.reset();
    render();
});

document.getElementById("enableNotifications").addEventListener("click", async () => {
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
        alert("Notifications enabled!");
    }
});

document.getElementById("clearAll").addEventListener("click", () => {
    if (confirm("Clear ALL medicines?")) {
        localStorage.removeItem(LS_KEY);
        render();
    }
});

render();
