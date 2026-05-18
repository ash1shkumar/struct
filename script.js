marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
});
mermaid.initialize({ startOnLoad: false, theme: 'neutral' });

// ─── THEME ───
function toggleTheme() {
  const html = document.documentElement;
  if (html.classList.contains('dark')) {
    html.classList.remove('dark'); html.classList.add('light');
    localStorage.setItem('theme', 'light');
    mermaid.initialize({ theme: 'neutral' });
  } else {
    html.classList.remove('light'); html.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    mermaid.initialize({ theme: 'dark' });
  }
}
(function () {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.classList.add(saved);
  mermaid.initialize({ startOnLoad: false, theme: saved === 'dark' ? 'dark' : 'neutral' });
})();

// ─── NAVBAR ACTIVE STATE ───
const sections = document.querySelectorAll('.section-target');
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => { if (pageYOffset >= s.offsetTop - 100) current = s.getAttribute('id'); });
  navLinks.forEach(l => { l.classList.remove('active'); if (l.getAttribute('href').includes(current)) l.classList.add('active'); });
});

// ─── COPY INSTALL ───
function copyInstall() {
  const text = 'npm install struct-ai';
  function onCopied() {
    const btn = document.getElementById('copyBtn');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    btn.style.borderColor = 'var(--green)';
    btn.style.color = 'var(--green)';
    setTimeout(() => {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
      btn.style.borderColor = ''; btn.style.color = '';
    }, 2000);
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(onCopied).catch(() => fallbackCopy(text, onCopied));
  } else {
    fallbackCopy(text, onCopied);
  }
}

function fallbackCopy(text, cb) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); cb(); } catch (e) { console.error('Copy failed', e); }
  document.body.removeChild(ta);
}

// ─── IMPORT TABS ───
const importTabs = document.querySelectorAll('.import-tab');
const importPanes = document.querySelectorAll('.import-pane');
let activeImportMethod = 'github';
importTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    importTabs.forEach(t => t.classList.remove('active'));
    importPanes.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.getAttribute('data-target')).classList.add('active');
    activeImportMethod = tab.getAttribute('data-target').replace('pane-', '');
  });
});

// ─── DRAG & DROP ───
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('zipUpload');
if (dropZone) {
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
  dropZone.addEventListener('drop', e => {
    e.preventDefault(); dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files; updateFileName(fileInput);
    }
  });
  fileInput.addEventListener('change', () => updateFileName(fileInput));
}
function updateFileName(input) {
  const display = document.getElementById('fileNameDisplay');
  display.textContent = input.files && input.files[0] ? input.files[0].name : 'Select or drop a .zip file';
}

// ─── LOADER ───
const loaderStates = [
  "Parsing codebase syntax...",
  "Extracting API routes...",
  "Mapping dependencies...",
  "Writing README...",
  "Finalizing documentation..."
];
let loaderInterval;
function startLoader() {
  const loader = document.getElementById('aiLoader');
  const textSpan = document.getElementById('loaderText');
  loader.classList.add('active');
  let idx = 0; textSpan.textContent = loaderStates[idx];
  loaderInterval = setInterval(() => {
    idx = (idx + 1) % loaderStates.length;
    textSpan.textContent = loaderStates[idx];
  }, 2500);
}
function stopLoader() {
  clearInterval(loaderInterval);
  document.getElementById('aiLoader').classList.remove('active');
}

// ─── STYLE PILLS ───
let readmeOutput = '';
let activeStyle = 'concise';
document.querySelectorAll('#styleRow .opt-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#styleRow .opt-pill').forEach(b => b.classList.remove('on'));
    btn.classList.add('on'); activeStyle = btn.dataset.style;
  });
});

