const APP_ORIGIN = "https://familyvault-eight.vercel.app";

function setNativeValue(el, value) {
  const proto = el instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function fillLogin(username, password) {
  const selectors = [
    'input[type="email"]',
    'input[autocomplete="username"]',
    'input[name*="email" i]',
    'input[name*="user" i]',
    'input[type="text"]',
  ];
  let userField = null;
  for (const sel of selectors) {
    userField = document.querySelector(sel);
    if (userField && userField.type !== "password") break;
  }
  const passField = document.querySelector('input[type="password"]');

  if (userField && username) {
    userField.focus();
    setNativeValue(userField, username);
  }
  if (passField && password) {
    passField.focus();
    setNativeValue(passField, password);
  }
}

window.addEventListener("message", (event) => {
  if (event.data?.type !== "FAMILYVAULT_FILL") return;
  fillLogin(event.data.username || "", event.data.password || "");
});

function injectFillButton() {
  if (document.getElementById("familyvault-fill-btn")) return;
  if (!document.querySelector('input[type="password"]')) return;

  const btn = document.createElement("button");
  btn.id = "familyvault-fill-btn";
  btn.textContent = "🔒 FamilyVault";
  btn.type = "button";
  Object.assign(btn.style, {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    zIndex: "2147483646",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#059669",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  });

  btn.addEventListener("click", () => {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `${APP_ORIGIN}/extension/fill?url=${url}`,
      "familyvault-fill",
      "width=420,height=520"
    );
  });

  document.body.appendChild(btn);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectFillButton);
} else {
  injectFillButton();
}
