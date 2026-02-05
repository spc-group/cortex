import { useState } from "react";

const MAX_HISTORY = 50;

// Return the best choice that matches the previous options
export const lastPreference = <T>(
  options: T[],
  pastPreferences: T[],
): T | null => {
  const validPrefs = pastPreferences.filter((val) => options.includes(val));
  return validPrefs?.[0] ?? null;
};

// A hook that keeps track of the last choice that was made for this
// *localKey* and returns that by default
//
// @param defaultValue - What to return before anything specific is set
// @param choices - A list of valid choices for this preference
// @param localKey - What to name this value in the local storage
export const useLastChoice = <T>(
  defaultValue: T,
  choices: T[],
  localKey: string,
): [T, (value: T) => void] => {
  const pastPreferences = JSON.parse(localStorage.getItem(localKey) ?? "[]");
  // const hasChangedRef = useReference(false);
  // Set up some state to keep track of past choices
  const [lastChoice, setLastChoice] = useState<T>(() => {
    return lastPreference<T>(choices, pastPreferences) ?? defaultValue;
  });
  const setter = (newValue: T) => {
    const prefIndex = pastPreferences.indexOf(newValue);
    if (prefIndex !== -1) {
      // Remove the previous preference
      pastPreferences.splice(prefIndex, 1);
    }
    // Insert the new preference
    const newArray = [newValue, ...pastPreferences.slice(0, MAX_HISTORY)];
    localStorage.setItem(localKey, JSON.stringify(newArray));
    // Tracker whether we should update the list of preference
    return setLastChoice(newValue);
  };
  return [lastChoice, setter];
};
