/* ========================================
   EMAX.DEV — script.js
   Auth + Portfolio Interactions
   ======================================== */

/* ========== STORAGE HELPERS ========== */
const Store = {
  getUsers: () => JSON.parse(localStorage.getItem('emax_users') || '[]'),
  saveUsers: (users) => localStorage.setItem('emax_users', JSON.stringify(users)),
  getSession: () => JSON.parse(sessionStorage.getItem('emax_session') || 'null'),
  setSession: (user) => sessionStorage.setItem('emax_session', JSON.stringify(user)),
  clearSession: () => sessionStorage.removeItem('emax_session'),
  isReturningUser: () => localStorage.getItem('emax_has_registered') === 'true',
  markReturning: () => localStorage.setItem('emax_has_registered', 'true'),
};

/* ========== PAGE DETECTION ========== */
const page = (() => {
  const p = window.location.pathname;
  if (p.includes('registration')) return 'registration';
  if (p.includes('login')) return 'login';
  return 'main';
})();

/* ========== TOAST ========== */
function showToast(msg, duration = 3000) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ========== PASSWORD TOGGLE ========== */
function togglePassword(id, el) {
  const input = document.getElementById(id);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    el.textContent = '🙈';
  } else {
    input.type = 'password';
    el.textContent = '👁';
  }
}

/* ========== HASH PASSWORD (simple, client-side) ========== */
async function hashPass(pass) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pass));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

/* ========================================
   REGISTRATION PAGE
   ======================================== */
function initRegistrationPage() {
  document.body.classList.add('auth-page');

  // If already logged in, go home
  if (Store.getSession()) {
    window.location.href = 'index.html';
    return;
  }

  const form = document.getElementById('registrationForm');
  if (!form) return;

  const errEl = document.getElementById('regError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';

    const name     = document.getElementById('regName').value.trim();
    const email    = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const confirm  = document.getElementById('regConfirm').value;

    if (!name || name.length < 2) {
      errEl.textContent = '⚠ Name must be at least 2 characters.'; return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEl.textContent = '⚠ Please enter a valid email.'; return;
    }
    if (password.length < 6) {
      errEl.textContent = '⚠ Password must be at least 6 characters.'; return;
    }
    if (password !== confirm) {
      errEl.textContent = '⚠ Passwords do not match.'; return;
    }

    const users = Store.getUsers();
    if (users.find(u => u.email === email)) {
      errEl.textContent = '⚠ This email is already registered.'; return;
    }

    const hashed = await hashPass(password);
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashed,
      registeredAt: new Date().toISOString()
    };

    users.push(newUser);
    Store.saveUsers(users);
    Store.markReturning();
    Store.setSession({ id: newUser.id, name: newUser.name, email: newUser.email });

    showToast(`🎉 Welcome, ${name}! Redirecting...`);
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
  });
}

/* ========================================
   LOGIN PAGE
   ======================================== */
function initLoginPage() {
  document.body.classList.add('auth-page');

  // If already logged in, go home
  if (Store.getSession()) {
    window.location.href = 'index.html';
    return;
  }

  // Show returning user's name hint if we have one stored
  const users = Store.getUsers();
  const welcomeEl = document.getElementById('userWelcome');
  if (welcomeEl && users.length > 0) {
    const last = users[users.length - 1];
    welcomeEl.textContent = `👋 Welcome back, ${last.name.split(' ')[0]}!`;
  }

  const form = document.getElementById('loginForm');
  if (!form) return;

  const errEl = document.getElementById('loginError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';

    const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    const users = Store.getUsers();
    const hashed = await hashPass(password);
    const user = users.find(u => u.email === email && u.password === hashed);

    if (!user) {
      errEl.textContent = '⚠ Incorrect email or password.'; return;
    }

    Store.setSession({ id: user.id, name: user.name, email: user.email });
    showToast(`✅ Logged in! Welcome back, ${user.name.split(' ')[0]}`);
    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
  });
}