// ─── RENDER README ───
async function renderReadme(markdown) {
  const outBox = document.getElementById('fullOut');
  outBox.innerHTML = marked.parse(markdown);

  // Convert mermaid code blocks and render each independently
  const mermaidBlocks = outBox.querySelectorAll('code.language-mermaid');
  for (const block of mermaidBlocks) {
    const rawCode = block.textContent.trim();
    const pre = block.parentElement;
    // Replace with a clean wrapper containing raw text — don't let mermaid touch it yet
    const wrapper = document.createElement('div');
    wrapper.dataset.mermaidSrc = rawCode;
    wrapper.style.cssText = 'margin:1rem 0;';
    pre.replaceWith(wrapper);
  }

  // Now try to render each wrapper individually
  for (const wrapper of outBox.querySelectorAll('[data-mermaid-src]')) {
    const rawCode = wrapper.dataset.mermaidSrc;
    const mermaidEl = document.createElement('div');
    mermaidEl.className = 'mermaid';
    mermaidEl.textContent = rawCode;

    // Clone wrapper position before we try rendering
    wrapper.appendChild(mermaidEl);

    try {
      await mermaid.run({ nodes: [mermaidEl] });
      // Success — clean up the data attribute
      delete wrapper.dataset.mermaidSrc;
    } catch (e) {
      // Failed — remove the partially-rendered mermaid node and show clean code
      wrapper.innerHTML = '';
      const pre = document.createElement('pre');
      pre.style.cssText = 'font-family:var(--mono);font-size:12px;padding:1rem;background:var(--bg-secondary);border:1px solid var(--border);border-radius:6px;overflow-x:auto;color:var(--fg-muted);white-space:pre-wrap;';
      pre.textContent = rawCode;
      wrapper.appendChild(pre);
    }
  }
}

// ─── COPY OUTPUT ───
function copyOutput() {
  if (!readmeOutput) return;
  const btn = document.getElementById('copyOutputBtn');
  function onDone() {
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied`;
    btn.classList.add('success');
    setTimeout(() => {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy`;
      btn.classList.remove('success');
    }, 2000);
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(readmeOutput).then(onDone).catch(() => fallbackCopy(readmeOutput, onDone));
  } else {
    fallbackCopy(readmeOutput, onDone);
  }
}

// ─── DOWNLOAD OUTPUT ───
function downloadOutput() {
  if (!readmeOutput) return;
  const blob = new Blob([readmeOutput], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'README.md';
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─── GENERATE DOCS ───
async function generateDocs() {
  const btn = document.getElementById('fullGenBtn');
  const out = document.getElementById('fullOut');
  const resultContainer = document.getElementById('resultContainer');
  const formData = new FormData();
  formData.append('style', activeStyle);

  if (activeImportMethod === 'github') {
    const url = document.getElementById('githubUrl').value;
    if (!url) return alert('Please enter a GitHub URL.');
    alert('GitHub direct import works via CLI. For the web demo, please use ZIP Upload or Paste Code.');
    return;
  } else if (activeImportMethod === 'zip') {
    if (!fileInput.files || fileInput.files.length === 0) return alert('Please upload a ZIP file first.');
    formData.append('projectZip', fileInput.files[0]);
  } else if (activeImportMethod === 'paste') {
    const text = document.getElementById('rawCodeInput').value;
    if (!text.trim()) return alert('Please paste some code first.');
    formData.append('rawCode', text);
  }

  resultContainer.style.display = 'block';
  out.innerHTML = '';
  btn.disabled = true; btn.innerText = 'Generating...';
  startLoader();

  try {
    const res = await fetch('http://localhost:3000/api/generate-project', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    readmeOutput = data.readme || '';
    stopLoader();
    await renderReadme(readmeOutput);
  } catch (e) {
    console.error(e); stopLoader();
    out.innerHTML = `<span style="color:red;font-size:13px;">Error: ${e.message || 'Check server connection.'}</span>`;
  }

  btn.disabled = false; btn.innerText = 'Generate Documentation';
}

// ─── FEATURES AUTO-CYCLE ───
const featTitles = ['ast-parser.js', 'api-extractor.js', 'struct.yml', 'dep-graph.js', 'export.sh', 'edge-detector.js'];
const featBlocks = document.querySelectorAll('.feat-block');
const featPanels = document.querySelectorAll('.window-panel');
let currentFeat = 0;
let featTimer = null;

function activateFeat(idx) {
  featBlocks.forEach(b => b.classList.remove('active'));
  featPanels.forEach(p => p.classList.remove('active'));
  featBlocks[idx].classList.add('active');
  featPanels[idx].classList.add('active');
  document.getElementById('windowTitle').textContent = featTitles[idx];
  currentFeat = idx;
}

function startFeatCycle() {
  clearInterval(featTimer);
  featTimer = setInterval(() => {
    activateFeat((currentFeat + 1) % featBlocks.length);
  }, 3000);
}

featBlocks.forEach(block => {
  block.addEventListener('click', () => {
    activateFeat(parseInt(block.dataset.feat));
    startFeatCycle();
  });
});

startFeatCycle();