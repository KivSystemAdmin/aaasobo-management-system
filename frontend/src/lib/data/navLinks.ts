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
  userId: number | null,
  userType: "admin" | "customer" | "instructor",
  language?: LanguageType,
): LinkType[] {
  const customerLinks: LinkType[] = [
    {
      name: language === "ja" ? "クラスカレンダー" : "Class Calendar",
      href: `/customers/${userId}/classes`,
      icon: CalendarDaysIcon,
    },
    {
      name: language === "ja" ? "プロフィール" : "Customer Profile",
      href: `/customers/${userId}/profile`,
      icon: UserIcon,
    },
    {
      name: language === "ja" ? "お子さまプロフィール" : "Children's Profiles",
      href: `/customers/${userId}/children-profiles`,
      icon: UsersIcon,
    },
    {
      name:
        language === "ja"
          ? "インストラクター　　　プロフィール" // Full-width characters are needed for alignment
          : "Instructor Profiles",
      href: `/customers/${userId}/instructor-profiles`,
      icon: UsersIcon,
    },

    {
      name: language === "ja" ? "レギュラークラス" : "Regular Classes",
      href: `/customers/${userId}/regular-classes`,
      icon: ClipboardDocumentListIcon,
    },
    {
      name: language === "ja" ? "アーソボカレンダー" : "AaasoBo! Calendar",
      href: `/customers/${userId}/business-calendar`,
      icon: CalendarDaysIcon,
    },
  ];

  const adminLinks: LinkType[] = [
    {
      name: "Dashboard",
      href: `/admins/${userId}/dashboard`,
      icon: HomeModernIcon,
    },
    {
      name: "Class List",
      href: `/admins/${userId}/class-list`,
      icon: ClipboardDocumentListIcon,
    },
    {
      name: "Class Calendar",
      href: `/admins/${userId}/calendar`,
      icon: CalendarDaysIcon,
    },
    {
      name: "Customer List",
      href: `/admins/${userId}/customer-list`,
      icon: UsersIcon,
    },
    {
      name: "Instructor List",
      href: `/admins/${userId}/instructor-list`,
      icon: UsersIcon,
    },
    {
      name: "Plan List",
      href: `/admins/${userId}/plan-list`,
      icon: AcademicCapIcon,
    },
    {
      name: "Event List",
      href: `/admins/${userId}/event-list`,
      icon: BellIcon,
    },
    {
      name: "Admin List",
      href: `/admins/${userId}/admin-list`,
      icon: UserIcon,
    },
    {
      name: "Instructor Profiles",
      href: `/admins/${userId}/instructor-profiles`,
      icon: UsersIcon,
    },
    {
      name: "AaasoBo! Calendar",
      href: `/admins/${userId}/business-calendar`,
      icon: CalendarDaysIcon,
    },
    {
      name: "Data Import",
      href: `/admins/${userId}/data-import`,
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
      name: "Class Schedule",
      href: `/instructors/${userId}/class-schedule`,
      icon: CalendarIcon,
    },
    {
      name: "Profile",
      href: `/instructors/${userId}/profile`,
      icon: UserIcon,
    },
    {
      name: "Availability Schedule",
      href: `/instructors/${userId}/availability`,
      icon: ClockIcon,
    },
    {
      name: "AaasoBo! Calendar",
      href: `/instructors/${userId}/business-calendar`,
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
