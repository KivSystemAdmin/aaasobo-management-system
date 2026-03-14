type Events = {
  id: string;
  start: string;
  end: string;
};

type Instructors = {
  data: Instructor[];
};

// Use shared types instead of local definitions
type Instructor = import("@shared/schemas/instructors").CompleteInstructor;
type InstructorProfile =
  import("@shared/schemas/instructors").DetailedInstructorProfile;

// For rebooking profiles, use the basic InstructorProfile from shared schemas
type InstructorRebookingProfile =
  import("@shared/schemas/instructors").InstructorProfile;

type ClassStatus =
  | "booked"
  | "rebooked"
  | "completed"
  | "canceledByCustomer"
  | "canceledByInstructor"
  | "pending"
  | "rebooked"
  | "freeTrial";

type ClassType = {
  id: number;
  dateTime: string;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  instructor: {
    id: number;
    name: string;
    icon: File;
    classURL: string;
    nickname: string;
    meetingId: string;
    passcode: string;
  };
  classAttendance: { children: { id: number; name: string }[] };

  status: ClassStatus;
  recurringClassId: number;
  rebookableUntil: string;
  updatedAt: string;
  classCode: string;
};

// Use shared types instead of local definitions
type Admin = import("@shared/schemas/admins").AdminProfile;

type Customer = {
  id: number;
  name: string;
  email: string;
  class?: CustomersClass[];
  prefecture: string;
};

type CustomerClass = {
  classId: number;
  start: string;
  end: string;
  title: string;
  color: string;
  instructorIcon: string;
  instructorNickname: string;
  instructorName: string;
  instructorClassURL: string;
  instructorMeetingId: string;
  instructorPasscode: string;
  classStatus: ClassStatus;
  rebookableUntil: string;
  classCode: string;
  updatedAt: string;
  isFreeTrial: boolean;
};

type Child = {
  id: number;
  customerId?: number;
  name: string;
  birthdate?: string;
  personalInfo?: string;
};

type Plans = Plan[];

type Plan = {
  id: number;
  name: string;
  planNameJpn?: string;
  planNameEng?: string;
  description: string;
  weeklyClassTimes?: number;
  terminationAt?: string | null;
  isNative: boolean;
};

type BusinessEventType = {
  id: number;
  name: string;
  eventNameJpn?: string;
  eventNameEng?: string;
  color?: string;
};

type Subscriptions = {
  subscriptions: Subscription[];
};

type Subscription = {
  id: number;
  planId: number;
  customerId: number;
  customerTerminationAt?: string | null;
  startAt: string;
  endAt: string | null;
  plan: Plan;
  selectType: string;
};

type RegisterSubscription = {
  planId: number;
  startAt: string;
};

type RecurringClasses = {
  recurringClasses: RecurringClass[];
};

type RecurringClass = {
  id: number;
  dateTime: string;
  instructorId: number;
  instructor: Instructor;
  childrenIds: Set<number>;
  subscription: Subscription | null;
  recurringClassAttendance: Attendance[];
  endAt: Date;
  classes?: Array<{
    dateTime: string | null;
  }>;
  startAt?: string | null;
  subscriptionId?: number | null;
};

type Attendance = {
  children: Child;
};

type EventType = {
  classId?: number;
  start: string;
  end: string;
  title: string;
  color: string;
};

type ClassForCalendar = {
  id: number;
  dateTime: string;
  instructor: Instructor;
  classAttendance: {
    children: Child[];
  };
  status: ClassStatus;
};

type RecurringClassState = {
  id: number;
  day: Day;
  time: string;
  instructorId: number;
  childrenIds: Set<number>;
};

type InstructorClassDetail = {
  id: number;
  dateTime: string;
  customerName: string;
  instructorName: string;
  classURL: string;
  meetingId: string;
  passcode: string;
  attendingChildren: Child[];
  customerChildren: Child[];
  status: ClassStatus;
  isFreeTrial: boolean;
  classCode: string;
  updatedAt: string;
};

type Tab = {
  label: string;
  content: React.ReactNode;
};

