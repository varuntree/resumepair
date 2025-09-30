"use client";

import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import NextTopLoader from "nextjs-toploader";
import config from "@/config";
import { ThemeProvider } from "@/components/ThemeProvider";

interface LayoutClientProps {
  children: ReactNode;
}

// This component wraps the app with client-side providers and components
// It includes toast notifications, loading bar, theme provider, and other client features
const ClientLayout = ({ children }: LayoutClientProps) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* Loading bar for page transitions */}
      <NextTopLoader
        color={config.colors.main}
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={true}
        easing="ease"
        speed={200}
        shadow="0 0 10px #2299DD,0 0 5px #2299DD"
      />

      {/* Toast notifications */}
      <Toaster
        toastOptions={{
          duration: 3000,
        }}
      />

      {/* Main app content */}
      {children}
    </ThemeProvider>
  );
};

export default ClientLayout;