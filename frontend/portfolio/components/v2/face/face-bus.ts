// Lets any part of the page poke the :D (nav hovers, later: scroll sections)
// without prop drilling. The stage subscribes and forwards to the engine.

export type FaceSignal =
    | { readonly type: 'spin' }
    | { readonly type: 'agree' }
    | { readonly type: 'money'; readonly on: boolean };

type Listener = (signal: FaceSignal) => void;

const listeners = new Set<Listener>();

export function signalFace(signal: FaceSignal): void {
    listeners.forEach((listener) => listener(signal));
}

export function onFaceSignal(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
