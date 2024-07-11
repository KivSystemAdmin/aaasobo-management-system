import { ChangeEvent, useState } from "react";

export function useSelect(
  initialValue: string = ""
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
