import { CONTACT_EMAIL, LINE_QR_CODE_URL } from "../data/contacts";

export const FAILED_TO_FETCH_REBOOKABLE_CLASSES =
  "We couldn't load your available classes to rebook. Please refresh the page or try again later. / 振替予約可能クラスの読み込みに失敗しました。ページを再読み込みするか、しばらくしてからもう一度お試しください。";

export const FAILED_TO_FETCH_REBOOKABLE_INSTRUCTORS =
  "We couldn't load available instructors to rebook. Please refresh the page or try again later. / 振替予約可能なインストラクター情報を取得できませんでした。ページを再読み込みするか、しばらくしてからもう一度お試しください。";

export const FAILED_TO_FETCH_INSTRUCTOR_PROFILES =
  "We couldn't load instructors' profiles. Please refresh the page or try again later. / インストラクター情報を取得できませんでした。ページを再読み込みするか、しばらくしてからもう一度お試しください。";

export const FAILED_TO_FETCH_CHILD_PROFILES =
  "We couldn't load your children' profiles. Please refresh the page or try again later. / お子さまのプロフィールを取得できませんでした。ページを再読み込みするか、しばらくしてからもう一度お試しください。";

export const INVALID_CUSTOMER_ID =
  "We encountered an issue while processing your ID. Please refresh the page or try again later. / カスタマーIDの処理中に問題が発生しました。ページを再読み込みするか、しばらくしてからもう一度お試しください。";

export const FAILED_TO_FETCH_UPCOMING_CLASSES =
  "We couldn't load your upcoming classes. Please refresh the page or try again later. / 予約済みクラスの読み込みに失敗しました。ページを再読み込みするか、しばらくしてからもう一度お試しください。";

export const FAILED_TO_FETCH_CUSTOMER_CLASSES =
  "We couldn't load your classes. Please refresh the page or try again later. / クラスの読み込みに失敗しました。ページを再読み込みするか、しばらくしてからもう一度お試しください。";

export const FAILED_TO_FETCH_CUSTOMER_PROFILE =
  "We couldn't load your profile. Please refresh the page or try again later. / プロフィールの読み込みに失敗しました。ページを再読み込みするか、しばらくしてからもう一度お試しください。";

export const CANCELATION_NOT_ALLOWED_MESSAGE = {
  ja: "日本時間を基準とし、クラスは予定日の当日以降、キャンセルできません。",
  en: "Based on Japan Standard Time, classes cannot be canceled on or after the scheduled day.",
};

export const CONFIRM_CLASS_CANCELLATION = {
  ja: "選択したクラスをキャンセルしてもよろしいですか？",
  en: "Are you sure you want to cancel the selected class(es)?",
};

export const SELECTED_CLASSES_CANCELLATION_SUCCESS = {
  ja: "選択したクラスのキャンセルが完了しました。",
  en: "The selected class(es) have been successfully canceled.",
};

export const FAILED_TO_CANCEL_INVALID_CLASSES = {
  ja: `無効なクラスIDが含まれていたため、キャンセルに失敗しました。しばらくしてから再度お試しください。解決しない場合は ${CONTACT_EMAIL} かLINE（${LINE_QR_CODE_URL}）で連絡ください。`,
  en: `The cancellation failed due to an invalid class ID. Please try again after some time. If the issue persists, contact us at ${CONTACT_EMAIL} or LINE(${LINE_QR_CODE_URL}).`,
};

export const FAILED_TO_CANCEL_CLASSES = {
  ja: `選択したクラスのキャンセルに失敗しました。お手数ですが、しばらくしてから再度お試しください。解決しない場合は ${CONTACT_EMAIL} かLINE（${LINE_QR_CODE_URL}）でご連絡ください。`,
  en: `Failed to cancel the selected classes. Please try again after a short while. If the issue persists, contact us at ${CONTACT_EMAIL} or LINE(${LINE_QR_CODE_URL}).`,
};

export const NO_CANCELABLE_CLASSES_MESSAGE = {
  ja: "キャンセル可能なクラスはありません。",
  en: "You have no classes that can be canceled.",
};

