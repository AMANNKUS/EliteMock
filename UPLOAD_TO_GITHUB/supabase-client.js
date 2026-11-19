"use strict";
(function () {
  const conf = window.ELITEMOCK_CONFIG;
  if (!window.supabase || !conf || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(conf.supabaseUrl || "") ||
      !/^sb_publishable_[a-zA-Z0-9_-]+$/.test(conf.supabasePublishableKey || "") ||
      conf.supabasePublishableKey.includes("PASTE_")) {
    window.ELITEMOCK_CONFIG_ERROR = "Supabase is not connected yet. Complete the two settings in config.js using your own project URL and publishable key.";
    return;
  }
  try {
    window.eliteMockClient = window.supabase.createClient(conf.supabaseUrl, conf.supabasePublishableKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
    });
  } catch (err) {
    window.ELITEMOCK_CONFIG_ERROR = "Could not initialise Supabase. Check config.js.";
  }
})();
