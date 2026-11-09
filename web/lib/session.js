import { useEffect, useState } from "react";

const STORAGE_KEY = "yourshelf-user";
const CHANGE_EVENT = "yourshelf-session";

export function getSession() {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function setSession(user) {
  try {
    if (user) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ _id: user._id, name: user.name }),
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useSession() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const update = () => setUser(getSession());
    update();
    setReady(true);

    window.addEventListener(CHANGE_EVENT, update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener(CHANGE_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return { user, ready };
}
