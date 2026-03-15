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
  .to('#installBlock',{ opacity: 0.6, y: 0, duration: 0.5 }, 0.82);

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

// ── Live preview ───────────────────────────────────────
const previewData = {
  users: {
    label: 'Users',
    columns: ['id', 'name', 'email', 'role'],
    muteFrom: 2,
    rows: [
      {id:1, name:'Alice',   email:'alice@company.com',   role:'Admin'},
      {id:2, name:'Bob',     email:'bob@company.com',     role:'Editor'},
      {id:3, name:'Charlie', email:'charlie@company.com', role:'Viewer'},
      {id:4, name:'David',   email:'david@company.com',   role:'Editor'},
      {id:5, name:'Emma',    email:'emma@company.com',    role:'Admin'},
    ],
    searchCols: ['name', 'email'],
    filter: { col: 'role', options: ['Admin', 'Editor', 'Viewer'] },
  },
  posts: {
    label: 'Posts',
    columns: ['id', 'title', 'author', 'status'],
    muteFrom: 2,
    rows: [
      {id:1, title:'Getting Started',   author:'Alice', status:'published'},
      {id:2, title:'Advanced Routing',  author:'Bob',   status:'draft'},
      {id:3, title:'MikroORM Tips',     author:'Alice', status:'published'},
      {id:4, title:'Auth Deep Dive',    author:'Emma',  status:'draft'},
    ],
    searchCols: ['title', 'author'],
    filter: { col: 'status', options: ['published', 'draft'] },
  },
  roles: {
    label: 'Roles',
    columns: ['id', 'name', 'permissions'],
    muteFrom: 2,
    rows: [
      {id:1, name:'Admin',  permissions:'all'},
      {id:2, name:'Editor', permissions:'read, write'},
      {id:3, name:'Viewer', permissions:'read'},
    ],
    searchCols: ['name'],
    filter: null,
  },
  permissions: {
    label: 'Permissions',
    columns: ['id', 'name'],
    muteFrom: 2,
    rows: [
      {id:1, name:'user.list'},
      {id:2, name:'user.show'},
      {id:3, name:'user.create'},
      {id:4, name:'user.edit'},
      {id:5, name:'user.delete'},
      {id:6, name:'post.list'},
      {id:7, name:'post.show'},
      {id:8, name:'post.create'},
    ],
    searchCols: ['name'],
    filter: null,
  },
}

let currentEntity = 'users'
let editingId = null  // number | 'new' | null

