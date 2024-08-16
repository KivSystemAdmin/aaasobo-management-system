"use client";

import React, { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useInput } from "@/app/hooks/useInput";
import { isValidLogin } from "@/app/helper/validationUtils";
import styles from "./page.module.scss";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import TextInput from "@/app/components/TextInput";
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import ActionButton from "@/app/components/ActionButton";

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

    if (!checkResult.isValid) {
      toast.warning(checkResult.message);
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

    if (!response.ok) {
      toast.error("Login Failed. Please check email/password.");
      return;
    }

    router.push("/admins/calendar");
  };

  return (
    <div>
      <ToastContainer />
      <div className={styles.outsideContainer}>
        <div className={styles.container}>
          <Image
            src={"/images/logo2.svg"}
            alt="logo"
            width={100}
            height={100}
            className={styles.logo}
          />
          <h2>Login for admin</h2>
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
    </div>
  );
}

export default Login;
