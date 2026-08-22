import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.scss";
import { ToastContainer } from "react-toastify";
import { LanguageProvider } from "../contexts/LanguageContext";
import { getSystemStatus } from "@/lib/api/maintenanceApi";
import SystemStatusWatcher from "@/components/features/systemStatusWatcher/SystemStatusWatcher";
import MaintenancePage from "@/components/elements/maintenancePage/MaintenancePage";
import { CustomerTimeZoneProvider } from "@/contexts/CustomerTimeZoneContext";

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: [
    "100", // Thin
    "200", // Extra Light
    "300", // Light
    "400", // Regular
    "500", // Medium
    "600", // Semi Bold
    "700", // Bold
    "800", // Extra Bold
    "900", // Black
  ],
});

export const metadata: Metadata = {
  title: "AaasoBo! Class Management App",
  description: "AaasoBo! Class Management App",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const systemStatus = await getSystemStatus();
  const isStop = systemStatus === "Stop";

  // If the system is running, show the normal layout
  return (
    <html lang="en">
      <body className={poppins.className}>
        <LanguageProvider>
          <CustomerTimeZoneProvider>
            <ToastContainer />
            <SystemStatusWatcher />
            {isStop ? <MaintenancePage /> : children}
          </CustomerTimeZoneProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