function escAttr(s) { return String(s).replace(/"/g, '&quot;') }

function renderDataRow(row, data) {
  return '<tr>' +
    data.columns.map((col, i) =>
      `<td${i >= data.muteFrom ? ' style="color:var(--fg-muted)"' : ''}>${row[col] ?? ''}</td>`
    ).join('') +
    `<td><div class="admin-actions">` +
    `<button data-action="edit" data-id="${row.id}">edit</button>` +
    `<button data-action="delete" data-id="${row.id}">delete</button>` +
    `</div></td></tr>`
}

function renderEditRow(id, data, row = null) {
  const isNew = id === 'new'
  return '<tr class="admin-edit-row">' +
    data.columns.map(col => {
      if (col === 'id') return `<td style="color:var(--fg-muted)">${isNew ? 'new' : row.id}</td>`
      const val = row ? (row[col] ?? '') : ''
      return `<td><input class="admin-inline-input" data-col="${col}" value="${escAttr(val)}" /></td>`
    }).join('') +
    `<td><div class="admin-actions">` +
    `<button data-action="save" data-id="${id}">save</button>` +
    `<button data-action="cancel">cancel</button>` +
    `</div></td></tr>`
}

function renderPreview() {
  const data = previewData[currentEntity]
  const search = document.getElementById('previewSearch').value.toLowerCase()

  // Update entity title
  document.getElementById('entityTitle').textContent = data.label

  // Update filter select
  const filterSel = document.getElementById('previewFilter')
  if (data.filter) {
    const prev = filterSel.value
    filterSel.style.display = ''
    filterSel.innerHTML =
      `<option value="">all ${data.filter.col}s</option>` +
      data.filter.options.map(o => `<option value="${o}">${o}</option>`).join('')
    if (data.filter.options.includes(prev)) filterSel.value = prev
  } else {
    filterSel.style.display = 'none'
    filterSel.value = ''
  }
  const filterVal = data.filter ? filterSel.value : ''

  // Update placeholder
  document.getElementById('previewSearch').placeholder =
    `search ${data.searchCols.join(' / ')}…`

  // Filter rows
  const filtered = data.rows.filter(row => {
    const matchSearch = !search ||
      data.searchCols.some(col => String(row[col] ?? '').toLowerCase().includes(search))
    const matchFilter = !filterVal || String(row[data.filter?.col]) === filterVal
    return matchSearch && matchFilter
  })

  // Render thead
  document.getElementById('adminHead').innerHTML =
    '<tr>' + data.columns.map(c => `<th>${c}</th>`).join('') + '<th></th></tr>'

  // Render tbody — new row first, then data rows
  document.getElementById('adminRows').innerHTML = [
    ...(editingId === 'new' ? [renderEditRow('new', data)] : []),
    ...filtered.map(row =>
      editingId === row.id ? renderEditRow(row.id, data, row) : renderDataRow(row, data)
    ),
  ].join('')

  // Pagination info
  document.getElementById('paginationInfo').textContent =
    `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`
}

// Table action delegation (edit / delete / save / cancel)
document.getElementById('adminRows').addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]')
  if (!btn) return
  const action = btn.dataset.action
  const rawId = btn.dataset.id
  const id = rawId === 'new' ? 'new' : Number(rawId)
  const data = previewData[currentEntity]

  if (action === 'edit') {
    editingId = id
    renderPreview()
    // Focus first input
    document.querySelector('#adminRows .admin-inline-input')?.focus()

  } else if (action === 'delete') {
    const idx = data.rows.findIndex(r => r.id === id)
    if (idx !== -1) data.rows.splice(idx, 1)
    if (editingId === id) editingId = null
    renderPreview()

  } else if (action === 'save') {
    const inputs = document.querySelectorAll('#adminRows .admin-inline-input')
    const values = {}
    inputs.forEach(inp => { values[inp.dataset.col] = inp.value.trim() })

    if (id === 'new') {
      const nextId = data.rows.reduce((m, r) => Math.max(m, r.id), 0) + 1
      data.rows.push({ id: nextId, ...values })
    } else {
      const row = data.rows.find(r => r.id === id)
      if (row) Object.assign(row, values)
    }
    editingId = null
    renderPreview()

  } else if (action === 'cancel') {
    editingId = null
    renderPreview()
  }
})

// Create button
document.querySelector('.admin-create-btn').addEventListener('click', () => {
  editingId = 'new'
  renderPreview()
  document.querySelector('#adminRows .admin-inline-input')?.focus()
})

// Sidebar navigation
document.querySelectorAll('.admin-sidebar-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.admin-sidebar-item').forEach(i => i.classList.remove('active'))
    item.classList.add('active')
    currentEntity = item.dataset.entity
    editingId = null
    document.getElementById('previewSearch').value = ''
    renderPreview()
  })
})

document.getElementById('previewSearch').oninput = renderPreview
document.getElementById('previewFilter').onchange = renderPreview

renderPreview()

// Preview — sidebar flies from left, main from right, they join
gsap.set('.admin-sidebar', { x: '-100%' })
gsap.set('.admin-main',    { x: '100%' })

gsap.timeline({
  delay: 0.3,
  scrollTrigger: { trigger: '#preview .admin-preview', start: 'top 78%', once: true },
})
  // Both panels fly in simultaneously and lock together
  .to(['.admin-sidebar', '.admin-main'], {
    x: 0, duration: 0.45, ease: 'power3.out',
  })
  // Sidebar internals stagger in from the left
  .fromTo(
    ['.admin-sidebar-logo', '.admin-sidebar-label', '.admin-sidebar-item'],
    { opacity: 0, x: -10 },
    { opacity: 1, x: 0, duration: 0.2, stagger: 0.04, ease: 'power2.out' },
    '-=0.2',
  )
  // Main header + toolbar fade down
  .fromTo(
    ['.admin-main-header', '.admin-toolbar'],
    { opacity: 0, y: -8 },
    { opacity: 1, y: 0, duration: 0.18, stagger: 0.06, ease: 'power2.out' },
    '-=0.3',
  )
  // Table rows stagger up
  .fromTo(
    '#adminRows tr',
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.18, stagger: 0.05, ease: 'power2.out' },
    '-=0.1',
  )
  // Pagination fades in last
  .fromTo(
    '.admin-pagination',
    { opacity: 0 },
    { opacity: 1, duration: 0.15 },
    '-=0.05',
  )
