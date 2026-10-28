import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app";
import { AuthProvider } from "./auth-provider";
import { routerBasename } from "./runtime-paths";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/auth.css";
import "./styles/activities.css";
import "leaflet/dist/leaflet.css";
import "./styles/analysis.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename()}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
