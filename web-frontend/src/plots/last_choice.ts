import { useState, useEffect } from "react";

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
// @param choices - The valid choices for this invocation
// @param localKey - What to name this value in the local storage
// @returns lastChoice - The most recently selected value from these choices
// @returns addChoice - A callable that will insert a new choice into the history
export const useLastChoice = <T>(
  defaultValue: T,
  choices: T[],
  localKey: string,
): [T | null, (value: T) => void] => {
  const pastPreferences = JSON.parse(localStorage.getItem(localKey) ?? "[]");
  // Set up some state to keep track of past choices
  const [lastChoice, setLastChoice] = useState<T>(() => {
    return lastPreference<T>(choices, pastPreferences) ?? defaultValue;
  });
  // Update the history when a new choice is made
  useEffect(() => {
    if (lastChoice === defaultValue) {
      return;
    }
    const prefIndex = pastPreferences.indexOf(lastChoice);
    if (prefIndex !== -1) {
      // Remove the previous preference
      pastPreferences.splice(prefIndex, 1);
    }
    // Insert the new preference
    const newArray = [lastChoice, ...pastPreferences.slice(0, MAX_HISTORY)];
    localStorage.setItem(localKey, JSON.stringify(newArray));
  }, [lastChoice, defaultValue, localKey, pastPreferences]);
  return [lastChoice, setLastChoice];
};
