import { useState, useEffect } from "react";

// Custom hook to manage localStorage
export const useLocalStorage = <T>(
  key: string,
  initialValue: T,
): [T, (val: T) => void] => {
  const [value, setValue] = useState<T>(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};