export const TODAYS_CLASS_REBOOKING_NOTICE = {
  ja: "当日の振替は、クラス開始の3時間前まで可能です。ただし、インストラクターの準備が間に合わない場合、キャンセルとなることがございますのでご了承ください。",
  en: "You can rebook a class on the same day up to 3 hours before it starts. However, please note that in some cases, the class may be canceled if the instructor doesn't have enough time to prepare.",
};

export const FREE_TRIAL_BOOKING_ELIGIBILITY_NOTE = {
  ja: "無料トライアルクラスは、ご予約の際から72時間以上あとに始まるクラスが対象となります。",
  en: "Only classes starting 72+ hours from now are eligible for free trial booking.",
};

export const FREE_TRIAL_BOOKING_TOO_LATE_NOTICE = {
  ja: "無料トライアルクラスの予約は、予約対象となる最終クラスの開始72時間前までとなっております。申し訳ありませんが、すでにその期限を過ぎているため、予約は行えません。",
  en: "You can only book free trial classes up to 72 hours before the final eligible class. Unfortunately, that deadline has passed.",
};

export const REBOOKING_TOO_LATE_NOTICE = {
  ja: "振替予約の受付は、振替対象となる最終クラスの開始3時間前までとなっております。申し訳ありませんが、すでにその期限を過ぎているため、振替は行えません。",
  en: "Rebooking is allowed up to 3 hours before your final eligible class. We're sorry, but the deadline has passed and this class can no longer be rebooked.",
};

export const CHILD_PROFILE_REQUIRED_MESSAGE = {
  ja: "お子さまのプロフィールが未登録のため、振替予約を行うことができません。サイドメニューの「お子さまプロフィール」からプロフィールを登録のうえ、再度振替予約を行ってください。",
  en: "You cannot rebook a class because your child's profile has not been registered. Please go to 'Child Profile' in the side menu to register the profile, then try rebooking again.",
};

// ClassDetail Modal
export const NO_CLASS_DETAILS = {
  ja: "クラス情報が取得できませんでした。",
  en: "No class details available",
};

export const CANNOT_CANCEL_ON_OR_AFTER_CLASS_DAY = {
  ja: `クラス当日以降のキャンセルは承っておりません。当日キャンセルをご希望の方は、${CONTACT_EMAIL} かLINE（${LINE_QR_CODE_URL}）でご連絡ください。`,
  en: `Same-day or later cancellations aren't available. Please contact us at ${CONTACT_EMAIL} or LINE(${LINE_QR_CODE_URL}) if needed.`,
};

export const CANCEL_CLASS_CONFIRM_MESSAGE = {
  ja: "このクラスをキャンセルしてもよろしいですか？",
  en: "Are you sure you want to cancel this class?",
};

export const CLASS_CANCELLATION_SUCCESS = {
  ja: "クラスのキャンセルが完了しました。",
  en: "The class has been successfully canceled.",
};

export const FAILED_TO_CANCEL_INVALID_CLASS = {
  ja: `クラスIDが無効だったため、キャンセルに失敗しました。しばらくしてから再度お試しください。解決しない場合は ${CONTACT_EMAIL} かLINE（${LINE_QR_CODE_URL}）でご連絡ください。`,
  en: `The cancellation failed due to an invalid class ID. Please try again after some time. If the issue persists, contact us at ${CONTACT_EMAIL} or LINE(${LINE_QR_CODE_URL}).`,
};

export const FAILED_TO_CANCEL_CLASS = {
  ja: `クラスのキャンセルに失敗しました。お手数ですが、しばらくしてから再度お試しください。解決しない場合は ${CONTACT_EMAIL} かLINE（${LINE_QR_CODE_URL}）でご連絡ください。`,
  en: `Failed to cancel the class. Please try again after a short while. If the issue persists, contact us at ${CONTACT_EMAIL} or LINE(${LINE_QR_CODE_URL}).`,
};

export const CANCELED_BY_INSTRUCTOR_NOTICE = {
  ja: "インストラクターの都合でキャンセルとなったクラスは、振替可能クラスとしてカウントされ、180日間有効です。",
  en: "Classes canceled by the instructor count toward your rebookable class total and are valid for 180 days.",
};

