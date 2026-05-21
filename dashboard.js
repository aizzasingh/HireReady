// dashboard logic — user.js must be loaded first

const VIEWS = ['dashboard', 'upload', 'jobmatch', 'skills', 'myresumes'];
const VIEW_TITLES = {
  dashboard: 'Dashboard',
  upload: 'Upload Resume',
  jobmatch: 'Job Match',
  skills: 'Skill Analysis',
  myresumes: 'My Resumes',
};

// skill key → display name; duplicates (e.g. postgres/postgresql) are collapsed by display name
const SKILLS = {
  python: 'Python', java: 'Java', javascript: 'JavaScript', typescript: 'TypeScript',
  'c++': 'C++', 'c#': 'C#', ruby: 'Ruby', rust: 'Rust', swift: 'Swift',
  kotlin: 'Kotlin', scala: 'Scala', php: 'PHP', matlab: 'MATLAB', bash: 'Bash',
  golang: 'Go', 'node.js': 'Node.js', nodejs: 'Node.js',
  html: 'HTML', css: 'CSS', react: 'React', angular: 'Angular', vue: 'Vue.js',
  django: 'Django', flask: 'Flask', fastapi: 'FastAPI', spring: 'Spring', express: 'Express',
  sql: 'SQL', mysql: 'MySQL', postgresql: 'PostgreSQL', postgres: 'PostgreSQL',
  mongodb: 'MongoDB', redis: 'Redis', elasticsearch: 'Elasticsearch',
  sqlite: 'SQLite', oracle: 'Oracle', firebase: 'Firebase', dynamodb: 'DynamoDB',
  aws: 'AWS', azure: 'Azure', gcp: 'GCP', docker: 'Docker', kubernetes: 'Kubernetes',
  terraform: 'Terraform', ansible: 'Ansible', jenkins: 'Jenkins', linux: 'Linux',
  devops: 'DevOps', 'ci/cd': 'CI/CD',
  tensorflow: 'TensorFlow', pytorch: 'PyTorch', pandas: 'Pandas', numpy: 'NumPy',
  scikit: 'Scikit-learn', spark: 'Spark', hadoop: 'Hadoop',
  tableau: 'Tableau', 'power bi': 'Power BI', excel: 'Excel',
  'machine learning': 'Machine Learning', 'deep learning': 'Deep Learning', nlp: 'NLP',
  git: 'Git', jira: 'Jira', figma: 'Figma', graphql: 'GraphQL',
  'rest api': 'REST API', restful: 'RESTful', microservices: 'Microservices',
  agile: 'Agile', scrum: 'Scrum', postman: 'Postman', selenium: 'Selenium',
};

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', () => {
  requireAuth('login.html');
  injectUserUI();
  bindSidebarLinks();
  bindLogout();
  initUploadZone();
  loadDashboard();
});

// VIEW ROUTER 
function showView(name) {
  VIEWS.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.style.display = v === name ? '' : 'none';
  });

  // using event delegation pattern for sidebar active state
  document.querySelectorAll('.sidebar-link[data-view]').forEach(a => {
    a.classList.toggle('active', a.dataset.view === name);
  });

  const titleEl = document.getElementById('topbarTitle');
  if (titleEl) titleEl.textContent = VIEW_TITLES[name] || '';

  document.getElementById('sidebar').classList.remove('open');

  if (name === 'dashboard') loadDashboard();
  if (name === 'jobmatch') loadJobMatchView();
  if (name === 'skills') loadSkillsView();
  if (name === 'myresumes') loadMyResumesView();
}

// event delegation for sidebar nav clicks
function bindSidebarLinks() {
  document.querySelector('.sidebar-nav').addEventListener('click', e => {
    const link = e.target.closest('.sidebar-link[data-view]');
    if (!link) return;
    e.preventDefault();
    showView(link.dataset.view);
  });
}

function bindLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', e => {
    e.preventDefault();
    logout('login.html');
  });
}

// SCORE RING HELPERS 
const CIRC = 213.6; // 2 * π * 34

