import { useCallback, useEffect, useRef, useState } from "react";

const PREFIX = "ma-forms-kit:";

function readStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota exceeded — silent */
  }
}

function clearStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

export interface UsePersistedFormStateOptions<T> {
  formId: string;
  initial: T;
  enabled?: boolean;
}

export function usePersistedFormState<T extends Record<string, unknown>>(
  opts: UsePersistedFormStateOptions<T>,
): {
  values: T;
  setValue: <K extends keyof T>(name: K, value: T[K]) => void;
  setValues: (patch: Partial<T>) => void;
  reset: () => void;
  clear: () => void;
} {
  const { formId, initial, enabled = true } = opts;
  const initialRef = useRef(initial);

  const [values, setValuesState] = useState<T>(() => {
    if (!enabled) return initial;
    const stored = readStorage<T>(formId);
    return stored ? { ...initial, ...stored } : initial;
  });

  useEffect(() => {
    if (!enabled) return;
    writeStorage(formId, values);
  }, [formId, values, enabled]);

  const setValue = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValuesState((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setValues = useCallback((patch: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setValuesState(initialRef.current);
  }, []);

  const clear = useCallback(() => {
    clearStorage(formId);
    setValuesState(initialRef.current);
  }, [formId]);

  return { values, setValue, setValues, reset, clear };
}
