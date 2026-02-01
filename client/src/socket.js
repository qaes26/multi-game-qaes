import io from 'socket.io-client';

// Automatically detect environment
// If VITE_SERVER_URL is set (in Vercel), use it.
// Otherwise, default to localhost logic (or window.location.hostname for LAN).

const getServerUrl = () => {
    const envUrl = import.meta.env.VITE_SERVER_URL;
    if (envUrl) return envUrl;

    // Fallback for local LAN development
    return `http://${window.location.hostname}:3000`;
};

export const socket = io(getServerUrl(), {
    autoConnect: false // We connect manually in App.jsx
});
