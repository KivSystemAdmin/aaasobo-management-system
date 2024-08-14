"use client";

import { useInput } from "@/app/hooks/useInput";
import { useRouter } from "next/navigation";
import React, { FormEvent } from "react";
import { prefectures } from "@/app/helper/data";

function Register() {
  const [name, onNameChange] = useInput();
  const [email, onEmailChange] = useInput();
  const [password, onPasswordChange] = useInput();
  const [passConfirmation, onPassConfirmationChange] = useInput();
  const [prefecture, onPrefectureChange] = useInput();
  const router = useRouter();

  const registerHandler = async (e: FormEvent) => {
    e.preventDefault();

    // If the values are null, return it.
    if (!name || !email || !password || !passConfirmation || !prefecture) {
      return;
    }

    // If values of password and password confirmation is different, return it.
    if (password !== passConfirmation) {
      return;
    }

    // Define the data to be sent to the server side.
    const registerURL = "http://localhost:4000/customers/register";
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({
      name,
      email,
      password,
      prefecture,
    });

    const response = await fetch(registerURL, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error("Something went wrong");
    }

    const data = await response.json();

    // Redirect to the login page
    const redirectUrl = data.redirectUrl || "/login";
    router.push(`/customers${redirectUrl}`);
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={registerHandler}>
        <label>
          Name
          <input type="text" value={name} onChange={onNameChange} />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={onEmailChange} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={onPasswordChange} />
        </label>
        <label>
          Password Confirmation
          <input
            type="password"
            value={passConfirmation}
            onChange={onPassConfirmationChange}
          />
        </label>
        <label>
          Prefecture of Residence
          <select value={prefecture} onChange={onPrefectureChange}>
            {prefectures.map((prefecture) => (
              <option key={prefecture} value={prefecture}>
                {prefecture}
              </option>
            ))}
          </select>
        </label>
        <label>
          Privacy Policy
          <p>
            We will take a screenshot as a record that the class was conducted.
            Additionally, we may record the session for the purpose of improving
            the instructor's skills.
          </p>
          <input type="checkbox" required />
        </label>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;