function setRing(id, pct) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.strokeDasharray = CIRC;
  el.style.strokeDashoffset = CIRC - CIRC * (pct / 100);
}

function scoreSub(pct) {
  if (pct >= 80) return { text: '↑ Good', cls: 'text-success' };
  if (pct >= 60) return { text: '⚡ Improve', cls: 'text-warn' };
  return { text: '↓ Weak', cls: 'text-danger' };
}

function renderScoreCard(ringId, valId, subId, pct) {
  setRing(ringId, pct);
  const valEl = document.getElementById(valId);
  const subEl = document.getElementById(subId);
  if (valEl) valEl.textContent = `${pct}%`;
  if (subEl) {
    const s = scoreSub(pct);
    subEl.textContent = s.text;
    subEl.className = `score-sub ${s.cls}`;
  }
}

// DASHBOARD VIEW 
function loadDashboard() {
  const user = getUser();
  const analysis = getAnalysis();
  const resumes = getResumes();

  const nameEl = document.getElementById('welcomeName');
  if (nameEl && user) nameEl.textContent = `${getGreeting()}, ${user.firstName} 👋`;

  if (!analysis) {
    show('dashEmpty');
    hide('dashData');
    return;
  }

  hide('dashEmpty');
  show('dashData');

  renderScoreCard('ringAts', 'scoreAts', 'subAts', analysis.ats);
  renderScoreCard('ringKw', 'scoreKw', 'subKw', analysis.keyword);
  renderScoreCard('ringJob', 'scoreJob', 'subJob', analysis.jobfit);
  renderScoreCard('ringContent', 'scoreContent', 'subContent', analysis.content);

  const roleTag = document.getElementById('skillRoleTag');
  if (roleTag) roleTag.textContent = `vs. ${analysis.detectedRole || 'detected role'}`;
  renderSkillList('skillList', analysis.presentSkills, analysis.missingSkills);
  renderSuggestions('suggestionList', analysis.suggestions);

  const badgeEl = document.getElementById('clusterBadge');
  const descEl = document.getElementById('clusterDesc');
  const tagsEl = document.getElementById('clusterTags');
  if (badgeEl) badgeEl.textContent = analysis.cluster || '—';
  if (descEl) descEl.textContent = analysis.clusterDesc || ''; // textContent — safer than innerHTML
  if (tagsEl) {
    tagsEl.innerHTML = '';
    (analysis.clusterTags || []).forEach(({ label, ok }) => {
      const s = document.createElement('span');
      s.className = `chip ${ok ? 'chip-ok' : 'chip-miss'}`;
      s.textContent = label;
      tagsEl.appendChild(s);
    });
  }

  renderResumeTable(resumes);
}

function renderResumeTable(resumes) {
  const tbody = document.getElementById('resumeTableBody');
  const empty = document.getElementById('resumeTableEmpty');
  if (!tbody) return;

  if (!resumes.length) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';

  tbody.innerHTML = resumes.slice(0, 5).map(r => `
    <tr>
      <td>${escHtml(r.filename)}</td>
      <td>${escHtml(r.uploadedAgo)}</td>
      <td><span class="badge-score ${badgeClass(r.ats)}">${r.ats}%</span></td>
      <td><button class="link-sm" style="background:none;border:none;cursor:pointer;padding:0"
          onclick="showView('dashboard')">View</button></td>
    </tr>`).join('');
}

function badgeClass(pct) {
  if (pct >= 80) return 'good';
  if (pct >= 60) return 'mid';
  return 'low';
}

function renderSkillList(containerId, present, missing) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = [
    ...(present || []).map(s => `
      <div class="skill-row">
        <span class="skill-dot present"></span>${escHtml(s)}
        <span class="skill-badge present">Present</span>
      </div>`),
    ...(missing || []).map(s => `
      <div class="skill-row">
        <span class="skill-dot missing"></span>${escHtml(s)}
        <span class="skill-badge missing">Missing</span>
      </div>`),
  ].join('');
}

