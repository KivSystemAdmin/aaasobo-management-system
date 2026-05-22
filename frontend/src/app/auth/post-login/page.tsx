import { redirect } from "next/navigation";
import { auth } from "../../../../auth.config";

export default async function PostLoginPage() {
  const session = await auth();
  const userType = session?.user?.userType;

  if (!userType) {
    redirect("/");
  }

  switch (userType) {
    case "admin":
      redirect("/admins/dashboard");
    case "customer":
      redirect("/customers/classes");
    case "instructor":
      redirect("/instructors/class-schedule");
    default:
      redirect("/");
  }
}
