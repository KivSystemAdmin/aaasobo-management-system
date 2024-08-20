import { useAuth } from "@/app/hooks/useAuth";

export const AdminAuthentication = () => {
  const endpoint = "http://localhost:4000/admins/authentication";
  const redirectPath = "/admins/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

  return { isAuthenticated, isLoading };
};

export const CustomerAuthentication = (id: string) => {
  const endpoint = `http://localhost:4000/customers/${id}/authentication`;
  const redirectPath = "/customers/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

  return { isAuthenticated, isLoading };
};

export const InstructorAuthentication = (id: string) => {
  const endpoint = `http://localhost:4000/instructors/${id}/authentication`;
  const redirectPath = "/instructors/login";
  const { isAuthenticated, isLoading } = useAuth(endpoint, redirectPath);

  return { isAuthenticated, isLoading };
};