export const CANCELED_BY_CUSTOMER_NOTICE = {
  ja: "前日まで（日本時間基準）にキャンセルされたクラスは、180日間振替可能です。当日キャンセルは振替できませんのでご了承ください。",
  en: "Cancellations made by the day before (Japan time) are rebookable within 180 days. For multiple cancellations, the period starts from the original booking. Same-day cancellations aren't rebookable.",
};

// Profile page
export const NO_CHANGES_MADE_MESSAGE = {
  ja: "変更された項目がありません。",
  en: "No changes were made.",
};

export const PROFILE_UPDATE_EMAIL_VERIFICATION_FAILED_MESSAGE = {
  ja: "新しいメールアドレスへ認証リンクを送信できなかったため、プロフィールを更新できませんでした。メールアドレスをご確認のうえ、再度お試しください。解決しない場合はスタッフまでご連絡ください。",
  en: "We couldn't update your profile because we were unable to send a verification link to your new email address. Please check your email address and try again. If the issue persists, contact us.",
};

export const PROFILE_UPDATED_VERIFICATION_EMAIL_SENT = {
  ja: "プロフィールの更新が完了しました。新しいメールアドレス宛に認証リンクを送信しましたので、メール内のボタンをクリックして認証を完了してください。",
  en: "Your profile has been updated. A verification link has been sent to your new email address. Please click the button in the email to complete the verification.",
};

export const PROFILE_ADD_SUCCESS_MESSAGE = {
  ja: "新しいお子さまのプロフィールを追加しました。",
  en: "A new child profile has been added.",
};

export const PROFILE_ADD_FAILED_MESSAGE = {
  ja: "新しいお子さまのプロフィールを追加できませんでした。時間をおいて、もう一度お試しください。解決しない場合はスタッフまでご連絡ください。",
  en: "We couldn't add a new child profile. Please wait a moment and try again. If the issue persists, contact us.",
};

export const PROFILE_UPDATE_SUCCESS_MESSAGE = {
  ja: "プロフィールの更新が完了しました。",
  en: "The profile has been updated.",
};

export const PROFILE_UPDATE_FAILED_MESSAGE = {
  ja: "プロフィールを更新できませんでした。時間をおいて、もう一度お試しください。解決しない場合はスタッフまでご連絡ください。",
  en: "We couldn't update the profile. Please wait a moment and try again. If the issue persists, contact us.",
};

// Rebooking modal
export const SELECT_AT_LEAST_ONE_CHILD_MESSAGE = {
  ja: "参加するお子さまを少なくとも1人選択してください。",
  en: "Please select at least one child to attend.",
};

export const CHILD_BOOKING_STATUS_ERROR_MESSAGE = {
  ja: "お子さまのクラス予約状況の確認ができませんでした。ページを再読み込みするか、しばらくしてからもう一度お試しください。",
  en: "We couldn't check your child's class booking status. Please reload the page or try again after some time.",
};

export const CONFIRM_BOOKING_WITH_CONFLICT_MESSAGE = {
  ja: "下記のお子さまは、すでに同じ時間に別のクラスを予約しています。このまま予約を続けてもよろしいですか？",
  en: "The following child(ren) already have another class. Would you like to continue booking?",
};

export const DOUBLE_BOOKING_CHECK_FAILURE = {
  ja: "予約の重複がないか確認できませんでした。ページを再読み込みするか、しばらくしてからもう一度お試しください。",
  en: "We were unable to check for double bookings. Please refresh the page or try again later.",
};

export const DOUBLE_BOOKING_CONFIRMATION_MESSAGE = {
  ja: "この時間にはすでに別のクラスが予約されていますが、予約を続けてもよろしいですか？",
  en: "Another class is already booked at this time. Would you like to continue with the booking?",
};

