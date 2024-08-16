"use client";

import { useInput } from "@/app/hooks/useInput";
import { useRouter } from "next/navigation";
import React, { FormEvent, useState } from "react";
import { prefectures } from "@/app/helper/data";
import styles from "./page.module.scss";
import Image from "next/image";
import Link from "next/link";
import TextInput from "@/app/components/TextInput";
import {
  EnvelopeIcon,
  HomeIcon,
  LockClosedIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import ActionButton from "@/app/components/ActionButton";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelect } from "@/app/hooks/useSelect";

function Register() {
  const [name, onNameChange] = useInput();
  const [email, onEmailChange] = useInput();
  const [password, onPasswordChange] = useInput();
  const [passConfirmation, onPassConfirmationChange] = useInput();
  const [prefecture, setPrefecture, onPrefectureChange] = useSelect(
    prefectures[0],
  );
  const [isAgreed, setIsAgreed] = useState(false);
  const router = useRouter();

  const registerHandler = async (e: FormEvent) => {
    e.preventDefault();

    // If the values are null, return it.
    if (!name || !email || !password || !passConfirmation || !prefecture) {
      toast.warning("Please fill in the required information.");
      return;
    }

    // If values of password and password confirmation is different, return it.
    if (password !== passConfirmation) {
      toast.warning("Passwords do not match.");
      return;
    }

    if (!isAgreed) {
      toast.warning("You must agree to the privacy policy.");
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
          <h2>Create a free account</h2>
          <p className={styles.paragraph}>
            Already a member? <Link href="/customers/login">Log In</Link>
          </p>
          <form className={styles.form}>
            <p className={styles.required}>*Required</p>
            <TextInput
              label="Name"
              type="text"
              value={name}
              placeholder="e.g., John Doe"
              onChange={onNameChange}
              icon={<UserCircleIcon className={styles.icon} />}
              inputRequired={true}
            />
            <TextInput
              label="Email"
              type="email"
              value={email}
              placeholder="e.g., example@aaasobo.com"
              onChange={onEmailChange}
              icon={<EnvelopeIcon className={styles.icon} />}
              inputRequired={true}
            />
            <TextInput
              label="Password"
              type="password"
              value={password}
              placeholder="At least 6 alphanumeric characters"
              onChange={onPasswordChange}
              icon={<LockClosedIcon className={styles.icon} />}
              inputRequired={true}
            />
            <TextInput
              label="Password Confirmation"
              type="password"
              value={passConfirmation}
              placeholder="Re-enter your password"
              onChange={onPassConfirmationChange}
              icon={<LockClosedIcon className={styles.icon} />}
              inputRequired={true}
            />
            <label className={styles.label}>
              Prefecture of Residence
              <span className={styles.required}>*</span>
              <div className={styles.selectWrapper}>
                <HomeIcon className={styles.icon} />
                <select
                  className={styles.select}
                  value={prefecture}
                  onChange={onPrefectureChange}
                >
                  {prefectures.map((prefecture) => (
                    <option key={prefecture} value={prefecture}>
                      {prefecture}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <label className={styles.label}>
              Privacy Policy
              <span className={styles.required}>*</span>
              <p className={styles.privacyPolicy}>
                We will take a screenshot as a record that the class was
                conducted. Additionally, we may record the session for the
                purpose of improving the instructor's skills.
              </p>
            </label>
            <div className={styles.checkboxWrapper}>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  checked={isAgreed}
                  onChange={() => setIsAgreed(!isAgreed)}
                  required
                />
                I agree.
              </label>
            </div>
            <div className={styles.buttonWrapper}>
              <ActionButton
                btnText="Create Account"
                onClick={registerHandler}
                className="bookBtn"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
