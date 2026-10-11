// Clock Engine
setInterval(() => {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.innerText = new Date().toLocaleTimeString();
    }
}, 1000);

// WebSocket Listener
const socket = io();

socket.on('emergency_alert', (data) => {
    console.log("🚨 EMERGENCY ALERT RECEIVED:", data);

    const alertCard = document.getElementById('alert-card');
    const alertBadge = document.getElementById('alert-badge');

    if (alertCard) {
        alertCard.classList.remove('border-slate-800');
        alertCard.classList.add('border-red-500', 'bg-red-950/40', 'animate-pulse-fast');
    }

    if (alertBadge) {
        alertBadge.className = "px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white animate-bounce";
        alertBadge.innerText = "🚨 ACCIDENT CONFIRMED";
    }

    document.getElementById('inc-location').innerText = data.location;
    document.getElementById('inc-severity').innerText = data.severity;
    document.getElementById('inc-severity').className = "font-bold text-red-400";
    document.getElementById('inc-amb').innerText = data.ambulance;
    
    const etaEl = document.getElementById('inc-eta');
    etaEl.innerText = data.eta;
    etaEl.className = "font-bold text-2xl text-red-500 animate-pulse";

    document.getElementById('j2-status').innerText = "CORRIDOR CLEARING";
    document.getElementById('j2-status').className = "text-sm font-bold text-red-500 animate-pulse";
    document.getElementById('j1-status').innerText = "PRIORITY GREEN";
});