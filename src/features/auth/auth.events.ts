type Listener = () => void;

const listeners = new Set<Listener>();

export const authEvents = {
  onLogout(cb: Listener) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  emitLogout() {
    listeners.forEach(cb => cb());
  },
};
