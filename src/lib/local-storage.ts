import { useEffect, useState } from "react";

export function readLocalStorageString(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export function writeLocalStorageString(key: string, value: string) {
  try {
    if (!value) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function useLocalStorageStringState(key: string) {
  const [value, setValue] = useState(() => readLocalStorageString(key));

  useEffect(() => {
    writeLocalStorageString(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}
