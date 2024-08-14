import { ChangeEvent, useState } from "react";

export function useInput(): [
  string,
  (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void,
] {
  const [value, setValue] = useState<string>("");
  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValue(e.target.value);
  };
  return [value, onChange];
}