function renderSuggestions(containerId, suggestions) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = (suggestions || []).map(s => `
    <li class="suggestion">
      <span class="sug-priority ${s.priority.toLowerCase()}">${escHtml(s.priority)}</span>
      ${escHtml(s.text)}
    </li>`).join('');
}

// UPLOAD + ANALYSIS FLOW 
let uploadedFile = null;
let extractedResumeText = '';
let extractionPromise = null;

function initUploadZone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });
}

function handleFile(file) {
  if (!file.name.match(/\.(pdf|docx)$/i)) {
    alert('Please upload a PDF or DOCX file.');
    return;
  }
  uploadedFile = file;
  extractedResumeText = '';
  extractionPromise = extractTextFromFile(file)
    .then(text => { extractedResumeText = text; })
    .catch(() => { extractedResumeText = ''; });

  const chosen = document.getElementById('fileChosen');
  if (chosen) {
    chosen.textContent = `✓  ${file.name}  (${(file.size / 1024).toFixed(1)} KB)`;
    chosen.classList.add('show');
  }
  const btn = document.getElementById('analyzeBtn');
  if (btn) btn.disabled = false;
}

function clearUpload() {
  uploadedFile = null;
  extractedResumeText = '';
  extractionPromise = null;
  const fi = document.getElementById('fileInput');
  if (fi) fi.value = '';
  const fc = document.getElementById('fileChosen');
  if (fc) { fc.classList.remove('show'); fc.textContent = ''; }
  const btn = document.getElementById('analyzeBtn');
  if (btn) btn.disabled = true;
  const jd = document.getElementById('jobDesc');
  if (jd) jd.value = '';
  setUploadStep(1);
}

function resetUpload() { clearUpload(); setUploadStep(1); }

function setUploadStep(n) {
  ['step1', 'step2', 'step3'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.style.display = i === n - 1 ? '' : 'none';
  });
  [1, 2, 3].forEach(i => {
    const ind = document.getElementById(`stepInd${i}`);
    if (!ind) return;
    ind.classList.remove('active', 'done');
    if (i < n) ind.classList.add('done');
    if (i === n) ind.classList.add('active');
  });
}

async function startAnalysis() {
  if (!uploadedFile) return;
  setUploadStep(2);

  if (extractionPromise) await extractionPromise;

  const statuses = [
    'Extracting text content…',
    'Running NLP pipeline…',
    'Scoring ATS compatibility…',
    'Analysing keyword density…',
    'Detecting skill gaps…',
    'Comparing with job description…',
    'Building your report…',
  ];

  const bar = document.getElementById('progressBar');
  const statusEl = document.getElementById('analyzeStatus');
  let step = 0;

  const interval = setInterval(() => {
    step++;
    const pct = Math.round((step / statuses.length) * 100);
    if (bar) bar.style.width = `${Math.min(pct, 100)}%`;
    if (statusEl) statusEl.textContent = statuses[step - 1] || 'Finalizing…';

    if (step >= statuses.length) {
      clearInterval(interval);
      setTimeout(() => {
        const jobDesc = document.getElementById('jobDesc')?.value.trim() || '';
        const result = generateAnalysis(uploadedFile.name, jobDesc, extractedResumeText);
        saveAnalysis(result);
        addResume({
          filename: uploadedFile.name,
          uploadedAgo: 'Just now',
          ats: result.ats,
          jobfit: result.jobfit,
          content: result.content,
        });
        renderResultsPanel(result, uploadedFile.name);
        setUploadStep(3);
      }, 600);
    }
  }, 650);
}

