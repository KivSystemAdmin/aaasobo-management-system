import { ChangeEvent, useState } from "react";

export function useInput(): [
  string,
  (e: ChangeEvent<HTMLInputElement>) => void,
] {
  const [value, setValue] = useState<string>("");
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };
  return [value, onChange];
}
