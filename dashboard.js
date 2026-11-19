"use strict";
(async function () {
  const client = window.eliteMockClient;
  const status = document.getElementById("dashboard-message");
  const list = document.getElementById("course-list");
  const signout = document.getElementById("signout");
  const tell = (s) => { status.textContent = s; };
  if (!client) {
    tell(window.ELITEMOCK_CONFIG_ERROR || "Could not load Supabase. Check your connection.");
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
  if (profileResult.error) tell("Account verified, but profile data could not be loaded. Check that you ran the database setup SQL.");
  const { data: courses, error } = await client.from("courses").select("id,title,description,status").order("sort_order");
  list.replaceChildren();
  if (error) { tell(`Could not load the course catalogue: ${error.message}`); return; }
  if (!courses?.length) { list.textContent = "No courses have been listed yet."; return; }
  courses.forEach(course => {
    const item = document.createElement("article");
    item.className = "dashboard-course";
    const heading = document.createElement("h3");
    heading.textContent = course.title;
    const desc = document.createElement("p");
    desc.textContent = course.description || "";
    const tag = document.createElement("span");
    tag.className = "course-badge";
    tag.textContent = "Paid access coming soon";
    item.append(heading, desc, tag);
    list.append(item);
  });
})();