type RecurringAvailability = {
  id: number;
  startAt: Date;
  endAt: Date | null;
};

type LinkType = {
  name: string;
  href: string;
  icon: FC<SVGProps<SVGSVGElement>>;
};

// UserType imported directly from shared schemas
type UserType = import("@shared/schemas/common").UserType;

type CategoryType = "event" | "plan" | "schedule" | "subscription";

type ForgotPasswordFormState = {
  errorMessage?: string;
  successMessage?: string;
};

type RegisterFormState = {
  password?: string;
  name?: string;
  isNative?: string;
  email?: string;
  passConfirmation?: string;
  prefecture?: string;
  isAgreed?: string;
  weeklyClassTimes?: string;
  description?: string;
  eventNameEng?: string;
  eventNameJpn?: string;
  color?: string;
  planNameEng?: string;
  planNameJpn?: string;
  errorMessage?: string;
  successMessage?: string;
  language?: LanguageType;
};

type UpdateFormState = {
  name?: string;
  isNative?: string;
  nickname?: string;
  email?: string;
  classURL?: string;
  meetingId?: string;
  passcode?: string;
  color?: string;
  eventId?: string;
  description?: string;
  errorMessage?: string;
  successMessage?: string;
  skipProcessing?: string;
  admin?: Admin | null;
  instructor?: InstructorProfile | null;
  event?: BusinessEventType | null;
  eventNameJpn?: string;
  eventNameEng?: string;
  plan?: Plan | null;
  planNameJpn?: string;
  planNameEng?: string;
  items?: Item[];
  result?: string | boolean;
};

type DeleteFormState = {
  errorMessage?: string;
  successMessage?: string;
  id?: number | null;
  message?: string;
};

type UpcomingClass = {
  id: number;
  dateTime: string;
  instructor: {
    nickname: string;
    icon: string;
  };
  attendingChildren: string[];
};

type CancelClassesModalControllerProps = {
  upcomingClasses: UpcomingClass[] | [];
  customerId: number;
  userSessionType: UserType;
  terminationAt: string | null;
};

type CancelClassesModalProps = {
  upcomingClasses: UpcomingClass[] | [];
  customerId: number;
  userSessionType?: UserType;
  isCancelingModalOpen: boolean;
  setIsCancelingModalOpen: Dispatch<SetStateAction<boolean>>;
};

type SelectedClass = {
  classId: number;
  classDateTime: string;
};

type UpcomingClassesProps = {
  upcomingClasses: UpcomingClass[] | [];
  selectedClasses: SelectedClass[] | [];
  setSelectedClasses: Dispatch<SetStateAction<SelectedClass>>;
  isCancelingModalOpen: boolean;
};

type CustomerProfile = {
  id: number;
  name: string;
  email: string;
  prefecture: string;
  hasSeenWelcome: boolean;
  createdAt: string;
  terminationAt: string | null;
};

type LanguageType = "ja" | "en";

type ClassInfo = { classId: number; classDateTime: string };
type ClassInfoList = ClassInfo[];
type SetClassInfoList = React.Dispatch<React.SetStateAction<ClassInfoList>>;

type BusinessSchedule = {
  id: number;
  date: string;
  event: string;
  color: string;
};

type BusinessCalendarClientProps = {
  businessSchedule?: BusinessSchedule[] | [];
  events?: BusinessEventType[] | [];
  validRange: {
    start: string;
    end: string;
  };
  userSessionType?: UserType;
};

type CustomerCalendarProps = {
  customerId: number;
  classes: CustomerClass[] | [];
  createdAt: string;
  businessSchedule: BusinessSchedule[];
  colorsForEvents: { event: string; color: string }[];
  userSessionType?: UserType;
};

type InstructorCalendarClientProps = {
  adminId?: number | null;
  instructorId: number | null;
  userSessionType?: UserType;
  instructorCalendarEvents: EventType[];
  validRange: {
    start: string;
    end: string;
  };
  businessSchedule: BusinessSchedule[];
  colorsForEvents: { event: string; color: string }[];
};

