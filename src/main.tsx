import { createRoot } from "react-dom/client";
import App from "./App.tsx";

// Design System - Must be imported first for CSS variable availability
import "./design-system/globals.css";
// Tailwind utilities
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
