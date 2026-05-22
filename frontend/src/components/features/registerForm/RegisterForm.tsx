"use client";

import { useActionState, useRef, useState } from "react";
import styles from "./RegisterForm.module.scss";
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserCircleIcon,
  DocumentTextIcon,
  IdentificationIcon,
  KeyIcon,
  LinkIcon,
  AcademicCapIcon,
  CalendarIcon,
  CakeIcon,
  CalendarDaysIcon,
  NewspaperIcon,
  PencilSquareIcon,
  LightBulbIcon,
  FaceSmileIcon,
  HandThumbUpIcon,
} from "@heroicons/react/24/outline";
import ActionButton from "../../elements/buttons/actionButton/ActionButton";
import InputField from "../../elements/inputField/InputField";
import PasswordStrengthMeter from "../../elements/passwordStrengthMeter/PasswordStrengthMeter";
import { registerUser } from "@/app/actions/registerUser";
import { registerContent } from "@/app/actions/registerContent";
import { useFormMessages } from "@/hooks/useFormMessages";
import { usePasswordStrength } from "@/hooks/usePasswordStrength";
import { defaultColor } from "@/lib/data/data";
import FormValidationMessage from "../../elements/formValidationMessage/FormValidationMessage";
import Uploader from "./uploadImages/Uploader";
import { EnglishBackground } from "@/types";
import RadioButton from "../../elements/radioButton/RadioButton";
import TextAreaInput from "../../elements/textAreaInput/TextAreaInput";

