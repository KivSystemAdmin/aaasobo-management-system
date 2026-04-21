import styles from "./SideNav.module.scss";
import Image from "next/image";
import NavLinks from "./NavLinks";
import LogOut from "./LogOut";
import UserName from "./UserName";
import { getAdminById } from "@/lib/api/adminsApi";
import { getCustomerById } from "@/lib/api/customersApi";
import { getInstructorProfile } from "@/lib/api/instructorsApi";
import LanguageSwitcher from "../../elements/languageSwitcher/LanguageSwitcher";
import { getCookie } from "../../../proxy";

export default async function SideNav({
  userId,
  userType,
}: {
  userId: number;
  userType: UserType;
}) {
  // Get the cookies from the request headers
  const cookie = await getCookie();

  let userName = "Unauthenticated User";
  switch (userType) {
    case "admin":
      const response = await getAdminById(userId, cookie);
      if ("admin" in response) {
        userName = response.admin.name;
      } else {
        console.error("Failed to fetch admin:", response.message);
      }
      break;
    case "customer":
      const customer = await getCustomerById(userId, cookie);
      userName = customer.name;
      break;
    case "instructor":
      const instructor = await getInstructorProfile(userId, cookie);
      userName = instructor.nickname;
      break;
  }

  return (
    <div className={styles.sideNavContainer}>
      <div className={styles.innerContainer}>
        <div className={styles.sideNavLogo}>
          <Image
            className={styles.sideNavLogo__img}
            src="/images/logo2.svg"
            alt="Aaasobo logo"
            width={183}
            height={51}
          />
        </div>
        <UserName userType={userType} userName={userName} />
        <NavLinks userType={userType} />
        {userType === "customer" && <LanguageSwitcher />}
        <LogOut userType={userType} />
      </div>
    </div>
  );
}
