'use strict';
(function () {
  const questions = window.ELITEMOCK_DEMO_QUESTIONS;
  if (!Array.isArray(questions) || questions.length === 0) return;
  const $ = (id) => document.getElementById(id);
  const screens = { start: $('demo-start'), quiz: $('demo-questions-screen'), results: $('demo-results') };
  const answers = new Map();
  let current = 0;

  function show(screen) {
    Object.keys(screens).forEach(k => { screens[k].hidden = k !== screen; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function render() {
    const q = questions[current];
    $('question-count').textContent = `Question ${current + 1} of ${questions.length}`;
    $('answered-count').textContent = `${answers.size} answered`;
    $('quiz-progress-fill').style.width = `${((current + 1) / questions.length) * 100}%`;
    $('demo-question-text').textContent = q.question;
    const optionsEl = $('demo-options');
    optionsEl.replaceChildren();
    Object.entries(q.options).forEach(([key, content]) => {
      const label = document.createElement('label');
      label.className = 'answer-option';
      const radio = document.createElement('input');
      radio.type = 'radio'; radio.name = 'demo-answer'; radio.value = key;
      radio.checked = answers.get(current) === key;
      const keySpan = document.createElement('span'); keySpan.className = 'answer-letter'; keySpan.textContent = key;
      const textSpan = document.createElement('span'); textSpan.textContent = content;
      label.append(radio, keySpan, textSpan);
      radio.addEventListener('change', () => { answers.set(current, key); render(); });
      optionsEl.appendChild(label);
    });
    $('demo-prev').disabled = current === 0;
    $('demo-next').hidden = current === questions.length - 1;
    $('demo-submit').hidden = current !== questions.length - 1;
  }
  function results() {
    const score = questions.reduce((sum, q, i) => sum + Number(answers.get(i) === q.correctAnswer), 0);
    $('demo-score').textContent = `${score} / ${questions.length} (${Math.round((score / questions.length) * 100)}%)`;
    $('demo-summary').textContent = `You answered ${answers.size} out of ${questions.length} questions. Review the explanations below to learn more.`;
    const review = $('demo-review'); review.replaceChildren();
    questions.forEach((q, i) => {
      const chosen = answers.get(i);
      const item = document.createElement('article'); item.className = 'review-item';
      const heading = document.createElement('h3'); heading.textContent = `${i + 1}. ${q.question}`;
      const selected = document.createElement('p'); selected.textContent = `Your answer: ${chosen ? chosen + '. ' + q.options[chosen] : 'Not answered'}`;
      selected.className = chosen === q.correctAnswer ? 'answer-good' : 'answer-bad';
      const correct = document.createElement('p'); correct.textContent = `Correct answer: ${q.correctAnswer}. ${q.options[q.correctAnswer]}`;
      const rationale = document.createElement('p'); rationale.textContent = q.rationaleCorrect;
      item.append(heading, selected, correct, rationale);
      for (const [key, why] of Object.entries(q.rationalesIncorrect || {})) {
        const p = document.createElement('p'); p.className = 'explanation'; p.textContent = `Why ${key} is not the best answer: ${why}`;
        item.appendChild(p);
      }
      review.appendChild(item);
    });
    show('results');
  }
  $('demo-start-btn').addEventListener('click', () => { current = 0; answers.clear(); render(); show('quiz'); });
  $('demo-prev').addEventListener('click', () => { if (current > 0) { current--; render(); } });
  $('demo-next').addEventListener('click', () => { if (current < questions.length - 1) { current++; render(); } });
  $('demo-submit').addEventListener('click', () => {
    const unanswered = questions.length - answers.size;
    if (unanswered && !window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    results();
  });
  $('demo-restart').addEventListener('click', () => { answers.clear(); current = 0; show('start'); });
})();
