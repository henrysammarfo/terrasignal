import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force fresh build

createRoot(document.getElementById("root")!).render(<App />);
