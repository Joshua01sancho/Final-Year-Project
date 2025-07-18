import React from "react";

const ForceLogoutDevButton = () => {
  // Only show in development (localhost or 127.0.0.1)
  const isDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  if (!isDev) return null;

  const handleForceLogout = () => {
    localStorage.removeItem("auth_token");
    alert("Auth token cleared! Reloading...");
    window.location.reload();
  };

  return (
    <button
      onClick={handleForceLogout}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
        background: "#e53e3e",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        padding: "12px 20px",
        fontWeight: "bold",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        cursor: "pointer",
      }}
    >
      Force Logout (Dev)
    </button>
  );
};

export default ForceLogoutDevButton; 