function generateAnalysis(filename, jobDesc, resumeText) {
  const text = resumeText.toLowerCase();
  const hasText = text.trim().length > 50;

  // ── skill detection ──────────────────────────────────────
  const presentDisplay = new Set();
  const missingDisplay = new Set();
  Object.entries(SKILLS).forEach(([key, display]) => {
    if (text.includes(key)) presentDisplay.add(display);
    else missingDisplay.add(display);
  });
  const presentSkills = [...presentDisplay];
  // top 8 missing skills (exclude those already captured as present under another alias)
  const missingSkills = [...missingDisplay].filter(d => !presentDisplay.has(d)).slice(0, 8);

  // ── section detection ────────────────────────────────────
  const sections = [
    { name: 'Career Objective', present: /objective|summary|profile/i.test(resumeText) },
    { name: 'Skills',           present: /skills|technologies|competencies/i.test(resumeText) },
    { name: 'Work Experience',  present: /experience|employment|work history/i.test(resumeText) },
    { name: 'Education',        present: /education|degree|university|college|bachelor|master/i.test(resumeText) },
    { name: 'Projects',         present: /projects?/i.test(resumeText) },
    { name: 'Certifications',   present: /certif/i.test(resumeText) },
    { name: 'Links (LinkedIn/GitHub)', present: /linkedin|github|portfolio/i.test(resumeText) },
  ];
  const sectionsFound = sections.filter(s => s.present).length;

  // ── scoring (heuristic, no ML) ───────────────────────────
  const wordCount  = resumeText.split(/\s+/).filter(Boolean).length;
  const hasNumbers = /\d+\s*%|\d+\s*\+|\$\s*\d+|\d+\s*years?/i.test(resumeText);

  // if no real text was extracted, fall back to mild placeholder scores
  const ats = hasText
    ? Math.min(Math.round(
        (sectionsFound / sections.length) * 40 +
        Math.min(presentSkills.length * 3, 35) +
        (wordCount > 300 ? 15 : wordCount > 100 ? 8 : 0) +
        (hasNumbers ? 10 : 0)
      ), 98)
    : 55;

  const content = hasText
    ? Math.min(Math.round(
        (sectionsFound / sections.length) * 35 +
        Math.min(wordCount / 15, 35) +
        (hasNumbers ? 15 : 0) +
        (sections[0].present ? 15 : 0)
      ), 98)
    : 60;

  // ── keyword match against JD ─────────────────────────────
  const hasJD = jobDesc.length > 50;
  let keyword = hasText ? 45 : 40;
  if (hasJD) {
    const techRe = /python|java|sql|docker|kubernetes|aws|azure|node|react|angular|typescript|redis|terraform|git|linux|agile|scrum|rest|api|cloud|spring|flask|django|mysql|mongo|nosql|spark|tableau|excel|power.?bi|figma|jira/i;
    const jdWords = [...new Set((jobDesc.toLowerCase().match(/\b[a-z]{3,}\b/g) || []).filter(w => techRe.test(w)))];
    if (jdWords.length) {
      const found = jdWords.filter(k => text.includes(k));
      keyword = Math.max(Math.min(Math.round((found.length / jdWords.length) * 100), 98), 20);
    }
  }

  const jobfit = hasJD
    ? Math.min(Math.round((ats * 0.5 + keyword * 0.5)), 98)
    : Math.min(Math.round(ats * 0.85), 98);

  // ── role clustering ──────────────────────────────────────
  const dataKeys   = ['python', 'sql', 'tableau', 'power bi', 'machine learning', 'pandas', 'numpy', 'spark', 'hadoop'];
  const mgmtKeys   = ['agile', 'scrum', 'jira', 'leadership', 'management', 'project manager'];
  const dataScore  = dataKeys.filter(k => text.includes(k)).length;
  const mgmtScore  = mgmtKeys.filter(k => text.includes(k)).length;

  let cluster;
  if (dataScore >= 3) {
    cluster = {
      label: 'Data & Analytics',
      desc: 'Your resume aligns with Data Analyst / Scientist profiles.',
      tags: [
        { label: 'SQL',    ok: text.includes('sql') },
        { label: 'Python', ok: text.includes('python') },
        { label: 'ML',     ok: text.includes('machine learning') || text.includes('scikit') },
      ],
    };
  } else if (mgmtScore >= 2) {
    cluster = {
      label: 'Management / Leadership',
      desc: 'Your resume matches Team Lead / Project Manager profiles.',
      tags: [
        { label: 'Leadership', ok: text.includes('lead') || text.includes('manag') },
        { label: 'Agile',      ok: text.includes('agile') },
        { label: 'Technical',  ok: presentSkills.length > 4 },
      ],
    };
  } else {
    cluster = {
      label: 'Technical / Engineering',
      desc: 'Your resume closely matches Software Engineering profiles.',
      tags: [
        { label: 'Backend',  ok: text.includes('api') || text.includes('backend') || text.includes('server') },
        { label: 'Frontend', ok: text.includes('react') || text.includes('html') || text.includes('frontend') },
        { label: 'DevOps',   ok: text.includes('docker') || text.includes('kubernetes') || text.includes('ci/cd') },
      ],
    };
  }

  // ── suggestions ──────────────────────────────────────────
  const suggestions = [];
  if (!sections.find(s => s.name === 'Certifications').present)
    suggestions.push({ priority: 'High', text: 'Add a certifications section (e.g., AWS, GCP) to boost ATS score.' });
  if (!hasNumbers)
    suggestions.push({ priority: 'High', text: 'Quantify achievements with numbers and percentages (e.g., "improved performance by 30%").' });
  if (missingSkills.length)
    suggestions.push({ priority: 'Medium', text: `Consider adding ${missingSkills.slice(0, 2).join(' and ')} — common in similar roles.` });
  if (hasJD && keyword < 70)
    suggestions.push({ priority: 'Medium', text: 'Mirror more keywords from the job description in your experience section.' });
  if (!sections.find(s => s.name.includes('Links')).present)
    suggestions.push({ priority: 'Low', text: 'Include your LinkedIn or GitHub URL for completeness.' });

  return {
    ats, keyword, jobfit, content,
    sections, presentSkills, missingSkills,
    detectedRole: cluster.label,
    cluster: cluster.label, clusterDesc: cluster.desc, clusterTags: cluster.tags,
    suggestions, hasJD, filename,
  };
}

