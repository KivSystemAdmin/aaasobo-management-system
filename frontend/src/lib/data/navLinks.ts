import {
  UsersIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  HomeModernIcon,
  UserIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  BellIcon,
  ArrowUpOnSquareIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

export function getLinks(
  userType: "admin" | "customer" | "instructor",
  language?: LanguageType,
): LinkType[] {
  const customerLinks: LinkType[] = [
    {
      name: language === "ja" ? "クラスカレンダー" : "Class Calendar",
      href: "/customers/classes",
      icon: CalendarDaysIcon,
    },
    {
      name: language === "ja" ? "プロフィール" : "Customer Profile",
      href: "/customers/profile",
      icon: UserIcon,
    },
    {
      name: language === "ja" ? "お子さまプロフィール" : "Children's Profiles",
      href: "/customers/children-profiles",
      icon: UsersIcon,
    },
    {
      name:
        language === "ja"
          ? "インストラクター　　　プロフィール" // Full-width characters are needed for alignment
          : "Instructor Profiles",
      href: "/customers/instructor-profiles",
      icon: UsersIcon,
    },

    {
      name: language === "ja" ? "レギュラークラス" : "Regular Classes",
      href: "/customers/regular-classes",
      icon: ClipboardDocumentListIcon,
    },
    {
      name: language === "ja" ? "アーソボカレンダー" : "AaasoBo! Calendar",
      href: "/customers/business-calendar",
      icon: CalendarDaysIcon,
    },
  ];

  const adminLinks: LinkType[] = [
    {
      name: "ダッシュボード",
      href: "/admins/dashboard",
      icon: HomeModernIcon,
    },
    {
      name: "クラスカレンダー",
      href: "/admins/calendar",
      icon: CalendarDaysIcon,
    },
    {
      name: "クラスリスト",
      href: "/admins/class-list",
      icon: ClipboardDocumentListIcon,
    },
    {
      name: "お客さまリスト",
      href: "/admins/customer-list",
      icon: UsersIcon,
    },
    {
      name: "インストラクター\nリスト",
      href: "/admins/instructor-list",
      icon: UsersIcon,
    },
    {
      name: "管理者リスト",
      href: "/admins/admin-list",
      icon: UserIcon,
    },
    {
      name: "インストラクター　　　プロフィール",
      href: "/admins/instructor-profiles",
      icon: UsersIcon,
    },
    {
      name: "アーソボカレンダー",
      href: "/admins/business-calendar",
      icon: CalendarDaysIcon,
    },
    {
      name: "プランリスト",
      href: "/admins/plan-list",
      icon: AcademicCapIcon,
    },
    {
      name: "イベントリスト",
      href: "/admins/event-list",
      icon: BellIcon,
    },
    {
      name: "データインポート",
      href: "/admins/data-import",
      icon: ArrowUpOnSquareIcon,
    },
    // Not in use for now
    // {
    //   name: "Child List",
    //   href: `/admins/${userId}/child-list`,
    //   icon: UserGroupIcon,
    // },
    // {
    //   name: "Subscription List",
    //   href: `/admins/${userId}/subscription-list`,
    //   icon: ClipboardDocumentCheckIcon,
    // },
  ];

  const instructorLinks: LinkType[] = [
    {
      name: "Calendar",
      href: "/instructors/class-schedule",
      icon: CalendarIcon,
    },
    {
      name: "Profile",
      href: "/instructors/profile",
      icon: UserIcon,
    },
    {
      name: "Schedule",
      href: "/instructors/availability",
      icon: ClockIcon,
    },
    {
      name: "Payroll",
      href: "/instructors/payroll",
      icon: BanknotesIcon,
    },
    {
      name: "AaasoBo! Calendar",
      href: "/instructors/business-calendar",
      icon: CalendarDaysIcon,
    },
  ];

  switch (userType) {
    case "admin":
      return [...adminLinks];
    case "instructor":
      return [...instructorLinks];
    default:
      return [...customerLinks];
  }
}