/* ========================================
   MAIN PORTFOLIO PAGE
   ======================================== */
function initMainPage() {
  // --- Auth Gate ---
  const session = Store.getSession();
  if (!session) {
    // Route based on whether user has registered before
    if (Store.isReturningUser()) {
      window.location.href = 'login.html';
    } else {
      window.location.href = 'registration.html';
    }
    return;
  }

  // Show welcome toast
  showToast(`👋 Welcome, ${session.name.split(' ')[0]}!`);

  // --- Sticky Header ---
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      header && header.classList.add('scrolled');
    } else {
      header && header.classList.remove('scrolled');
    }
  });

  // --- Mobile Menu ---
  const menuBtn = document.getElementById('menu-btn');
  const navbar  = document.getElementById('navbar');
  if (menuBtn && navbar) {
    menuBtn.addEventListener('click', () => {
      navbar.classList.toggle('open');
      menuBtn.textContent = navbar.classList.contains('open') ? '✕' : '☰';
    });

    // Close on nav link click
    navbar.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navbar.classList.remove('open');
        menuBtn.textContent = '☰';
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target) && !menuBtn.contains(e.target)) {
        navbar.classList.remove('open');
        menuBtn.textContent = '☰';
      }
    });
  }

  // --- Typing Effect ---
  const roles = [
    'Frontend Developer',
    'UI/UX Enthusiast',
    'Creative Coder',
    'Web Designer',
    'JavaScript Lover'
  ];
  let roleIdx = 0, charIdx = 0, deleting = false;
  const typingEl = document.getElementById('typing');

  function typeLoop() {
    if (!typingEl) return;
    const current = roles[roleIdx];

    if (!deleting) {
      typingEl.textContent = current.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        deleting = true;
        setTimeout(typeLoop, 1600);
        return;
      }
    } else {
      typingEl.textContent = current.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        roleIdx = (roleIdx + 1) % roles.length;
      }
    }
    setTimeout(typeLoop, deleting ? 50 : 85);
  }
  typeLoop();

  // --- Scroll-to-top Button ---
  const topBtn = document.getElementById('topBtn');
  if (topBtn) {
    window.addEventListener('scroll', () => {
      topBtn.classList.toggle('show', window.scrollY > 400);
    });
    topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // --- Scroll Reveal ---
  const revealEls = document.querySelectorAll('.about, .project-card, .contact form, .about-image, .about-content, .hero-content, .hero-image-wrapper');
  revealEls.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // --- Contact Form ---
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name    = document.getElementById('contactName').value.trim();
      const email   = document.getElementById('contactEmail').value.trim();
      const message = document.getElementById('contactMessage').value.trim();

      if (!name || !email) {
        showToast('⚠ Please fill in name and email.'); return;
      }

      // Save message to localStorage
      const messages = JSON.parse(localStorage.getItem('emax_messages') || '[]');
      messages.push({ name, email, message, date: new Date().toISOString() });
      localStorage.setItem('emax_messages', JSON.stringify(messages));

      showToast(`✅ Thanks ${name}! Message sent.`, 4000);
      contactForm.reset();
    });
  }

  // --- Active Nav Link on Scroll ---
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.navbar nav a');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      if (window.scrollY >= top) current = sec.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.classList.remove('active-link');
      if (link.getAttribute('href') === '#' + current) link.classList.add('active-link');
    });
  });
}

/* ========== LOGOUT ========== */
function handleLogout() {
  Store.clearSession();
  showToast('👋 Logged out. See you soon!');
  setTimeout(() => { window.location.href = 'login.html'; }, 1200);
}

/* ========== ROUTER ========== */
document.addEventListener('DOMContentLoaded', () => {
  if (page === 'registration') {
    initRegistrationPage();
  } else if (page === 'login') {
    initLoginPage();
  } else {
    initMainPage();
  }
});
