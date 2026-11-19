"use strict";
(async function () {
  const el = id => document.getElementById(id);
  const message = el("auth-message");
  const form = el("auth-form");
  const submit = el("auth-submit");
  const loginTab = el("tab-login");
  const registerTab = el("tab-register");
  const nameField = el("name-field");
  const nameInput = el("full-name");
  const password = el("password");
  const email = el("email");
  const forgot = el("forgot-password");
  const client = window.eliteMockClient;
  let mode = "login";

  function tell(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("error", isError);
  }
  function setMode(next) {
    mode = next;
    loginTab.classList.toggle("is-active", next === "login");
    registerTab.classList.toggle("is-active", next === "register");
    loginTab.setAttribute("aria-pressed", String(next === "login"));
    registerTab.setAttribute("aria-pressed", String(next === "register"));
    nameField.hidden = next !== "register";
    nameInput.required = next === "register";
    password.autocomplete = next === "register" ? "new-password" : "current-password";
    el("auth-heading").textContent = next === "register" ? "Create your account." : "Welcome back.";
    submit.textContent = next === "register" ? "Create account" : "Sign in";
    forgot.hidden = next !== "login";
    tell("");
  }

  if (!client) {
    tell(window.ELITEMOCK_CONFIG_ERROR || "Could not load Supabase. Check your internet connection.", true);
    submit.disabled = true;
    forgot.disabled = true;
    return;
  }

  loginTab.addEventListener("click", () => setMode("login"));
  registerTab.addEventListener("click", () => setMode("register"));

  try {
    const { data: { user } } = await client.auth.getUser();
    if (user) {
      location.replace("./dashboard.html");
      return;
    }
  } catch (_) { /* A network error will be shown when the user tries signing in. */ }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    tell("");
    submit.disabled = true;
    const address = email.value.trim().toLowerCase();
    const secret = password.value;
    try {
      if (mode === "register") {
        const fullName = nameInput.value.trim().replace(/\s+/g, " ");
        if (fullName.length < 2) throw new Error("Please provide your full name.");
        const { data, error } = await client.auth.signUp({
          email: address,
          password: secret,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: new URL("dashboard.html", location.href).href
          }
        });
        if (error) throw error;
        if (data.session) location.replace("./dashboard.html");
        else tell("Check your inbox for a confirmation link. If no email arrives, ask the site administrator to configure an email provider before public registration.");
      } else {
        const { error } = await client.auth.signInWithPassword({ email: address, password: secret });
        if (error) throw error;
        location.replace("./dashboard.html");
      }
    } catch (error) {
      tell(error.message || "Could not complete the request. Try again.", true);
    } finally {
      submit.disabled = false;
    }
  });

  forgot.addEventListener("click", async () => {
    if (!email.value.trim()) { tell("Enter your email address first, then select Forgot your password.", true); email.focus(); return; }
    forgot.disabled = true;
    tell("");
    try {
      const { error } = await client.auth.resetPasswordForEmail(email.value.trim().toLowerCase(), {
        redirectTo: new URL("reset.html", location.href).href
      });
      if (error) throw error;
      tell("If this account exists, a password-reset email has been requested. Check your inbox.");
    } catch (error) {
      tell(error.message || "Could not request a reset email.", true);
    } finally {
      forgot.disabled = false;
    }
  });
})();
