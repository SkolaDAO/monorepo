import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Providers } from "./lib/providers";
import App from "./App";
import "./index.css";
import { initCapacitor } from "./lib/capacitor";

// Initialize Capacitor native plugins
initCapacitor();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Providers>
  </StrictMode>
);
