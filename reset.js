"use strict";
(async function () {
  const client = window.eliteMockClient;
  const form = document.getElementById("reset-form");
  const submit = document.getElementById("reset-submit");
  const status = document.getElementById("reset-message");
  const tell = (text) => { status.textContent = text; };
  if (!client) { tell(window.ELITEMOCK_CONFIG_ERROR || "Could not load Supabase."); return; }
  const { data: { session }, error } = await client.auth.getSession();
  if (error || !session) { tell("No valid recovery session found. Request a password-reset email from the sign-in page and open its link."); return; }
  submit.disabled = false;
  tell("Enter a new password. This link can only be used while your recovery session is valid.");
  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    submit.disabled = true;
    const { error: updateError } = await client.auth.updateUser({ password: document.getElementById("new-password").value });
    if (updateError) { tell(updateError.message); submit.disabled = false; return; }
    tell("Password updated. You can now open your student dashboard.");
    const a = document.createElement("a"); a.href = "./dashboard.html"; a.className = "btn btn-primary"; a.textContent = "Go to dashboard";
    form.replaceWith(a);
  });
})();
