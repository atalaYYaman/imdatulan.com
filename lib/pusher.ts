import Pusher from 'pusher-js';

// Basic safety check to prevent crash if envs are missing
const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

export const pusherClient = (pusherKey && pusherCluster)
    ? new Pusher(pusherKey, { cluster: pusherCluster })
    : {
        subscribe: () => ({ bind: () => { }, unbind: () => { } }),
        unsubscribe: () => { },
        signin: () => { }
    } as unknown as Pusher;

if (!pusherKey) console.error("Pusher Key is missing! Real-time features will not work.");
