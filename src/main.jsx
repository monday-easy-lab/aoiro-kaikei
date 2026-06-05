import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Global styles (keyframes can't be defined inline)
const style = document.createElement("style");
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    -webkit-font-smoothing: antialiased;
  }
  .ledger-table { display: block; }
  .ledger-cards { display: none; }
  .top-nav { display: flex; }
  .bottom-nav { display: none; }
  .main-content { padding-bottom: 0; }
  button:focus, button:focus-visible {
    outline: none;
  }
  button::-moz-focus-inner {
    border: 0;
  }
  @media (max-width: 640px) {
    .ledger-table { display: none !important; }
    .ledger-cards { display: block !important; }
    .bs-grid { grid-template-columns: 1fr !important; }
    .top-nav { display: none !important; }
    .bottom-nav { display: flex !important; }
    .main-content { padding-bottom: 72px !important; }
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
