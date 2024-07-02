"use client";

import { useInput } from "@/app/hooks/useInput";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { FormEvent } from "react";

function Login() {
  const [email, onEmailChange] = useInput();
  const [password, onPasswordChange] = useInput();
  const router = useRouter();

  const loginHandler = async (e: FormEvent) => {
    e.preventDefault();

    // If the values are null, return it.
    if (!email || !password) {
      return;
    }

    // Define the data to be sent to the server side.
    const loginURL = "http://localhost:4000/customers/login";
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({
      email,
      password,
    });

    const response = await fetch(loginURL, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error("Something went wrong");
    }

    const data = await response.json();

    // Redirect to the customer page
    const redirectUrl =
      data.redirectUrl || `/customers/${data.customer.id}/dashboard/home`;
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
        <p>
          New to AaasoBo? <Link href="/customers/register">Register now</Link>
        </p>
        <button type="submit">LOGIN</button>
      </form>
    </div>
  );
}

export default Login;
