"use client";

import { FormEvent } from "react";
import { useInput } from "@/app/hooks/useInput";
import { isValidRegister } from "@/app/helper/validationUtils";
import styles from "./page.module.scss";
import {
  DocumentTextIcon,
  EnvelopeIcon,
  IdentificationIcon,
  KeyIcon,
  LinkIcon,
  LockClosedIcon,
  PhotoIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import ActionButton from "@/app/components/ActionButton";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import TextInput from "@/app/components/TextInput";

function Register() {
  const [name, onNameChange] = useInput();
  const [email, onEmailChange] = useInput();
  const [password, onPasswordChange] = useInput();
  const [passConfirmation, onPassConfirmationChange] = useInput();
  const [nickname, onNicknameChange] = useInput();
  const [icon, onIconChange] = useInput();
  const [classURL, onClassURLChange] = useInput();
  const [meetingId, onMeetingIdChange] = useInput();
  const [passcode, onPasscodeChange] = useInput();
  const [introductionURL, onIntroductionURLChange] = useInput();

  const router = useRouter();

  // Register the admin.
  const registerHandler = async (e: FormEvent) => {
    e.preventDefault();

    // Check the validation of the input values.
    const checkResult = isValidRegister({
      name,
      email,
      password,
      passConfirmation,
    });

    if (!checkResult.isValid) {
      toast.warning(checkResult.message);
      return;
    }

    // If the values are null, return it.
    if (
      !nickname ||
      !icon ||
      !classURL ||
      !meetingId ||
      !passcode ||
      !introductionURL
    ) {
      toast.warning("Please fill in the required information.");
      return;
    }

    // Define the data to be sent to the server side.
    const BACKEND_ORIGIN =
      process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:4000";
    const registerURL = `${BACKEND_ORIGIN}/admins/instructor-list/register`;
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({
      name,
      email,
      password,
      nickname,
      icon,
      classURL,
      meetingId,
      passcode,
      introductionURL,
    });

    const response = await fetch(registerURL, {
      method: "POST",
      credentials: "include",
      headers,
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error("Failed to register an instructor.");
      return;
    }

    // Redirect to the instructor list page
    router.push(`/admins/instructor-list`);
  };

  return (
    <div>
      <ToastContainer />
      <h2>Instructor Registration</h2>
      <form className={styles.formContainer}>
        <TextInput
          label="Name"
          type="name"
          value={name}
          placeholder="e.g., John Doe"
          onChange={onNameChange}
          icon={<UserCircleIcon className={styles.icon} />}
          inputRequired={true}
        />
        <TextInput
          label="Nickname"
          type="text"
          value={nickname}
          placeholder="e.g., John"
          onChange={onNicknameChange}
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
        {/*TODO: Should be used update file function **/}
        <TextInput
          label="Icon"
          type="text"
          value={icon}
          placeholder="e.g., john-1.jpg"
          onChange={onIconChange}
          icon={<PhotoIcon className={styles.icon} />}
          inputRequired={true}
        />
        <TextInput
          label="Class URL"
          type="text"
          value={classURL}
          placeholder="e.g., https://zoom.us/j/..."
          onChange={onClassURLChange}
          icon={<LinkIcon className={styles.icon} />}
          inputRequired={true}
        />
        <TextInput
          label="Meeting ID"
          type="text"
          value={meetingId}
          placeholder="e.g., 123 456 7890"
          onChange={onMeetingIdChange}
          icon={<IdentificationIcon className={styles.icon} />}
          inputRequired={true}
        />
        <TextInput
          label="Pass Code"
          type="text"
          value={passcode}
          placeholder="e.g., john"
          onChange={onPasscodeChange}
          icon={<KeyIcon className={styles.icon} />}
          inputRequired={true}
        />
        <TextInput
          label="Introduction URL"
          type="text"
          value={introductionURL}
          placeholder="e.g., https://..."
          onChange={onIntroductionURLChange}
          icon={<DocumentTextIcon className={styles.icon} />}
          inputRequired={true}
        />
        <div className={styles.buttonWrapper}>
          <ActionButton
            btnText="Register"
            onClick={registerHandler}
            className="bookBtn"
          />
        </div>
      </form>
    </div>
  );
}

export default Register;
