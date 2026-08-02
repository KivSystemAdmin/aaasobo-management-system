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
      name: language === "ja" ? "ダッシュボード" : "Dashboard",
      href: "/admins/dashboard",
      icon: HomeModernIcon,
    },
    {
      name: language === "ja" ? "クラスカレンダー" : "Class Calendar",
      href: "/admins/calendar",
      icon: CalendarDaysIcon,
    },
    {
      name: language === "ja" ? "クラスリスト" : "Class List",
      href: "/admins/class-list",
      icon: ClipboardDocumentListIcon,
    },
    {
      name: language === "ja" ? "カスタマーリスト" : "Customer List",
      href: "/admins/customer-list",
      icon: UsersIcon,
    },
    {
      name:
        language === "ja" ? "インストラクター　　リスト" : "Instructor List",
      href: "/admins/instructor-list",
      icon: UsersIcon,
    },
    {
      name: language === "ja" ? "プランリスト" : "Plan List",
      href: "/admins/plan-list",
      icon: AcademicCapIcon,
    },
    {
      name: language === "ja" ? "イベントリスト" : "Event List",
      href: "/admins/event-list",
      icon: BellIcon,
    },
    {
      name: language === "ja" ? "アドミンリスト" : "Admin List",
      href: "/admins/admin-list",
      icon: UserIcon,
    },
    {
      name:
        language === "ja"
          ? "インストラクター　　　プロフィール"
          : "Instructor Profiles",
      href: "/admins/instructor-profiles",
      icon: UsersIcon,
    },
    {
      name: language === "ja" ? "アーソボカレンダー" : "AaasoBo! Calendar",
      href: "/admins/business-calendar",
      icon: CalendarDaysIcon,
    },
    {
      name: language === "ja" ? "データインポート" : "Data Import",
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
