// Usage: node tools/audit-questions.cjs /path/to/questions.js
// Run only on your own trusted source files. This tool executes the supplied JS
// inside a Node VM sandbox with a short timeout; it does not upload question data.
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const sourceFile = process.argv[2];
if (!sourceFile) { console.error('Usage: node tools/audit-questions.cjs /path/to/questions.js'); process.exit(1); }
let list;
try {
  const raw = fs.readFileSync(path.resolve(sourceFile), 'utf8');
  list = vm.runInNewContext(raw + '\n;typeof questions!=="undefined"?questions:undefined;', {}, {timeout:1000});
} catch (err) { console.error('Could not read/load question file:', err.message); process.exit(1); }
if (!Array.isArray(list)) { console.error('No `const questions = [...]` array found.'); process.exit(1); }
const issues=[]; const seen=new Map();
for (let i=0;i<list.length;i++){
  const q=list[i], n=i+1;
  if (!q || typeof q.question!=='string' || !q.question.trim()){issues.push(`Q${n}: Missing question text.`);continue;}
  const normalized=q.question.replace(/\s+/g,' ').trim().toLowerCase();
  if(seen.has(normalized))issues.push(`Q${n}: Duplicate stem of Q${seen.get(normalized)}.`); else seen.set(normalized,n);
  if(!q.options || !['A','B','C'].every(k=>typeof q.options[k]==='string'&&q.options[k].trim()))issues.push(`Q${n}: Missing A/B/C options.`);
  if(!['A','B','C'].includes(q.correctAnswer))issues.push(`Q${n}: Invalid correctAnswer.`);
  if(typeof q.rationaleCorrect!=='string'||!q.rationaleCorrect.trim())issues.push(`Q${n}: Missing correct rationale.`);
  const wrong=['A','B','C'].filter(k=>k!==q.correctAnswer);
  if(!q.rationalesIncorrect||wrong.some(k=>typeof q.rationalesIncorrect[k]!=='string'||!q.rationalesIncorrect[k].trim()))issues.push(`Q${n}: Missing rationale for one or more incorrect options.`);
}
console.log(`Questions found: ${list.length}`);
console.log(`Potential issues: ${issues.length}`);
if(issues.length) { issues.forEach(s=>console.log(' - '+s)); process.exitCode=2; }
else console.log('Basic structure check passed. Clinical accuracy still requires expert review.');
