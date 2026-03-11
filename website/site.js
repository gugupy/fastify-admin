// ── Theme ──────────────────────────────────────────────
const html = document.documentElement;
const buttons = document.querySelectorAll('.theme-btn');

function applyTheme(t) {
  const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  html.classList.toggle('dark', dark);
  buttons.forEach(b => b.classList.toggle('active', b.dataset.theme === t));
  try { localStorage.setItem('theme', t); } catch(e) {}
}

// Init from localStorage (matches the app's inline script)
const saved = (() => { try { return localStorage.getItem('theme'); } catch(e) { return null; } })();
applyTheme(saved || 'system');

buttons.forEach(b => b.addEventListener('click', () => applyTheme(b.dataset.theme)));
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const current = (() => { try { return localStorage.getItem('theme'); } catch(e) { return 'system'; } })();
  if (current === 'system') applyTheme('system');
});

// ── Copy install ───────────────────────────────────────
function copyInstall(el) {
  navigator.clipboard.writeText('npm install fastify-admin').then(() => {
    const hint = document.getElementById('copyHint');
    hint.textContent = 'copied!';
    setTimeout(() => { hint.textContent = 'click to copy'; }, 2000);
  });
}

// ── GSAP Animations ────────────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// Nav slide in
gsap.from('#nav', { y: -56, opacity: 0, duration: 0.5, ease: 'power2.out' });

// Hero entrance — staggered timeline
const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
heroTl
  .to('#heroBadge',   { opacity: 1, y: 0, duration: 0.5 }, 0.2)
  .to('#heroTitle',   { opacity: 1, y: 0, duration: 0.6 }, 0.35)
  .to('#heroSub',     { opacity: 1, y: 0, duration: 0.5 }, 0.55)
  .to('#heroActions', { opacity: 1, y: 0, duration: 0.5 }, 0.7)
  .to('#installBlock',{ opacity: 1, y: 0, duration: 0.5 }, 0.82);

// Set initial positions for hero elements
gsap.set(['#heroTitle', '#heroSub', '#heroActions', '#installBlock'], { y: 24 });

// Feature cards — stagger on scroll
gsap.to('.feature-card', {
  opacity: 1, y: 0, duration: 0.5,
  stagger: 0.07, ease: 'power2.out',
  scrollTrigger: {
    trigger: '.features-grid',
    start: 'top 80%',
  }
});

// Steps — slide in from left
gsap.to('.step', {
  opacity: 1, x: 0, duration: 0.45,
  stagger: 0.1, ease: 'power2.out',
  scrollTrigger: {
    trigger: '.steps',
    start: 'top 80%',
  }
});

// Roadmap — planned items
gsap.to('#roadmapPlanned .roadmap-item', {
  opacity: 1, y: 0, duration: 0.5,
  stagger: 0.07, ease: 'power2.out',
  scrollTrigger: { trigger: '#roadmapPlanned', start: 'top 80%' }
});
// Roadmap — considering items
gsap.to('#roadmap .roadmap-grid--considering .roadmap-item', {
  opacity: 1, y: 0, duration: 0.5,
  stagger: 0.07, ease: 'power2.out',
  scrollTrigger: { trigger: '.roadmap-grid--considering', start: 'top 80%' }
});

// Code block — fade up
gsap.to('#codeBlock', {
  opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
  scrollTrigger: {
    trigger: '#codeBlock',
    start: 'top 85%',
  }
});

// Section nav — highlight active on scroll
const sectionNavLinks = document.querySelectorAll('.section-nav a');
const sectionIds = ['preview','why', 'features', 'quickstart', 'roadmap', 'author'];
const sections = sectionIds.map(id => document.getElementById(id));

function setActive(id) {
  sectionNavLinks.forEach(a => a.classList.remove('active'));
  const active = document.querySelector(`.section-nav a[href="#${id}"]`);
  if (active) active.classList.add('active');
}

// Use scroll position fallback for short sections like author
window.addEventListener('scroll', () => {
  const scrollBottom = window.scrollY + window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;
  if (scrollBottom >= docHeight - 40) { setActive('author'); return; }

  let current = sectionIds[0];
  sections.forEach((s, i) => {
    if (s && s.getBoundingClientRect().top <= window.innerHeight * 0.45) {
      current = sectionIds[i];
    }
  });
  setActive(current);
}, { passive: true });

// Live preview scripts
const adminUsers = [
 {id:1,name:"Alice",email:"alice@company.com",role:"Admin"},
 {id:2,name:"Bob",email:"bob@company.com",role:"Editor"},
 {id:3,name:"Charlie",email:"charlie@company.com",role:"Viewer"},
 {id:4,name:"David",email:"david@company.com",role:"Editor"},
 {id:5,name:"Emma",email:"emma@company.com",role:"Admin"},
]

function renderAdmin(){
  const tbody=document.getElementById("adminRows")
  const search=document.getElementById("searchUser").value.toLowerCase()
  const role=document.getElementById("roleFilter").value

  tbody.innerHTML=""

  adminUsers
    .filter(u =>
      (!role || u.role===role) &&
      (u.name.toLowerCase().includes(search) || u.email.includes(search))
    )
    .forEach(user=>{

      const row=document.createElement("tr")

      row.innerHTML=`
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td style="color:var(--fg-muted)">${user.email}</td>
        <td>${user.role}</td>
        <td class="admin-actions">
          <button onclick="alert('Edit ${user.name}')">edit</button>
        </td>
      `

      tbody.appendChild(row)
    })
}

document.getElementById("searchUser").oninput=renderAdmin
document.getElementById("roleFilter").onchange=renderAdmin

renderAdmin()

gsap.from('#preview .admin-preview',{
  opacity:0,
  y:20,
  duration:.6,
  ease:'power2.out',
  scrollTrigger:{
    trigger:'#preview',
    start:'top 80%'
  }
})
