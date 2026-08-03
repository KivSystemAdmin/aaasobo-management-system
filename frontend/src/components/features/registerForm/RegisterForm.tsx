"use client";

import { useActionState, useState } from "react";
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
import { ENGLISH_BACKGROUND_LABELS } from "@/lib/data/englishBackground";

const DEFAULT_INSTRUCTOR_SKILL = `Science: [Can you provide a simple experiment?]
Cooking: [Can you lead a cooking class?]
Crafting: (Are you good at crafting?)
Origami: (Are you good at playing Origami?)
Minecraft: [Account required]
Roblox: [Account required]
Pokemon: [Do you know over 10 characters?]
Disney: [Do you know over 10 characters?]
Others: [Please specify:]`;

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
  const [englishBackground, setEnglishBackground] = useState<EnglishBackground>(
    EnglishBackground.NonNative,
  );
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
          <p className={styles.required}>*必須</p>

          {/* Name */}
          <InputField
            id="name"
            label="氏名"
            type="text"
            name="name"
            defaultValue={persistedValues.name}
            placeholder="例: John Doe"
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
                label="ニックネーム"
                type="text"
                name="nickname"
                defaultValue={persistedValues.nickname}
                placeholder="例: John"
                icon={<UserCircleIcon className={styles.icon} />}
                inputRequired
                error={localMessages.nickname}
                onChange={() => clearErrorMessage("nickname")}
              />

              {/* Birthday */}
              <InputField
                id="birthdate"
                label="お誕生日"
                type="date"
                name="birthdate"
                defaultValue={persistedValues.birthdate}
                placeholder="例: 2000-01-01"
                icon={<CakeIcon className={styles.icon} />}
                inputRequired
                onChange={() => clearErrorMessage("birthdate")}
              />
            </>
          )}

          {/* Email */}
          <InputField
            id="email"
            label="メールアドレス"
            type="email"
            name="email"
            defaultValue={persistedValues.email}
            placeholder="例: example@aaasobo.com"
            icon={<EnvelopeIcon className={styles.icon} />}
            inputRequired
            error={localMessages.email}
            onChange={() => clearErrorMessage("email")}
          />

          {/* Password */}
          <InputField
            id="password"
            label="パスワード"
            type="password"
            name="password"
            value={password}
            placeholder="8文字以上"
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
            language={language}
          />

          {/* Password Confirmation */}
          <InputField
            id="passConfirmation"
            label="パスワード確認"
            type="password"
            name="passConfirmation"
            defaultValue={persistedValues.passConfirmation}
            placeholder="例: 8文字以上"
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
                label="クラスURL"
                type="text"
                name="classURL"
                defaultValue={persistedValues.classURL}
                placeholder="例: https://zoom.us/j/..."
                icon={<LinkIcon className={styles.icon} />}
                inputRequired
                error={localMessages.classURL}
                onChange={() => clearErrorMessage("classURL")}
              />

              {/* Meeting ID */}
              <InputField
                id="meetingId"
                label="ミーティングID"
                type="text"
                name="meetingId"
                defaultValue={persistedValues.meetingId}
                placeholder="例: 123 456 7890"
                icon={<IdentificationIcon className={styles.icon} />}
                inputRequired
                error={localMessages.meetingId}
                onChange={() => clearErrorMessage("meetingId")}
              />

              {/* Pass Code */}
              <InputField
                id="passcode"
                label="パスコード"
                type="text"
                name="passcode"
                defaultValue={persistedValues.passcode}
                placeholder="例: 123456"
                icon={<KeyIcon className={styles.icon} />}
                inputRequired
                error={localMessages.passcode}
                onChange={() => clearErrorMessage("passcode")}
              />

              {/* Available Class */}
              <TextAreaInput
                id="workingTime"
                name="workingTime"
                label="クラス開催時間"
                defaultValue={persistedValues.workingTime}
                placeholder="例: 9 AM - 5 PM (フィリピン) の平日"
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
                label="経歴"
                defaultValue={persistedValues.lifeHistory}
                placeholder="例: 私はこれまで英語講師として10年以上の経験があります。"
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
                label="好きな食べ物"
                defaultValue={persistedValues.favoriteFood}
                placeholder="例: 寿司"
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
                label="趣味"
                defaultValue={persistedValues.hobby}
                placeholder="例: 読書"
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
                label="子供たちへのメッセージ"
                defaultValue={persistedValues.messageForChildren}
                placeholder="例: 常に楽しんでください！"
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
                label="スキル"
                defaultValue={persistedValues.skill ?? DEFAULT_INSTRUCTOR_SKILL}
                placeholder="例: 日本語"
                maxLength={500}
                icon={
                  <HandThumbUpIcon className={styles.textareaContainer__icon} />
                }
                unstyled
                labelTextClassName={styles.label}
                inputWrapperClassName={styles.textareaContainer}
                inputClassName={`${styles.textarea} ${styles.skillTextarea}`}
              />

              {/* English Background Selection (radio button) */}
              <label className={styles.label}>インストラクタータイプ</label>
              <div className={styles.radioButtonContainer}>
                <RadioButton
                  name="englishBackground"
                  value={EnglishBackground.NonNative}
                  checked={englishBackground === EnglishBackground.NonNative}
                  onChange={handleRadioChange}
                  label={ENGLISH_BACKGROUND_LABELS[EnglishBackground.NonNative]}
                  className={styles.englishBackgroundRadio}
                />
                <RadioButton
                  name="englishBackground"
                  value={EnglishBackground.NativeA}
                  checked={englishBackground === EnglishBackground.NativeA}
                  onChange={handleRadioChange}
                  label={ENGLISH_BACKGROUND_LABELS[EnglishBackground.NativeA]}
                  className={styles.englishBackgroundRadio}
                />
                <RadioButton
                  name="englishBackground"
                  value={EnglishBackground.NativeB}
                  checked={englishBackground === EnglishBackground.NativeB}
                  onChange={handleRadioChange}
                  label={ENGLISH_BACKGROUND_LABELS[EnglishBackground.NativeB]}
                  className={styles.englishBackgroundRadio}
                />
              </div>

              {/* Image File */}
              <Uploader label={"インストラクター画像"} />
            </>
          )}
        </>
      )}

      {/* Plan registration (only for admin) */}
      {userType === "admin" && categoryType === "plan" && (
        <>
          <p className={styles.required}>*必須</p>
          <InputField
            id="name"
            label="プラン名（日本語）"
            type="text"
            name="planNameJpn"
            defaultValue={persistedValues.planNameJpn}
            placeholder="例: 月3,180円プラン"
            icon={<AcademicCapIcon className={styles.icon} />}
            inputRequired
            error={localMessages.planNameJpn}
            onChange={() => clearErrorMessage("planNameJpn")}
          />
          <InputField
            id="name"
            label="プラン名（英語）"
            type="text"
            name="planNameEng"
            defaultValue={persistedValues.planNameEng}
            placeholder="例: 3,180 yen/month Plan"
            icon={<AcademicCapIcon className={styles.icon} />}
            inputRequired
            error={localMessages.planNameEng}
            onChange={() => clearErrorMessage("planNameEng")}
          />
          <InputField
            id="weeklyClassTimes"
            label="週ごとの授業回数"
            type="number"
            name="weeklyClassTimes"
            defaultValue={persistedValues.weeklyClassTimes}
            placeholder="例: 2"
            icon={<CalendarIcon className={styles.icon} />}
            inputRequired
            error={localMessages.weeklyClassTimes}
            onChange={() => clearErrorMessage("weeklyClassTimes")}
          />
          <InputField
            id="description"
            label="説明"
            type="text"
            name="description"
            defaultValue={persistedValues.description}
            placeholder="例: 週2回の授業"
            icon={<DocumentTextIcon className={styles.icon} />}
            inputRequired
            error={localMessages.description}
            onChange={() => clearErrorMessage("description")}
          />{" "}
          {/* Plan Type (Radio button) */}
          <label className={styles.label}>インストラクタータイプ</label>
          <div className={styles.radioButtonContainer}>
            <RadioButton
              name="englishBackground"
              value={EnglishBackground.NonNative}
              checked={englishBackground === EnglishBackground.NonNative}
              onChange={handleRadioChange}
              label={ENGLISH_BACKGROUND_LABELS[EnglishBackground.NonNative]}
              className={styles.englishBackgroundRadio}
            />
            <RadioButton
              name="englishBackground"
              value={EnglishBackground.NativeA}
              checked={englishBackground === EnglishBackground.NativeA}
              onChange={handleRadioChange}
              label={ENGLISH_BACKGROUND_LABELS[EnglishBackground.NativeA]}
              className={styles.englishBackgroundRadio}
            />
            <RadioButton
              name="englishBackground"
              value={EnglishBackground.NativeB}
              checked={englishBackground === EnglishBackground.NativeB}
              onChange={handleRadioChange}
              label={ENGLISH_BACKGROUND_LABELS[EnglishBackground.NativeB]}
              className={styles.englishBackgroundRadio}
            />
          </div>
        </>
      )}

      {/* Event registration (only for admin) */}
      {userType === "admin" && categoryType === "event" && (
        <>
          <p className={styles.required}>*必須</p>
          <InputField
            id="eventNameJpn"
            label="イベント名（日本語）"
            type="text"
            name="eventNameJpn"
            defaultValue={persistedValues.eventNameJpn}
            placeholder="例: アーソボイベント"
            icon={<AcademicCapIcon className={styles.icon} />}
            inputRequired
            error={localMessages.eventNameJpn}
            onChange={() => clearErrorMessage("eventNameJpn")}
          />
          <InputField
            id="eventNameEng"
            label="イベント名（英語）"
            type="text"
            name="eventNameEng"
            defaultValue={persistedValues.eventNameEng}
            placeholder="例: AaasoBo! Event"
            icon={<AcademicCapIcon className={styles.icon} />}
            inputRequired
            error={localMessages.eventNameEng}
            onChange={() => clearErrorMessage("eventNameEng")}
          />
          <div className={styles.eventColor}>
            <InputField
              id="color"
              label="カラーコード"
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
      <div className={styles.buttonWrapper}>
        <ActionButton btnText="登録" className="bookBtn" type="submit" />
      </div>
    </form>
  );
};

export default RegisterForm;