function renderResultsPanel(result, filename) {
  const fn = document.getElementById('resultFilename');
  if (fn) fn.textContent = filename;

  renderScoreCard('resRingAts', 'resScoreAts', 'resSubAts', result.ats);
  renderScoreCard('resRingKw', 'resScoreKw', 'resSubKw', result.keyword);
  renderScoreCard('resRingJob', 'resScoreJob', 'resSubJob', result.jobfit);
  renderScoreCard('resRingContent', 'resScoreContent', 'resSubContent', result.content);

  const secEl = document.getElementById('resSections');
  if (secEl) {
    secEl.innerHTML = result.sections.map(s => `
      <div class="sec-row ${s.present ? 'ok' : 'miss'}">
        <span>${s.present ? '✓' : '✗'}</span> ${escHtml(s.name)}
      </div>`).join('');
  }

  renderSuggestions('resSuggestions', result.suggestions);
}

// ── TEXT EXTRACTION ──────────────────────────────────────
async function extractTextFromFile(file) {
  if (file.name.match(/\.pdf$/i)) return extractPdfText(file);
  if (file.name.match(/\.docx$/i)) return extractDocxText(file);
  return '';
}

async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}

async function extractDocxText(file) {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

// ── JOB MATCH VIEW ───────────────────────────────────────
function loadJobMatchView() {
  const analysis = getAnalysis();
  if (!analysis) { show('jobMatchNoResume'); hide('jobMatchForm'); return; }
  hide('jobMatchNoResume');
  show('jobMatchForm');

  const preview = document.getElementById('jmResumePreview');
  if (preview) {
    // build preview using DOM methods to avoid innerHTML injection risk
    preview.innerHTML = `
      <div style="margin-bottom:12px">
        <div style="font-size:0.78rem;color:var(--ink-3);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Latest resume</div>
        <div style="font-weight:500">${escHtml(analysis.filename || 'resume.pdf')}</div>
      </div>
      <div class="score-grid" style="grid-template-columns:1fr 1fr;gap:10px">
        <div class="score-card" style="padding:14px">
          <div class="score-label">ATS</div>
          <div style="font-family:'DM Serif Display',serif;font-size:1.6rem;letter-spacing:-1px">${analysis.ats}%</div>
        </div>
        <div class="score-card" style="padding:14px">
          <div class="score-label">Content</div>
          <div style="font-family:'DM Serif Display',serif;font-size:1.6rem;letter-spacing:-1px">${analysis.content}%</div>
        </div>
      </div>
      <div style="margin-top:14px">
        <div style="font-size:0.78rem;font-weight:600;color:var(--ink-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Skills on your resume</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${(analysis.presentSkills || []).map(s => `<span class="chip chip-ok">${escHtml(s)}</span>`).join('')}
        </div>
      </div>`;
  }

  // restore saved country preference
  const countryEl = document.getElementById('adzunaCountry');
  const savedCountry = localStorage.getItem('adzuna_country');
  if (countryEl && savedCountry) countryEl.value = savedCountry;
}

function runJobMatch() {
  const jd = document.getElementById('jmJobDesc')?.value.trim() || '';
  const analysis = getAnalysis();
  if (!jd || jd.length < 30) { alert('Please paste a job description (at least a few sentences).'); return; }
  if (!analysis) return;

  // pull tech keywords from the JD text
  const techRe = /python|java|sql|docker|kubernetes|aws|azure|node|react|angular|typescript|redis|terraform|git|linux|agile|scrum|rest|api|cloud|spring|flask|django|mysql|mongo|nosql|spark|tableau|excel|power.?bi|figma|jira/i;
  const jdWords = [...new Set((jd.toLowerCase().match(/\b[a-z]{3,}\b/g) || []).filter(w => techRe.test(w)))];

  const resumeLower = (analysis.presentSkills || []).map(s => s.toLowerCase());
  const found = jdWords.filter(k => resumeLower.some(s => s.includes(k) || k.includes(s)));
  const missing = jdWords.filter(k => !resumeLower.some(s => s.includes(k) || k.includes(s)));

  const fitPct = jdWords.length ? Math.round((found.length / jdWords.length) * 100) : 60;
  const fit = Math.min(Math.max(fitPct, 20), 98);

  let verdict, comment;
  if (fit >= 75) { verdict = '✅ Strong match'; comment = 'Your resume aligns well with this role. Tailor your objective for a final boost.'; }
  else if (fit >= 50) { verdict = '⚡ Moderate match'; comment = 'A good foundation — adding the missing keywords below could significantly improve your chances.'; }
  else { verdict = '⚠️ Weak match'; comment = 'Significant keyword gap. Consider tailoring your resume more closely to this role.'; }

  show('jmResult');
  setRing('jmRing', fit);

  document.getElementById('jmScore').textContent = `${fit}%`;
  document.getElementById('jmVerdict').textContent = verdict;
  document.getElementById('jmComment').textContent = comment;

  const foundEl = document.getElementById('jmKeywordsFound');
  const missingEl = document.getElementById('jmKeywordsMissing');
  if (foundEl) foundEl.innerHTML = found.length ? found.map(k => `<span class="chip chip-ok">${escHtml(k)}</span>`).join('') : '<span style="font-size:.83rem;color:var(--ink-3)">None matched</span>';
  if (missingEl) missingEl.innerHTML = missing.length ? missing.map(k => `<span class="chip chip-miss">${escHtml(k)}</span>`).join('') : '<span style="font-size:.83rem;color:var(--success)">All keywords present 🎉</span>';
}

// ── ADZUNA JOB SEARCH ────────────────────────────────────
const ADZUNA_APP_ID  = 'ddf9b801';
const ADZUNA_APP_KEY = 'acf54272db1ba45f47041995e38ff0c8';

async function loadJobsFromAdzuna() {
  const country = document.getElementById('adzunaCountry')?.value || 'in';
  const appId   = ADZUNA_APP_ID;
  const appKey  = ADZUNA_APP_KEY;

  localStorage.setItem('adzuna_country', country);

  const analysis = getAnalysis();
  if (!analysis) return;

  const roleKeywords = {
    'Technical / Engineering': 'software developer',
    'Data & Analytics':        'data analyst',
    'Management / Leadership': 'project manager',
  };
  const role       = roleKeywords[analysis.detectedRole] || 'software developer';
  const topSkills  = (analysis.presentSkills || []).slice(0, 5).join(' ');
  const whatParam  = encodeURIComponent(role);
  const whatOr     = topSkills ? `&what_or=${encodeURIComponent(topSkills)}` : '';

  const statusEl  = document.getElementById('adzunaStatus');
  const resultsEl = document.getElementById('adzunaResults');
  statusEl.textContent = 'Searching for matching jobs…';
  statusEl.style.display = '';
  resultsEl.innerHTML = '';

  try {
    const url =
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1` +
      `?app_id=${appId}&app_key=${appKey}` +
      `&results_per_page=8&what=${whatParam}${whatOr}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error ${res.status} — check your credentials`);
    const data = await res.json();

    statusEl.style.display = 'none';

    if (!data.results?.length) {
      resultsEl.innerHTML = '<p style="font-size:0.85rem;color:var(--ink-3)">No jobs found. Try uploading a resume first.</p>';
      return;
    }

    resultsEl.innerHTML = data.results.map(job => {
      const company    = job.company?.display_name || '—';
      const location   = job.location?.display_name || '—';
      const salaryPart = (job.salary_min && job.salary_max)
        ? ` · ${Math.round(job.salary_min / 1000)}k – ${Math.round(job.salary_max / 1000)}k`
        : '';
      return `
        <div class="dash-panel" style="margin-bottom:10px;padding:16px 18px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap">
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;margin-bottom:3px">${escHtml(job.title)}</div>
              <div style="font-size:0.83rem;color:var(--ink-2)">${escHtml(company)}</div>
              <div style="font-size:0.78rem;color:var(--ink-3);margin-top:3px">${escHtml(location)}${escHtml(salaryPart)}</div>
            </div>
            <a href="${escHtml(job.redirect_url)}" target="_blank" rel="noopener noreferrer"
               class="btn btn-outline" style="font-size:0.8rem;padding:6px 14px;flex-shrink:0;text-decoration:none">Apply →</a>
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
    statusEl.style.display = '';
  }
}

// ── SKILL ANALYSIS VIEW ──────────────────────────────────
function loadSkillsView() {
  const analysis = getAnalysis();
  if (!analysis) { show('skillsEmpty'); hide('skillsData'); return; }
  hide('skillsEmpty');
  show('skillsData');

  const countTag = document.getElementById('skillsCountTag');
  if (countTag) countTag.textContent = `${(analysis.presentSkills || []).length} detected`;

  renderSkillList('skillsDetected', analysis.presentSkills, []);

  const recEl = document.getElementById('skillsRecommended');
  if (recEl) {
    recEl.innerHTML = (analysis.missingSkills || []).map(s => `
      <div class="skill-row" style="background:#fef9ee">
        <span style="font-size:1rem">💡</span>${escHtml(s)}
        <span class="skill-badge missing">Add this</span>
      </div>`).join('');
  }
}

// ── MY RESUMES VIEW ──────────────────────────────────────
function loadMyResumesView() {
  const resumes = getResumes();
  if (!resumes.length) { show('myResumesEmpty'); hide('myResumesData'); return; }
  hide('myResumesEmpty');
  show('myResumesData');

  const tbody = document.getElementById('myResumesBody');
  if (tbody) {
    tbody.innerHTML = resumes.map(r => `
      <tr>
        <td>${escHtml(r.filename)}</td>
        <td>${escHtml(r.uploadedAgo)}</td>
        <td><span class="badge-score ${badgeClass(r.ats)}">${r.ats}%</span></td>
        <td><span class="badge-score ${badgeClass(r.jobfit)}">${r.jobfit}%</span></td>
        <td><span class="badge-score ${badgeClass(r.content)}">${r.content}%</span></td>
      </tr>`).join('');
  }
}

// ── UTILITIES ────────────────────────────────────────────
function show(id) { const el = document.getElementById(id); if (el) el.style.display = ''; }
function hide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

// XSS prevention — always escape before injecting into innerHTML
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