type RebookableClass = {
  id: number;
  rebookableUntil: Date;
  classCode: string;
  isFreeTrial: boolean;
  subscription: Subscription;
};

type RebookingModalControllerProps = {
  rebookableClasses: RebookableClass[] | [];
  hasChildProfile: boolean;
  userSessionType?: UserType;
  terminationAt: string | null;
  modalContent: React.ReactNode;
};

type RebookingModalProps = {
  adminId?: number;
  userSessionType?: UserType;
  customerId: number;
  rebookableClasses: RebookableClass[] | [];
};

type RebookableClassListProps = RebookingModalProps & {
  onRebookableClassSelect: (classId: number) => void;
  language: LanguageType;
  childProfiles: Child[];
};

type LocalizedMessage = {
  ja: string;
  en: string;
};

type TokenVerificationResult = {
  valid: boolean;
  needsResetLink: boolean;
  message: LocalizedMessage;
};

type ResetPasswordFormProps = {
  token: string;
  userType: UserType;
  tokenVerificationResult: TokenVerificationResult;
};

type ClassDetailProps = {
  customerId: number;
  classDetail: CustomerClass | null;
  handleModalClose: () => void;
  language: LanguageType;
  userSessionType?: UserType;
};

type StringMessages = Record<string, string>;
type LocalizedMessages = Record<string, LocalizedMessage>;

type FormResult = StringMessages | LocalizedMessages;

type RegisteringCustomer = {
  name: string;
  email: string;
  password: string;
  prefecture: string;
  isAgreed: boolean;
};

type RegisterCustomerProps = {
  customerData: RegisteringCustomer;
  setCustomerData: React.Dispatch<React.SetStateAction<RegisteringCustomer>>;
  onNextStep: () => void;
  language: LanguageType;
};

type RegisteringChild = {
  name: string;
  birthdate: string;
  personalInfo: string;
};

type RegisterChildProps = {
  customerData: RegisteringCustomer;
  childData: RegisteringChild;
  setChildData: React.Dispatch<React.SetStateAction<RegisteringChild>>;
  onPreviousStep: () => void;
  onNextStep: () => void;
  language: LanguageType;
};

type BirthdateInputProps = {
  onValidDateChange: (isoDate?: string | null) => void;
  defaultBirthdate?: string;
  error?: string;
  language?: LanguageType;
  useFormAction?: boolean;
};

type TextAreaInputProps = {
  id?: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  language?: LanguageType;
  name?: string;
  className?: string;
};

// Types related to RebookingForm
type RebookingSteps =
  | "selectClass"
  | "selectOption"
  | "selectInstructor"
  | "selectDateTime"
  | "confirmRebooking"
  | "complete";

type RebookingFormProps = {
  customerId: number;
  classId?: number;
  rebookableClasses: RebookableClass[] | [];
  instructorAvailabilities?: InstructorAvailability[] | [];
  instructorProfiles: InstructorRebookingProfile[];
  childProfiles: Child[];
  userSessionType?: UserType;
};

type RebookableClassesListProps = {
  customerId: number;
  rebookableClasses: RebookableClass[] | [];
  onRebookableClassSelect: (classId: number) => void;
  language: LanguageType;
  userSessionType?: UserType;
  childProfiles: Child[];
};

type RebookableOptionsProps = {
  selectOption: (option: "instructor" | "dateTime") => void;
  setRebookingStep: Dispatch<SetStateAction<RebookingSteps>>;
  language: LanguageType;
};

type RebookableInstructorsListProps = {
  instructorProfiles: InstructorRebookingProfile[];
  instructorAvailabilities: InstructorAvailability[] | [];
  setInstructorToRebook: (instructor: InstructorRebookingProfile) => void;
  rebookingOption: "instructor" | "dateTime";
  setRebookingStep: (step: RebookingSteps) => void;
  dateTimeToRebook: string | null;
  language: LanguageType;
};

