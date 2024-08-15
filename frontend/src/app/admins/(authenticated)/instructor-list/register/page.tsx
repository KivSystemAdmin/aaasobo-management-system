"use client";

import { FormEvent } from "react";
import { useInput } from "@/app/hooks/useInput";
import { useAuth } from "@/app/hooks/useAuth";
import { isValidRegister } from "@/app/helper/validationUtils";

function Register() {
  const [name, onNameChange] = useInput();
  const [email, onEmailChange] = useInput();
  const [password, onPasswordChange] = useInput();
  const [passConfirmation, onPassConfirmationChange] = useInput();

  // Check the authentication of the admin.
  const endpoint = "http://localhost:4000/admins/authentication";
  const redirectPath = "/admins/login";
  const { isLoading } = useAuth(endpoint, redirectPath);

  // Register the admin.
  const registerHandler = async (e: FormEvent) => {
    e.preventDefault();

    // Check the validation of the input values.
    const isValid = isValidRegister({
      name,
      email,
      password,
      passConfirmation,
    });

    if (!isValid) {
      return;
    }

    // Define the data to be sent to the server side.
    const registerURL = "http://localhost:4000/admins/instructor-list/register";
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({
      name,
      email,
      password,
    });

    const response = await fetch(registerURL, {
      method: "POST",
      credentials: "include",
      headers,
      body,
    });

    const data = await response.json();
    const message = data.message;

    if (!response.ok) {
      alert(message); // Set alert message temporarily.
      return;
    }

    alert("Registered successfully"); // Set alert message temporarily.
  };

  // Display a loading message while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }

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
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;
