import "./App.css";
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { AuthProvider } from "@/lib/AuthContext";
import { I18nProvider } from "@/lib/i18n";
import { CmlRoutes } from "@/features/cml-core/CmlRoutes";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <CmlRoutes />
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;
