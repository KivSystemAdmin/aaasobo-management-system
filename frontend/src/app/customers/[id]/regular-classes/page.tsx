"use client";

import RegularClasses from "@/app/components/customers-dashboard/regular-classes/RegularClasses";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      toast.success(message);
    }

    // clean up the URL
    const urlWithoutMessage = window.location.pathname;
    window.history.replaceState({}, document.title, urlWithoutMessage);
  }, [searchParams]);

  return (
    <div>
      <ToastContainer autoClose={3000} />
      <RegularClasses customerId={customerId} />
    </div>
  );
}

export default Page;
