import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function useAuth(endpoint: string) {
  const messageShownRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const authenticateSession = async () => {
      const response = await fetch(endpoint, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      const { message, redirectUrl } = data;

      if (response.status === 401 && !messageShownRef.current) {
        alert(message); // Set alert message temporarily.
        messageShownRef.current = true;
        router.push(redirectUrl);
      }
    };

    authenticateSession();
  }, [endpoint, router]);
}
