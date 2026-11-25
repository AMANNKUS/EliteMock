"use strict";
(async function () {
  const client = window.eliteMockClient;
  const message = document.getElementById("exam-message");
  const examArea = document.getElementById("exam-area");
  const resultArea = document.getElementById("exam-results");
  const questionEl = document.getElementById("exam-question");
  const optionsEl = document.getElementById("exam-options");
  const progressEl = document.getElementById("exam-progress");
  const barEl = document.getElementById("exam-progress-bar");
  const timerEl = document.getElementById("exam-timer");
  const prevBtn = document.getElementById("exam-prev");
  const nextBtn = document.getElementById("exam-next");
  const submitBtn = document.getElementById("exam-submit");
  const scoreEl = document.getElementById("exam-score");
  const reviewEl = document.getElementById("exam-review");
  if (!client) { message.textContent = "Supabase is not configured."; return; }
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) { location.replace("./auth.html"); return; }

  let attemptId = null;
  let questions = [];
  let answers = {};
  let activeIndex = 0;
  let deadline = 0;
  let interval = null;
  let pendingSave = Promise.resolve();
  let submitting = false;

  const element = (tag, content, css) => {
    const node = document.createElement(tag);
    if (content !== undefined) node.textContent = content;
    if (css) node.className = css;
    return node;
  };
  const notify = (text, failed = false) => {
    message.textContent = text;
    message.classList.toggle("error", failed);
  };
  async function invoke(body) {
    const { data, error } = await client.functions.invoke("elite-quiz", { body });
    if (error) {
      let details;
      try { if (error.context?.json) details = (await error.context.json()).error; } catch (_) {}
      throw new Error(details || error.message || "Quiz service unavailable");
    }
    if (data?.error) throw new Error(data.error);
    return data;
  }
  function updateTimer() {
    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    const mm = Math.floor(remaining / 60);
    timerEl.textContent = "Time left: " + mm + ":" + String(remaining % 60).padStart(2, "0");
    return remaining;
  }
  function renderQuestion() {
    const q = questions[activeIndex];
    if (!q) return;
    progressEl.textContent = "Question " + (activeIndex + 1) + " of " + questions.length +
      " · " + Object.keys(answers).length + " saved";
    barEl.style.width = String(((activeIndex + 1) / questions.length) * 100) + "%";
    questionEl.textContent = q.question;
    optionsEl.replaceChildren();
    for (const key of ["A", "B", "C"]) {
      const label = element("label", undefined, "answer-option");
      const input = element("input");
      input.type = "radio";
      input.name = "answer";
      input.value = key;
      input.checked = answers[q.id] === key;
      const text = element("span", q.options?.[key] || "");
      label.append(input, element("span", key, "answer-letter"), text);
      input.addEventListener("change", () => {
        if (!input.checked || submitting) return;
        const id = q.id;
        const choice = key;
        input.disabled = true;
        notify("Saving answer…");
        pendingSave = pendingSave.catch(() => {}).then(async () => {
          try {
            await invoke({ action: "save", attempt_id: attemptId, question_id: id, answer: choice });
            answers[id] = choice;
            notify("Answer saved.");
          } catch (err) {
            notify("Answer not saved: " + err.message + ". Please try again.", true);
            input.checked = false;
          } finally {
            input.disabled = false;
            progressEl.textContent = "Question " + (activeIndex + 1) + " of " + questions.length +
              " · " + Object.keys(answers).length + " saved";
          }
        });
      });
      optionsEl.append(label);
    }
    prevBtn.disabled = activeIndex === 0;
    nextBtn.disabled = activeIndex === questions.length - 1;
  }
  prevBtn.addEventListener("click", () => {
    if (activeIndex > 0) { activeIndex--; renderQuestion(); }
  });
  nextBtn.addEventListener("click", () => {
    if (activeIndex < questions.length - 1) { activeIndex++; renderQuestion(); }
  });
  function showResults(result) {
    clearInterval(interval);
    examArea.hidden = true;
    resultArea.hidden = false;
    const total = Number(result.total_questions) || 0;
    scoreEl.textContent = String(result.score) + " / " + total +
      " (" + (total ? Math.round(100 * result.score / total) : 0) + "%)";
    reviewEl.replaceChildren();
    for (const r of result.review || []) {
      const section = element("section", undefined, "review-item");
      section.append(element("h3", "Question " + r.position), element("p", r.question));
      const answer = r.selected_answer ? r.selected_answer + ". " + r.options[r.selected_answer] : "Not answered";
      section.append(element("p", "Your answer: " + answer,
        r.selected_answer === r.correct_answer ? "answer-good" : "answer-bad"));
      section.append(element("p", "Correct answer: " + r.correct_answer + ". " + r.options[r.correct_answer], "answer-good"));
      section.append(element("p", "Explanation: " + (r.rationale_correct || "No rationale provided."), "explanation"));
      for (const key of ["A", "B", "C"]) {
        if (key !== r.correct_answer) section.append(element("p",
          key + ". " + r.options[key] + " — " + (r.rationales_incorrect?.[key] || "No explanation available."), "explanation"));
      }
      reviewEl.append(section);
    }
    notify("Examination submitted. Your answer review is below.");
  }
  async function submit(auto = false) {
    if (submitting) return;
    if (!auto && !window.confirm("Submit the examination with " + Object.keys(answers).length +
      " of " + questions.length + " answers saved?")) return;
    submitting = true;
    submitBtn.disabled = true;
    notify("Finishing the examination…");
    try {
      await pendingSave;
      showResults(await invoke({ action: "finish", attempt_id: attemptId }));
    } catch (err) {
      submitting = false;
      submitBtn.disabled = false;
      notify("Could not submit: " + err.message + ". Your saved answers remain on the server.", true);
    }
  }
  submitBtn.addEventListener("click", () => submit(false));
  try {
    const response = await invoke({ action: "start", course_id: "general-paper" });
    if (!response.questions?.length) throw new Error("No approved questions have been published.");
    attemptId = response.attempt_id;
    questions = response.questions;
    answers = response.saved_answers || {};
    deadline = Date.now() + Math.max(0, Number(response.remaining_seconds) || 0) * 1000;
    examArea.hidden = false;
    notify("Your General Paper TEST quiz is ready. Answers are saved automatically.");
    renderQuestion();
    if (updateTimer() <= 0) {
      submit(true);
    } else {
      interval = setInterval(() => {
        if (updateTimer() <= 0) { clearInterval(interval); submit(true); }
      }, 1000);
    }
  } catch (err) {
    notify(err.message + ". Return to the dashboard if you need to complete your test payment.", true);
  }
})();