export const REBOOK_CLASS_RESULT_MESSAGES: Record<string, LocalizedMessage> = {
  success: {
    ja: "クラスの予約が完了しました！",
    en: "Your class has been successfully booked.",
  },
  "past rebooking deadline": {
    ja: "振替予約は、クラス開始の3時間前まで可能です。ご予約時点で締切を過ぎていたため、振替ができませんでした。お手数ですが、ページを更新し別のクラスをご検討ください。",
    en: "Rebooking is available until 3 hours before the class starts. The deadline has passed, so please refresh the page and choose another class.",
  },
  "no subscription": {
    ja: `ご契約情報が確認できなかったため、振替予約を完了できませんでした。ご不明な点がございましたら、${CONTACT_EMAIL} かLINE（${LINE_QR_CODE_URL}）でお気軽にお問い合わせください。`,
    en: `We couldn't complete the rebooking as your subscription couldn't be verified. If you have any questions, feel free to contact us at ${CONTACT_EMAIL} or LINE(${LINE_QR_CODE_URL}).`,
  },
  "outdated subscription": {
    ja: `ご契約期間が終了しているため、振替予約できません。ご不明な点がございましたら、${CONTACT_EMAIL} かLINE（${LINE_QR_CODE_URL}）でお気軽にお問い合わせください。`,
    en: `We cannot complete the rebooking because your subscription period has ended. If you have any questions, feel free to contact us at ${CONTACT_EMAIL} or LINE(${LINE_QR_CODE_URL}).`,
  },
  "instructor conflict": {
    ja: "申し訳ございませんが、選択された時間はインストラクターがすでに予約されています。お手数ですが、ページを更新して別の時間かインストラクターをお選びください。",
    en: "We're sorry, but the instructor is already booked at the selected time. Please refresh the page and choose a different time or instructor.",
  },
  "instructor unavailable": {
    ja: "選択された時間はインストラクターの予定変更により予約できません。お手数ですが、ページを更新して別の時間またはインストラクターをお選びください。",
    en: "The selected time is no longer available due to a change in the instructor's schedule. Please refresh the page and choose a different time or instructor.",
  },
  default: {
    ja: `クラスの振替予約中にエラーが発生しました。しばらく時間をおいてから、もう一度お試しください。解決しない場合は ${CONTACT_EMAIL} かLINE（${LINE_QR_CODE_URL}）でご連絡ください。`,
    en: `An error occurred while rebooking the class. Please wait a moment and try again. If the issue persists, feel free to contact us at ${CONTACT_EMAIL} or LINE(${LINE_QR_CODE_URL}).`,
  },
};

export const LOGIN_REQUIRED_MESSAGE = {
  ja: "続行するには、ログインしてください。",
  en: "Please log in to continue.",
};

// childrenProfiles
export const CANNOT_DELETE_LAST_CHILD_PROFILE_MESSAGE = {
  ja: "少なくとも1人のお子さまのプロフィールが必要なため、このプロフィールは削除できません。",
  en: "You must have at least one child profile, so this profile cannot be deleted.",
};

export const CONFIRM_DELETE_CHILD_PROFILE_MESSAGE = {
  ja: "本当にこのお子さまのプロフィールを削除してもよろしいですか？",
  en: "Are you sure you want to delete this child's profile?",
};

export const PROFILE_DELETE_SUCCESS_MESSAGE = {
  ja: "プロフィールの削除が完了しました。",
  en: "The profile has been deleted.",
};

export const PROFILE_DELETE_FAILED_MESSAGE = {
  ja: `プロフィールを削除できませんでした。時間をおいて、もう一度お試しください。解決しない場合は ${CONTACT_EMAIL} かLINE（${LINE_QR_CODE_URL}）で連絡ください。`,
  en: `We couldn't delete the profile. Please wait a moment and try again. If the issue persists, contact us at ${CONTACT_EMAIL} or LINE(${LINE_QR_CODE_URL}).`,
};

export const PROFILE_DELETE_BLOCKED_BY_PAST_CLASS_MESSAGE = {
  ja: "お子さまが過去に参加されたクラスがあるため、このプロフィールは削除できません。",
  en: "This profile cannot be deleted because your child has attended a past class.",
};

export const PROFILE_DELETE_BLOCKED_BY_BOOKED_CLASS_MESSAGE = {
  ja: "お子さまに予約済みのクラスがあるため、このプロフィールは削除できません。",
  en: "This profile cannot be deleted because your child has a booked class.",
};

// WelcomeModal
export const FREE_TRIAL_DECLINE_CONFIRMATION_MESSAGE = {
  ja: "本当に無料トライアルクラスをお受けにならなくても大丈夫ですか？ この操作は後から変更できません。",
  en: "Are you sure you don't want to take the free trial class? This action cannot be undone.",
};

