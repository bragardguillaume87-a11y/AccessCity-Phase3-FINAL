import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ErrorBoundary } from "./components/utilities/ErrorBoundary.jsx";
import "./styles/tokens.css"; // Design System v2 tokens (WCAG AA) - Load first
import "./styles/theme.css";  // Legacy theme (coexists with v2)
import "./styles/home.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
