import { ChangeEvent, useState } from "react";

export function useSelect(
  initialValue: string = "",
): [
  string,
  (newValue: string) => void,
  (e: ChangeEvent<HTMLSelectElement>) => void,
] {
  const [value, setValue] = useState<string>(initialValue);

  const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setValue(e.target.value);
  };

  return [value, setValue, onChange];
}

export function useMultipleSelect(
  initialValues: string[] | number[],
): [
  (string | number)[],
  (newValues: (string | number)[]) => void,
  (e: ChangeEvent<HTMLSelectElement>, index: number) => void,
] {
  const [values, setValues] = useState<(string | number)[]>(initialValues);

  const onChange = (e: ChangeEvent<HTMLSelectElement>, index: number) => {
    const newSelectedValues = [...values];
    newSelectedValues[index] = e.target.value;
    setValues(newSelectedValues);
  };

  return [values, setValues, onChange];
}
