import { useState, useEffect, useCallback } from "react";

// Custom hook to manage localStorage
export const useLocalStorage = <T>(
  key: string,
  initialValue: T,
): [T, (val: T) => void] => {
  const getStoredValue = useCallback(() => {
    // Get the initial value from local storage if possible
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : initialValue;
  }, [key, initialValue]);
  const [value, setValue] = useState<T>(getStoredValue);

  // Look up the new value if the key changes
  useEffect(() => {
    const storedVal = getStoredValue();
    setValue(storedVal);
  }, [key, getStoredValue]);
  // Set a new value if it is changed programmatically
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};