const RegisterForm = ({
  categoryType,
  userType,
  language,
}: {
  categoryType?: CategoryType;
  userType: UserType;
  language?: LanguageType;
}) => {
  // Handle the action based on userType and categoryType
  const actionHandler =
    userType === "admin" && categoryType ? registerContent : registerUser;
  const [registerResultState, formAction] = useActionState(
    actionHandler,
    undefined,
  );

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [colorValue, setColorValue] = useState(defaultColor);
  const [submittedValues, setSubmittedValues] = useState<
    Record<string, string>
  >({});
  const { localMessages, clearErrorMessage, resetMessages } =
    useFormMessages(registerResultState);
  const { passwordStrength } = usePasswordStrength(password);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [englishBackground, setEnglishBackground] = useState<EnglishBackground>(
    EnglishBackground.NonNative,
  );
  const englishBackgroundLabels = [
    "Non Native",
    "Native A",
    "Native B",
  ] as const;

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnglishBackground = Number(e.target.value);
    setEnglishBackground(newEnglishBackground);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    resetMessages();
    const formData = new FormData(event.currentTarget);
    const values: Record<string, string> = {};

    formData.forEach((value, key) => {
      if (typeof value === "string") {
        values[key] = value;
      }
    });

    setSubmittedValues(values);
  };

  const persistedValues = registerResultState?.successMessage
    ? {}
    : submittedValues;

  return (
    <form action={formAction} className={styles.form} onSubmit={handleSubmit}>
      {/* Hidden fields to include in form submission */}
      <input type="hidden" name="userType" value={userType ?? ""} />
      <input type="hidden" name="categoryType" value={categoryType ?? ""} />
      <input
        type="hidden"
        name="passwordStrength"
        value={passwordStrength ?? ""}
      />

      {((userType === "admin" && !categoryType) ||
        userType === "instructor") && (
        <>
          <p className={styles.required}>*Required</p>

          {/* Name */}
          <InputField
            id="name"
            label="Name"
            type="text"
            name="name"
            defaultValue={persistedValues.name}
            placeholder="e.g., John Doe"
            icon={<UserCircleIcon className={styles.icon} />}
            inputRequired
            error={localMessages.name}
            onChange={() => clearErrorMessage("name")}
          />

          {userType === "instructor" && (
            <>
              {/* Nickname */}
              <InputField
                id="nickname"
                label="Nickname"
                type="text"
                name="nickname"
                defaultValue={persistedValues.nickname}
                placeholder="e.g., John"
                icon={<UserCircleIcon className={styles.icon} />}
                inputRequired
                error={localMessages.nickname}
                onChange={() => clearErrorMessage("nickname")}
              />

              {/* Birthday */}
              <InputField
                id="birthdate"
                label="Birthday"
                type="date"
                name="birthdate"
                defaultValue={persistedValues.birthdate}
                placeholder="e.g., 2000-01-01"
                icon={<CakeIcon className={styles.icon} />}
                inputRequired
                onChange={() => clearErrorMessage("birthdate")}
              />
            </>
          )}

          {/* Email */}
          <InputField
            id="email"
            label="Email"
            type="email"
            name="email"
            defaultValue={persistedValues.email}
            placeholder="e.g., example@aaasobo.com"
            icon={<EnvelopeIcon className={styles.icon} />}
            inputRequired
            error={localMessages.email}
            onChange={() => clearErrorMessage("email")}
          />

          {/* Password */}
          <InputField
            id="password"
            label="Password"
            type="password"
            name="password"
            value={password}
            placeholder="At least 8 characters"
            onChange={(event) => {
              setPassword(event.target.value);
              clearErrorMessage("password");
            }}
            icon={<LockClosedIcon className={styles.icon} />}
            inputRequired
            minLength={8}
            error={localMessages.password}
            showPassword={showPassword}
            onTogglePasswordVisibility={() => setShowPassword((prev) => !prev)}
          />

          {/* Password strength meter */}
          <PasswordStrengthMeter
            password={password}
            passwordStrength={passwordStrength}
          />

          {/* Password Confirmation */}
          <InputField
            id="passConfirmation"
            label="Password Confirmation"
            type="password"
            name="passConfirmation"
            defaultValue={persistedValues.passConfirmation}
            placeholder="Re-enter your password"
            icon={<LockClosedIcon className={styles.icon} />}
            inputRequired
            error={localMessages.passConfirmation}
            onChange={() => clearErrorMessage("passConfirmation")}
            showPassword={showPassword}
            onTogglePasswordVisibility={() => setShowPassword((prev) => !prev)}
          />

          {userType === "instructor" && (
            <>
              {/* Class URL */}
              <InputField
                id="classURL"
                label="Class URL"
                type="text"
                name="classURL"
                defaultValue={persistedValues.classURL}
                placeholder="e.g., https://zoom.us/j/..."
                icon={<LinkIcon className={styles.icon} />}
                inputRequired
                error={localMessages.classURL}
                onChange={() => clearErrorMessage("classURL")}
              />

              {/* Meeting ID */}
              <InputField
                id="meetingId"
                label="Meeting ID"
                type="text"
                name="meetingId"
                defaultValue={persistedValues.meetingId}
                placeholder="e.g., 123 456 7890"
                icon={<IdentificationIcon className={styles.icon} />}
                inputRequired
                error={localMessages.meetingId}
                onChange={() => clearErrorMessage("meetingId")}
              />

              {/* Pass Code */}
              <InputField
                id="passcode"
                label="Pass Code"
                type="text"
                name="passcode"
                defaultValue={persistedValues.passcode}
                placeholder="e.g., 123456"
                icon={<KeyIcon className={styles.icon} />}
                inputRequired
                error={localMessages.passcode}
                onChange={() => clearErrorMessage("passcode")}
              />

              {/* Available Class */}
              <TextAreaInput
                id="workingTime"
                name="workingTime"
                label="Available Class"
                defaultValue={persistedValues.workingTime}
                placeholder="e.g., 9 AM - 5 PM (Philippines) on weekdays"
                maxLength={500}
                icon={
                  <CalendarDaysIcon
                    className={styles.textareaContainer__icon}
                  />
                }
                unstyled
                labelTextClassName={styles.label}
                inputWrapperClassName={styles.textareaContainer}
                inputClassName={styles.textarea}
              />

              {/* Life History */}
              <TextAreaInput
                id="lifeHistory"
                name="lifeHistory"
                label="Life History"
                defaultValue={persistedValues.lifeHistory}
                placeholder="e.g., I am a dedicated instructor with a passion for teaching."
                maxLength={500}
                icon={
                  <NewspaperIcon className={styles.textareaContainer__icon} />
                }
                unstyled
                labelTextClassName={styles.label}
                inputWrapperClassName={styles.textareaContainer}
                inputClassName={styles.textarea}
              />

              {/* Favorite Food */}
              <TextAreaInput
                id="favoriteFood"
                name="favoriteFood"
                label="Favorite Food"
                defaultValue={persistedValues.favoriteFood}
                placeholder="e.g., Sushi"
                maxLength={500}
                icon={
                  <FaceSmileIcon className={styles.textareaContainer__icon} />
                }
                unstyled
                labelTextClassName={styles.label}
                inputWrapperClassName={styles.textareaContainer}
                inputClassName={styles.textarea}
              />

              {/* Hobby */}
              <TextAreaInput
                id="hobby"
                name="hobby"
                label="Hobby"
                defaultValue={persistedValues.hobby}
                placeholder="e.g., Reading"
                maxLength={500}
                icon={
                  <LightBulbIcon className={styles.textareaContainer__icon} />
                }
                unstyled
                labelTextClassName={styles.label}
                inputWrapperClassName={styles.textareaContainer}
                inputClassName={styles.textarea}
              />

              {/* Message For Children */}
              <TextAreaInput
                id="messageForChildren"
                name="messageForChildren"
                label="Message For Children"
                defaultValue={persistedValues.messageForChildren}
                placeholder="e.g., Always do your best!"
                maxLength={500}
                icon={
                  <PencilSquareIcon
                    className={styles.textareaContainer__icon}
                  />
                }
                unstyled
                labelTextClassName={styles.label}
                inputWrapperClassName={styles.textareaContainer}
                inputClassName={styles.textarea}
              />

              {/* Skill */}
              <TextAreaInput
                id="skill"
                name="skill"
                label="Skill"
                defaultValue={persistedValues.skill}
                placeholder="e.g., Japanese Language"
                maxLength={500}
                icon={
                  <HandThumbUpIcon className={styles.textareaContainer__icon} />
                }
                unstyled
                labelTextClassName={styles.label}
                inputWrapperClassName={styles.textareaContainer}
                inputClassName={styles.textarea}
              />

              {/* English Background Selection (radio button) */}
              <label className={styles.label}>English Background</label>
              <div className={styles.radioButtonContainer}>
                <RadioButton
                  name="englishBackground"
                  value={EnglishBackground.NonNative}
                  checked={englishBackground === EnglishBackground.NonNative}
                  onChange={handleRadioChange}
                  label={englishBackgroundLabels[EnglishBackground.NonNative]}
                  className={styles.englishBackgroundRadio}
                />
                <RadioButton
                  name="englishBackground"
                  value={EnglishBackground.NativeA}
                  checked={englishBackground === EnglishBackground.NativeA}
                  onChange={handleRadioChange}
                  label={englishBackgroundLabels[EnglishBackground.NativeA]}
                  className={styles.englishBackgroundRadio}
                />
                <RadioButton
                  name="englishBackground"
                  value={EnglishBackground.NativeB}
                  checked={englishBackground === EnglishBackground.NativeB}
                  onChange={handleRadioChange}
                  label={englishBackgroundLabels[EnglishBackground.NativeB]}
                  className={styles.englishBackgroundRadio}
                />
              </div>

              {/* Image File */}
              <input
                type="file"
                name="icon"
                ref={fileInputRef}
                style={{ display: "none" }}
              />
              <Uploader
                onFileSelect={(file) => {
                  if (fileInputRef.current && file) {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInputRef.current.files = dataTransfer.files;
                  }
                }}
                clearFileInputRef={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                label={"Instructor profile image"}
              />
            </>
          )}
        </>
      )}

      {/* Plan registration (only for admin) */}
      {userType === "admin" && categoryType === "plan" && (
        <>
          <p className={styles.required}>*Required</p>
          <InputField
            id="name"
            label="Plan Name (Japanese)"
            type="text"
            name="planNameJpn"
            defaultValue={persistedValues.planNameJpn}
            placeholder="e.g., 月3,180円プラン"
            icon={<AcademicCapIcon className={styles.icon} />}
            inputRequired
            error={localMessages.planNameJpn}
            onChange={() => clearErrorMessage("planNameJpn")}
          />
          <InputField
            id="name"
            label="Plan Name (English)"
            type="text"
            name="planNameEng"
            defaultValue={persistedValues.planNameEng}
            placeholder="e.g., 3,180 yen/month Plan"
            icon={<AcademicCapIcon className={styles.icon} />}
            inputRequired
            error={localMessages.planNameEng}
            onChange={() => clearErrorMessage("planNameEng")}
          />
          <InputField
            id="weeklyClassTimes"
            label="Weekly Class Times"
            type="number"
            name="weeklyClassTimes"
            defaultValue={persistedValues.weeklyClassTimes}
            placeholder="e.g., 2"
            icon={<CalendarIcon className={styles.icon} />}
            inputRequired
            error={localMessages.weeklyClassTimes}
            onChange={() => clearErrorMessage("weeklyClassTimes")}
          />
          <InputField
            id="description"
            label="Description"
            type="text"
            name="description"
            defaultValue={persistedValues.description}
            placeholder="e.g., 2 classes per week"
            icon={<DocumentTextIcon className={styles.icon} />}
            inputRequired
            error={localMessages.description}
            onChange={() => clearErrorMessage("description")}
          />{" "}
          {/* Plan Type (Radio button) */}
          <label className={styles.label}>English Background</label>
          <div className={styles.radioButtonContainer}>
            <RadioButton
              name="englishBackground"
              value={EnglishBackground.NonNative}
              checked={englishBackground === EnglishBackground.NonNative}
              onChange={handleRadioChange}
              label={englishBackgroundLabels[EnglishBackground.NonNative]}
              className={styles.englishBackgroundRadio}
            />
            <RadioButton
              name="englishBackground"
              value={EnglishBackground.NativeA}
              checked={englishBackground === EnglishBackground.NativeA}
              onChange={handleRadioChange}
              label={englishBackgroundLabels[EnglishBackground.NativeA]}
              className={styles.englishBackgroundRadio}
            />
            <RadioButton
              name="englishBackground"
              value={EnglishBackground.NativeB}
              checked={englishBackground === EnglishBackground.NativeB}
              onChange={handleRadioChange}
              label={englishBackgroundLabels[EnglishBackground.NativeB]}
              className={styles.englishBackgroundRadio}
            />
          </div>
        </>
      )}

      {/* Event registration (only for admin) */}
      {userType === "admin" && categoryType === "event" && (
        <>
          <p className={styles.required}>*Required</p>
          <InputField
            id="eventNameJpn"
            label="Event Name (Japanese)"
            type="text"
            name="eventNameJpn"
            defaultValue={persistedValues.eventNameJpn}
            placeholder="e.g., アーソボイベント"
            icon={<AcademicCapIcon className={styles.icon} />}
            inputRequired
            error={localMessages.eventNameJpn}
            onChange={() => clearErrorMessage("eventNameJpn")}
          />
          <InputField
            id="eventNameEng"
            label="Event Name (English)"
            type="text"
            name="eventNameEng"
            defaultValue={persistedValues.eventNameEng}
            placeholder="e.g., AaasoBo! Event"
            icon={<AcademicCapIcon className={styles.icon} />}
            inputRequired
            error={localMessages.eventNameEng}
            onChange={() => clearErrorMessage("eventNameEng")}
          />
          <div className={styles.eventColor}>
            <InputField
              id="color"
              label="Color Code"
              type="color"
              name="color"
              value={colorValue}
              icon={<DocumentTextIcon className={styles.icon} />}
              inputRequired
              error={localMessages.color}
              onChange={(e) => {
                setColorValue(e.target.value);
                clearErrorMessage("color");
              }}
            />
            <div className={styles.eventColor__text}>
              {colorValue.toUpperCase()}
            </div>
          </div>
        </>
      )}

      {/* Error and success messages */}
      <div className={styles.messageWrapper}>
        {localMessages.errorMessage && (
          <FormValidationMessage
            type="error"
            message={localMessages.errorMessage}
          />
        )}
        {localMessages.successMessage && (
          <FormValidationMessage
            type="success"
            message={localMessages.successMessage}
          />
        )}
      </div>

      {/* Submission Button */}
      {!categoryType ? (
        <div className={styles.buttonWrapper}>
          <ActionButton
            btnText={language === "ja" ? "アカウント登録" : "Create Account"}
            className="bookBtn"
            type="submit"
          />
        </div>
      ) : (
        <div className={styles.buttonWrapper}>
          <ActionButton
            btnText={`Register ${
              categoryType
                ? categoryType.charAt(0).toUpperCase() + categoryType.slice(1)
                : ""
            }`}
            className="bookBtn"
            type="submit"
          />
        </div>
      )}
    </form>
  );
};

export default RegisterForm;