export const FREE_TRIAL_REMOVE_SUCCESS_MESSAGE = {
  ja: "無料トライアルクラスをスキップしました。",
  en: "The free trial class has been skipped.",
};

export const FREE_TRIAL_ALREADY_REMOVED_MESSAGE = {
  ja: "無料トライアルクラスはすでにスキップ処理済みです。",
  en: "The free trial class has already been skipped.",
};

export const FREE_TRIAL_REMOVE_ERROR_MESSAGE = {
  ja: `無料トライアルクラスの削除に失敗しました。もう一度お試しください。解決しない場合は、${CONTACT_EMAIL} かLINE (${LINE_QR_CODE_URL}）でお問い合わせください。`,
  en: `Failed to remove the free trial class. Please try again. If the problem persists, contact us at ${CONTACT_EMAIL} or LINE(${LINE_QR_CODE_URL}).`,
};

export const WELCOME_MODAL_TITLE1 = {
  ja: "オンラインこども英会話 AaasoBo! へようこそ！",
  en: "Welcome to AaasoBo! – Online English Classes for Kids",
};

export const FREE_TRIAL_BOOKING_INSTRUCTION_MESSAGE = {
  ja: "無料トライアルは、画面右上の「クラスを予約」からご予約ください。",
  en: "To book your free trial class, click the 'Book Class' button at the top right of the page.",
};

export const CHILD_PROFILE_UPDATE_INSTRUCTION_MESSAGE = {
  ja: "お子さまを追加する場合は、左メニューの「お子さまプロフィール」から変更できます。",
  en: "To add a child, go to 'Children Profiles' in the left-hand menu.",
};

export const MEMBERSHIP_INSTRUCTION_MESSAGE = {
  ja: {
    beforeLine: "レギュラークラスをご希望の方は、LINE(",
    lineText: "こちら",
    middle: ")またはメール(",
    afterEmail: ") にてご連絡ください。",
  },
  en: {
    beforeLine:
      "If you would like to take regular classes, please contact us via LINE (",
    lineText: "here",
    middle: ") or email (",
    afterEmail: ").",
  },
};

// Regular Classes Page Messages
export const ADD_NEW_SUBSCRIPTION = {
  ja: "新しいサブスクリプションを追加",
  en: "Add New Subscription",
};

export const PLAN_LABEL = {
  ja: "プラン",
  en: "Plan",
};

export const PRESENT_LABEL = {
  ja: "現在",
  en: "Present",
};

export const NO_SUBSCRIPTION_MESSAGE = {
  ja: "まだサブスクリプションがありません。SelectTypeでお支払いを済ませ、スタッフにお知らせください。",
  en: "You don't have any subscription yet. Please make a payment on SelectType and let the staff know.",
};

export const PREVIOUS_REGULAR_CLASSES = {
  ja: "過去のレギュラークラス",
  en: "Previous Regular Classes",
};

export const LOADING_TEXT = {
  ja: "読み込み中...",
  en: "Loading...",
};

export const NO_REGULAR_CLASSES_MESSAGE = {
  ja: "このサブスクリプションのレギュラークラスが見つかりません。",
  en: "No regular classes found for this subscription.",
};

export const CHILDREN_LABEL = {
  ja: "お子さま",
  en: "Children",
};

export const CLASS_URL_LABEL = {
  ja: "クラスURL",
  en: "Class URL",
};

export const STARTED_LABEL = {
  ja: "開始日",
  en: "Started",
};

export const ENDED_LABEL = {
  ja: "終了日",
  en: "Ended",
};

export const NO_CHILDREN_ASSIGNED = {
  ja: "お子さまが割り当てられていません",
  en: "No children assigned",
};

export const NO_URL_PROVIDED = {
  ja: "URLが提供されていません",
  en: "No URL provided",
};

export const NO_DATE_SELECTED = {
  ja: "日付が選択されていません",
  en: "No date selected",
};

export const EDIT_CLASS_ARIA_LABEL = {
  ja: "クラスを編集",
  en: "Edit class",
};
