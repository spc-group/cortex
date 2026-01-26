import { useState, useEffect } from "react";

export default function useDebounce<T>(
  value: T,
  delay: number,
  onChange?: (value: T) => void,
) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  // Handler with a debounce delay
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
      if (value !== debouncedValue && onChange != null) {
        onChange(value);
      }
    }, delay);
    return () => clearTimeout(timeout);
  }, [value, delay, onChange, debouncedValue]);
  return debouncedValue;
}
