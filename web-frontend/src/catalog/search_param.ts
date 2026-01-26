import { useSearchParams } from "react-router";

type ParamValue = string | number | boolean;

export const useSearchParam = <T extends ParamValue>(
  name: string,
  defaultValue: T,
): [T, (value: T) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();
  // Decide what type of thing we have
  const currentValue = searchParams.get(name) ?? defaultValue;
  let returnValue: T;
  if (typeof defaultValue === "boolean") {
    returnValue = (currentValue === "true" ? true : false) as T;
  } else if (typeof defaultValue === "number") {
    returnValue = Number(currentValue) as T;
  } else {
    returnValue = currentValue as T;
  }
  // Handler for updating the search parameter
  const setParam = (value: T) => {
    if (value !== defaultValue) {
      searchParams.set(name, String(value));
    } else {
      searchParams.delete(name);
    }
    setSearchParams(searchParams);
  };
  return [returnValue, setParam];
};
