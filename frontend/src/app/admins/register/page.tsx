"use client";

import React, { FormEvent } from "react";
import { useInput } from "@/app/hooks/useInput";
import { checkRegisterValidation } from "@/app/helper/validationUtils";

function Register() {
  const [name, onNameChange] = useInput();
  const [email, onEmailChange] = useInput();
  const [password, onPasswordChange] = useInput();
  const [passConfirmation, onPassConfirmationChange] = useInput();

  const registerHandler = async (e: FormEvent) => {
    e.preventDefault();

    // Check the validation of the input values.
    const checkResult = checkRegisterValidation({
      name,
      email,
      password,
      passConfirmation,
    });

    if (!checkResult) {
      return;
    }

    // Define the data to be sent to the server side.
    const registerURL = "http://localhost:4000/admins/register";
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({
      name,
      email,
      password,
    });

    const response = await fetch(registerURL, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error("Something went wrong");
    }

    // const data = await response.json();

    // Set alert message temporarily.
    alert("Registered successfully");
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
          <input
            type="password"
            id="password"
            value={password}
            onChange={onPasswordChange}
          />
        </label>
        <label>
          Password Confirmation
          <input
            type="password"
            id="password-confirmation"
            value={passConfirmation}
            onChange={onPassConfirmationChange}
          />
        </label>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;
