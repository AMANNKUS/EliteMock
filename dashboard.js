"use strict";
(async function () {
  const client = window.eliteMockClient;
  const status = document.getElementById("dashboard-message");
  const list = document.getElementById("course-list");
  const signout = document.getElementById("signout");
  const tell = (message) => { status.textContent = message; };
  if (!client) {
    tell(window.ELITEMOCK_CONFIG_ERROR || "Supabase configuration missing.");
    list.textContent = "Account setup is not complete.";
    signout.disabled = true;
    return;
  }

  signout.addEventListener("click", async () => {
    signout.disabled = true;
    const { error } = await client.auth.signOut();
    if (error) { tell(error.message); signout.disabled = false; return; }
    location.replace("./auth.html");
  });
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) { location.replace("./auth.html"); return; }
  const profileResult = await client.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const name = profileResult.data?.full_name || user.user_metadata?.full_name || "student";
  document.getElementById("welcome").textContent = `Welcome, ${name}.`;
  document.getElementById("student-email").textContent = user.email || "";
  if (profileResult.error) tell("Signed in, but profile name could not be loaded.");

  async function confirmCallback() {
    const params = new URLSearchParams(location.search);
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) return;
    history.replaceState({}, "", "./dashboard.html");
    tell("Checking your TEST payment with Paystack…");
    const { data, error } = await client.functions.invoke("elite-checkout", { body: { action: "confirm", reference } });
    if (error) {
      tell("Payment verification is not yet available. Your order has not been unlocked. Please contact support if needed.");
      return;
    }
    tell(data?.paid ? "Test payment verified. Your TEST access has been recorded." : "Payment is not confirmed yet. If checkout is still pending, complete it and return here.");
  }
  await confirmCallback();
  await refreshCourses();

  async function refreshCourses() {
    const [{ data: courses, error: coursesError }, { data: grants, error: grantsError }] = await Promise.all([
      client.from("courses").select("id,title,description,status").order("sort_order"),
      client.from("entitlements").select("course_id,expires_at,payment_mode")
    ]);
    list.replaceChildren();
    if (coursesError || grantsError) {
      tell(`Could not load your purchases: ${coursesError?.message || grantsError?.message}`);
      return;
    }
    if (!courses?.length) { list.textContent = "No courses are listed yet."; return; }
    const current = new Date();
    for (const course of courses) {
      const item = document.createElement("article");
      item.className = "dashboard-course";
      const heading = document.createElement("h3");
      heading.textContent = course.title;
      const description = document.createElement("p");
      description.textContent = course.description || "";
      const note = document.createElement("span");
      note.className = "course-badge";
      const entitlement = (grants || []).find(g => g.course_id === course.id && (!g.expires_at || new Date(g.expires_at) > current));
      if (entitlement?.payment_mode === "test") {
        note.textContent = "TEST access recorded — open General Paper practice when available";
      } else if (entitlement?.payment_mode === "live") {
        note.textContent = "Access recorded — examination content coming later";
      } else {
        note.textContent = "Paid questions not yet available";
      }
      item.append(heading, description, note);
      if (course.id === "general-paper" && entitlement?.payment_mode === "test") {
        const link = document.createElement("a");
        link.className = "btn btn-primary";
        link.href = "./general-paper.html";
        link.textContent = "Open General Paper TEST Quiz";
        item.append(link);
      }
      if (course.id === "general-paper" && !entitlement) {
        const price = document.createElement("p");
        price.textContent = "GH₵15.00 TEST checkout · no real payment";
        const pay = document.createElement("button");
        pay.type = "button";
        pay.className = "btn btn-primary";
        pay.textContent = "Simulate GH₵15 payment";
        pay.addEventListener("click", async () => {
          pay.disabled = true;
          tell("Preparing secure TEST checkout…");
          const { data, error } = await client.functions.invoke("elite-checkout", { body: { action: "start", course_id: "general-paper" } });
          if (error || !data?.authorization_url) {
            tell("Unable to create checkout. Confirm that the database SQL, Paystack test secret and Edge Function have been deployed. " + (data?.error || ""));
            pay.disabled = false;
            return;
          }
          const url = new URL(data.authorization_url);
          if (url.protocol !== "https:" || !(url.hostname === "checkout.paystack.com" || url.hostname.endsWith(".checkout.paystack.com"))) {
            tell("Unexpected checkout URL. Payment cancelled for safety.");
            pay.disabled = false;
            return;
          }
          location.assign(url.href);
        });
        item.append(price, pay);
      }
      list.append(item);
    }
  }
})();
