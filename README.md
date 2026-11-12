# EliteMock by EliteNurses — Phase 1 Website Starter

This package is a **working public website prototype**, not a live payment or membership system.

## What works now
- Responsive EliteMock landing page and course catalogue.
- Working 5-question **public sample** with scoring, answer review and explanations.
- Navigation and mobile menu.
- No user passwords, payment secrets, or paid question banks in public files.

## What is NOT built yet
- Student registration/login.
- Supabase database and secure server-side question API.
- Paystack Mobile Money checkout and payment verification.
- Paid quizzes, student history and administrator dashboard.

**DO NOT advertise the site as accepting payments yet.** A static website alone is not a secure paid-question solution.

## File list
```
index.html          Home page
style.css           Site and sample-quiz styles
site.js             Mobile navigation, footer year
demo.html           Free sample quiz page
demo.js             Free sample quiz logic
demo-questions.js   Five PUBLIC demonstration questions only
.nojekyll           GitHub Pages compatibility
.gitignore          Guardrail for private files
private/            Local-only placeholder, DO NOT upload
 tools/             Question quality audit utility (local only)
```

## Publish the prototype using GitHub Pages
1. Download and extract the ZIP.
2. Sign in to GitHub and create a **new public repository**, e.g. `EliteMock`.
3. Open the repository and choose **Add file → Upload files**.
4. Upload the six web files (`index.html`, `style.css`, `site.js`, `demo.html`, `demo.js`, `demo-questions.js`) plus `.nojekyll` if your file uploader lets you select hidden files. **Do not upload the `private` folder or any paid `questions.js`.**
5. Commit the files.
6. Go to **Settings → Pages**, select **Deploy from a branch**, choose `main` and `/(root)`, and save.
7. Visit `https://YOUR-GITHUB-USERNAME.github.io/EliteMock/` (replace your username and chosen repository name).
8. Confirm the home page and **Try free practice** both work on a computer and mobile phone.

> This new public repository is the customer-facing interface only. Keep the current paid question-bank repositories unpublished or private as you migrate them; changing their visibility does not retroactively remove copied content.

## Local testing
Open `index.html` directly in a browser. Or run `python -m http.server 8000` from this directory and browse to `http://localhost:8000/`.

## Question audit
With Node.js installed, run `node tools/audit-questions.cjs /path/to/your/questions.js` to report structural issues and duplicates. Do this locally; do not upload paid questions to the public website.

## Next build step
1. Create a Supabase project.
2. Implement student accounts and a protected database schema with row-level security.
3. Migrate the reviewed paid questions to private tables, and serve question text without answer keys only to authorised buyers.
4. Add server-side grading and the Paystack checkout + webhook + verification flow.
5. Replace the prototype's launch messaging after full end-to-end security and payment tests.

## Security boundaries
- `.gitignore` is NOT a security mechanism for files already published or manually uploaded.
- Never place Paystack secret keys, Supabase service-role keys, or paid answer keys in public HTML/JS.
- Never unlock access based solely on the browser's `sessionStorage`, JavaScript variables, or a successful checkout redirect.
- Authorisation and payment verification must happen on the server.
- Even a protected quiz cannot stop an authorised student from copying screenshots.
