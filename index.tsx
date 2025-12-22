import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("TerrariumJS: Initializing engine...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  const msg = "TerrariumJS Error: Root element '#root' not found in document.";
  console.error(msg);
  document.body.innerHTML = `<div style="color:red;padding:20px;font-family:sans-serif;">${msg}</div>`;
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("TerrariumJS: Application mounted successfully.");
  } catch (error: any) {
    console.error("TerrariumJS: Critical failure during application mount:", error);
    rootElement.innerHTML = `
      <div style="
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        height: 100vh; 
        background: #0b0e14; 
        color: #ef4444; 
        font-family: 'Inter', sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <h2 style="font-size: 24px; font-weight: 900; margin-bottom: 16px;">CRITICAL ERROR</h2>
        <p style="color: #94a3b8; margin-bottom: 24px;">The application failed to start.</p>
        <pre style="background: rgba(0,0,0,0.5); padding: 16px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 12px; max-width: 100%; overflow: auto;">
          ${error?.message || String(error)}
        </pre>
      </div>
    `;
  }
}
