import { redirect } from "next/navigation";
import { auth } from "../../../../auth.config";

export default async function PostLoginPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userType = session?.user?.userType;

  if (!userId || !userType) {
    redirect("/");
  }

  switch (userType) {
    case "admin":
      redirect(`/admins/${userId}/dashboard`);
    case "customer":
      redirect(`/customers/${userId}/classes`);
    case "instructor":
      redirect(`/instructors/${userId}/class-schedule`);
    default:
      redirect("/");
  }
}
