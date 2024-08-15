"use client";

import TextInput from "@/app/components/TextInput";
import { useInput } from "@/app/hooks/useInput";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { FormEvent } from "react";
import styles from "./page.module.scss";
import ActionButton from "@/app/components/ActionButton";
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";

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
      credentials: "include",
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error("Something went wrong");
    }

    const data = await response.json();

    // Redirect to the customer page
    const redirectUrl =
      data.redirectUrl || `/customers/${data.customer.id}/classes`;
    router.push(redirectUrl);
  };
  return (
    <div className={styles.outsideContainer}>
      <div className={styles.container}>
        <Image
          src={"/images/logo2.svg"}
          alt="logo"
          width={100}
          height={100}
          className={styles.logo}
        />
        <h2>Login</h2>
        <p>
          Not a member yet? <Link href="/customers/register">Join us!</Link>
        </p>
        <form className={styles.form}>
          <TextInput
            label="Email"
            type="email"
            value={email}
            placeholder="example@aaasobo.com"
            onChange={onEmailChange}
            icon={<EnvelopeIcon className={styles.icon} />}
          />
          <TextInput
            label="Password"
            type="password"
            value={password}
            placeholder="password"
            onChange={onPasswordChange}
            icon={<LockClosedIcon className={styles.icon} />}
          />
          {/* <Link href="/customers/register">Forgot Password?</Link> */}
          <div className={styles.buttonWrapper}>
            <ActionButton
              btnText="Login"
              onClick={loginHandler}
              className="bookBtn"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
