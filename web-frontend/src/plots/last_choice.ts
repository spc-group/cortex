import { useState, useEffect, useCallback } from "react";

const MAX_HISTORY = 50;

// Return the best choice that matches the previous options
export const lastPreference = <T>(
  options: T[],
  pastPreferences: T[],
): T | undefined => {
  const validPrefs = pastPreferences.filter((val) => options.includes(val));
  return validPrefs?.[0];
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
  const fullKey = `last-choice-v1-${localKey}`;
  const pastPreferences = useCallback(() => {
    return JSON.parse(localStorage.getItem(fullKey) ?? "[]");
  }, [fullKey]);
  // Set up some state to keep track of past choices
  const [currentChoice, setCurrentChoice] = useState<T>(defaultValue);
  useEffect(() => {
    // Find the best option from previous choices
    const lastChoice = lastPreference<T>(choices, pastPreferences());
    if (lastChoice != null && currentChoice !== lastChoice) {
      setCurrentChoice(lastChoice);
    }
  }, [choices, currentChoice, pastPreferences]);
  // Define a handler so the local storage can be updated when the value is changed
  const setter = (newValue: T) => {
    const pastPrefs = pastPreferences();
    const prefIndex = pastPrefs.indexOf(newValue);
    if (prefIndex !== -1) {
      // Remove the previous preference
      pastPrefs.splice(prefIndex, 1);
    }
    // Insert the new preference
    const newArray = [newValue, ...pastPrefs.slice(0, MAX_HISTORY)];
    localStorage.setItem(fullKey, JSON.stringify(newArray));
    // Tracker whether we should update the list of preference
    return setCurrentChoice(newValue);
  };
  return [currentChoice, setter];
};
