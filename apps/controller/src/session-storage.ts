const STORAGE_KEY = "party-game:controller-session:v1";

export interface StoredControllerSession {
  roomCode: string;
  reconnectionToken: string;
}

export const readStoredSession = (): StoredControllerSession | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const value = JSON.parse(raw) as Partial<StoredControllerSession>;
    if (
      typeof value.roomCode !== "string" ||
      typeof value.reconnectionToken !== "string" ||
      value.reconnectionToken.length < 20
    ) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      roomCode: value.roomCode,
      reconnectionToken: value.reconnectionToken,
    };
  } catch {
    return null;
  }
};

export const storeSession = (session: StoredControllerSession) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can be unavailable in constrained/private browser modes.
  }
};

export const clearStoredSession = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The controller still works for the current page session without storage.
  }
};
