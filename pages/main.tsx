import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StudyApp } from "@/components/study-app";
import "@/styles.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <StudyApp />
    </StrictMode>,
  );
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
