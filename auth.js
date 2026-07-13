// login + register logic — user.js must be loaded first

function togglePass(id, btn) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁️' : '🙈';
}

// live password strength on register page
const regPass = document.getElementById('regPassword');
if (regPass) {
  regPass.addEventListener('input', () => {
    const val = regPass.value;
    const fill = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    let strength = 0;
    if (val.length >= 8) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;
    const levels = [
      { pct: '0%',   color: '#e5e7eb', text: '' },
      { pct: '25%',  color: '#ef4444', text: 'Weak' },
      { pct: '50%',  color: '#f59e0b', text: 'Fair' },
      { pct: '75%',  color: '#3b82f6', text: 'Good' },
      { pct: '100%', color: '#16a34a', text: 'Strong' },
    ];
    fill.style.width = levels[strength].pct;
    fill.style.background = levels[strength].color;
    label.textContent = levels[strength].text;
    label.style.color = levels[strength].color;
  });
}

function showErr(id, visible) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('show', visible);
}
function markInput(id, invalid) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('invalid', invalid);
}
function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.textContent = msg;
}
function setSubmitLoading(formId, loading) {
  const btn = document.querySelector(`#${formId} [type=submit]`);
  if (btn) {
    btn.disabled = loading;
    btn.textContent = loading ? 'Please wait…' : btn.dataset.label;
    if (!btn.dataset.label && !loading) btn.dataset.label = btn.textContent;
  }
}

// ── LOGIN ──────────────────────────────────────────────────
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  // store original button label
  const submitBtn = loginForm.querySelector('[type=submit]');
  if (submitBtn) submitBtn.dataset.label = submitBtn.textContent;

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const emailEl = document.getElementById('email');
    const passEl  = document.getElementById('password');
    let valid = true;

    const emailOk = emailEl.value.trim() !== '' && emailEl.value.includes('@');
    markInput('email', !emailOk);
    showErr('emailErr', !emailOk);
    if (!emailOk) valid = false;

    const passOk = passEl.value.trim() !== '';
    markInput('password', !passOk);
    showErr('passErr', !passOk);
    if (!passOk) valid = false;

    if (!valid) return;

    setSubmitLoading('loginForm', true);
    showAlert('loginAlert', 'info', '');

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailEl.value.trim(), password: passEl.value }),
      });

      const data = await res.json();
      if (!res.ok) {
        showAlert('loginAlert', 'error', data.detail || 'Login failed');
        return;
      }

      setToken(data.access_token);
      saveUser(data.user);
      window.location.href = 'dashboard.html';
    } catch {
      showAlert('loginAlert', 'error', 'Could not reach server. Is the backend running?');
    } finally {
      setSubmitLoading('loginForm', false);
    }
  });
}

// ── REGISTER ───────────────────────────────────────────────
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  const submitBtn = registerForm.querySelector('[type=submit]');
  if (submitBtn) submitBtn.dataset.label = submitBtn.textContent;

  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;

    const fields = [
      { id: 'firstName',   errId: 'firstNameErr', check: v => v.trim() !== '' },
      { id: 'lastName',    errId: 'lastNameErr',  check: v => v.trim() !== '' },
      { id: 'regEmail',    errId: 'regEmailErr',  check: v => v.includes('@') },
      { id: 'regPassword', errId: 'regPassErr',   check: v => v.length >= 8 },
    ];

    fields.forEach(({ id, errId, check }) => {
      const el = document.getElementById(id);
      const ok = check(el.value);
      markInput(id, !ok);
      showErr(errId, !ok);
      if (!ok) valid = false;
    });

    const pass     = document.getElementById('regPassword').value;
    const confEl   = document.getElementById('confirmPass');
    const passMatch = pass === confEl.value;
    markInput('confirmPass', !passMatch);
    showErr('confirmPassErr', !passMatch);
    if (!passMatch) valid = false;

    const termsOk = document.getElementById('terms').checked;
    showErr('termsErr', !termsOk);
    if (!termsOk) valid = false;

    if (!valid) return;

    setSubmitLoading('registerForm', true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:      document.getElementById('regEmail').value.trim(),
          password:   pass,
          first_name: document.getElementById('firstName').value.trim(),
          last_name:  document.getElementById('lastName').value.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showAlert('registerAlert', 'error', data.detail || 'Registration failed');
        return;
      }

      setToken(data.access_token);
      saveUser(data.user);
      showAlert('registerAlert', 'success', 'Account created! Redirecting…');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    } catch {
      showAlert('registerAlert', 'error', 'Could not reach server. Is the backend running?');
    } finally {
      setSubmitLoading('registerForm', false);
    }
  });
}
