import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/utilities/ErrorBoundary";
import { initSentry } from "./lib/sentry";
import "./styles/tokens.css"; // Design System v2 tokens (WCAG AA) - Load first
import "./styles/theme.css";  // Legacy theme (coexists with v2)
import "./styles/home.css";
import "./index.css";

// Initialize Sentry error tracking (only if DSN is configured)
initSentry();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
