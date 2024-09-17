import { useAuth } from "@/app/hooks/useAuth";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:4000";

export const AdminAuthentication = () => {
  const endpoint = `${BACKEND_ORIGIN}/admins/authentication`;
  const redirectPath = "/admins/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

  return { isAuthenticated, isLoading };
};

export const CustomerAuthentication = (id: string) => {
  const endpoint = `${BACKEND_ORIGIN}/customers/${id}/authentication`;
  const redirectPath = "/customers/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

  return { isAuthenticated, isLoading };
};

export const InstructorAuthentication = (id: string) => {
  const endpoint = `${BACKEND_ORIGIN}/instructors/${id}/authentication`;
  const redirectPath = "/instructors/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

  return { isAuthenticated, isLoading };
};
