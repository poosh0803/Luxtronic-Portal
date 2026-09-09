(function () {
    const POLL_INTERVAL_MS = 20000;
    const LAST_SEEN_KEY = 'luxtronic-portal:notifications-last-seen';

    const bell = document.getElementById('notif-bell');
    const badge = document.getElementById('notif-badge');
    const panel = document.getElementById('notif-panel');
    const list = document.getElementById('notif-list');
    const empty = document.getElementById('notif-empty');
    const closeBtn = document.getElementById('notif-close');

    let notifications = [];

    function getLastSeen() {
        return Number(localStorage.getItem(LAST_SEEN_KEY) || 0);
    }

    function setLastSeen(timestamp) {
        localStorage.setItem(LAST_SEEN_KEY, String(timestamp));
    }

    function formatTime(iso) {
        return new Date(iso).toLocaleString();
    }

    function render() {
        const lastSeen = getLastSeen();
        const unread = notifications.filter((n) => new Date(n.createdAt).getTime() > lastSeen).length;

        if (unread > 0) {
            badge.textContent = unread > 99 ? '99+' : String(unread);
            badge.hidden = false;
        } else {
            badge.hidden = true;
        }

        list.innerHTML = '';
        empty.hidden = notifications.length > 0;

        for (const n of notifications) {
            const li = document.createElement('li');
            li.className = `notif-item notif-${n.level}`;

            const title = document.createElement('div');
            title.className = 'notif-title';
            title.textContent = n.title;
            li.appendChild(title);

            const message = document.createElement('div');
            message.className = 'notif-message';
            message.textContent = n.message;
            li.appendChild(message);

            const meta = document.createElement('div');
            meta.className = 'notif-meta';
            meta.textContent = `${n.source} • ${formatTime(n.createdAt)}`;
            li.appendChild(meta);

            if (n.url) {
                const link = document.createElement('a');
                link.href = n.url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = 'Open';
                link.className = 'notif-link';
                li.appendChild(link);
            }

            list.appendChild(li);
        }
    }

    async function fetchNotifications() {
        try {
            const res = await fetch('/api/notifications');
            if (!res.ok) return;
            notifications = await res.json();
            render();
        } catch {
            // LAN hiccup - the next poll will retry
        }
    }

    bell.addEventListener('click', () => {
        const opening = panel.hidden;
        panel.hidden = !panel.hidden;
        if (opening) {
            setLastSeen(Date.now());
            render();
        }
    });

    closeBtn.addEventListener('click', () => {
        panel.hidden = true;
    });

    fetchNotifications();
    setInterval(fetchNotifications, POLL_INTERVAL_MS);
})();