type RebookableTimeSlotsProps = {
  setDateTimeToRebook: (dateTime: string) => void;
  setRebookingStep: (step: RebookingSteps) => void;
  instructorToRebook: InstructorRebookingProfile;
  instructorAvailabilities: InstructorAvailability[] | [];
  rebookingOption: "instructor" | "dateTime";
  language: LanguageType;
};

type ConfirmRebookingProps = {
  instructorToRebook: InstructorRebookingProfile;
  dateTimeToRebook: string;
  rebookingOption: "instructor" | "dateTime";
  setRebookingStep: (step: RebookingSteps) => void;
  childProfiles: Child[];
  customerId: number;
  classId: number;
  rebookableClasses: RebookableClass[] | [];
  setRebookableClassesNumber: Dispatch<SetStateAction<number>>;
  userSessionType?: UserType;
  language: LanguageType;
};

type RebookingCompleteMessageProps = {
  rebookableClassesNumber: number;
  setRebookingStep: (step: RebookingSteps) => void;
  language: LanguageType;
};

type ChildConflictResponse =
  | { conflictingChildren: string[] }
  | { message: LocalizedMessage };

type ChildrenProfilesProps = {
  customerId: number;
  childProfiles: Child[];
  userSessionType?: UserType;
  terminationAt: string | null;
};

type AddChildFormProps = {
  language: LanguageType;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  customerId: number;
  localMessages: LocalizedMessages;
  userSessionType?: UserType;
  isError: boolean;
  clearErrorMessage: (field: keyof LocalizedMessages | "all") => void;
};

type WelcomeModalProps = {
  customerId: number;
  language: LanguageType;
  setIsWelcomeModalOpen: Dispatch<SetStateAction<boolean>>;
  userSessionType: UserType;
};

type EventColor = {
  No: number;
  ID: number;
  Event: string;
  "Color Code": string;
};

type ClassDetailsProps = {
  instructorId: number;
  classId: number;
  classDetails: InstructorClassDetail;
  classes: InstructorClassDetail[] | [];
  adminId?: number | null;
  userSessionType?: UserType;
  previousPage:
    | "instructor-calendar"
    | "class-calendar"
    | "class-list"
    | "instructor-list";
};

type ClassItemProps = {
  instructorId: number;
  classItem: InstructorClassDetail;
  classId: number;
  isUpdatingData: boolean;
  setIsUpdatingData: Dispatch<SetStateAction<boolean>>;
};

type ClassItemForAdminProps = {
  adminId: number;
  instructorId: number;
  classItem: InstructorClassDetail;
  classId: number;
  isUpdatingData: boolean;
  setIsUpdatingData: Dispatch<SetStateAction<boolean>>;
  previousPage:
    | "instructor-calendar"
    | "class-calendar"
    | "class-list"
    | "instructor-list";
};

type HandleAttendanceUpdateParams = {
  classId: number;
  instructorId: number;
  adminId?: number;
  classEndTime: Date;
  initialAttendedChildrenIds: number[];
  attendedChildrenIdsToUpdate: number[];
  setIsUpdatingData: (updating: boolean) => void;
  setIsEditingAttendance: (editing: boolean) => void;
};

type HandleClassStatusUpdateParams = {
  classId: number;
  selectedStatus: ClassStatus | null;
  classEndTime: Date;
  instructorId: number;
  adminId?: number;
  setIsUpdatingData: (updating: boolean) => void;
  setIsEditingStatus?: (editing: boolean) => void;
};

type CurrentListTableProps = {
  listType: string;
  fetchedData: any[];
  fetchedPastData?: any[];
  omitItems: string[];
  linkItems: string[];
  linkUrls: string[];
  replaceItems: string[];
  userType: UserType;
  categoryType?: CategoryType;
  isAddButton?: boolean;
  isViewPastButton?: boolean;
  linkTarget?: string;
};

type PastListTableProps = {
  listType: string;
  omitItems: string[];
  linkItems: string[];
  linkUrls: string[];
  replaceItems: string[];
  userType: UserType;
  categoryType?: CategoryType;
  linkTarget?: string;
  width?: string;
} | null;

type ListTableProps = CurrentListTableProps & {
  pastListTableProps?: PastListTableProps;
};
