"use client";

import React, { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useInput } from "@/app/hooks/useInput";
import { isValidLogin } from "@/app/helper/validationUtils";

function Login() {
  const [email, onEmailChange] = useInput();
  const [password, onPasswordChange] = useInput();
  const router = useRouter();

  const loginHandler = async (e: FormEvent) => {
    e.preventDefault();

    // Check the validation of the input values.
    const checkResult = isValidLogin({
      email,
      password,
    });

    if (!checkResult) {
      return;
    }

    // Define the data to be sent to the server side.
    const loginURL = "http://localhost:4000/admins/login";
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({
      email,
      password,
    });

    const response = await fetch(loginURL, {
      method: "POST",
      credentials: "include",
      headers,
      body,
    });

    const data = await response.json();
    console.log("admins/login data:", data);
    const { message, redirectUrl } = data;

    if (!response.ok) {
      alert(message); // Set alert message temporarily.
      return;
    }

    alert("Logged in successfully"); // Set alert message temporarily.
    router.push(redirectUrl);
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={loginHandler}>
        <label>
          Email
          <input type="email" value={email} onChange={onEmailChange} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={onPasswordChange} />
        </label>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
