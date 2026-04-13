// =============================================
//   ThumbnailChecker — app.js
// =============================================

// ── State ──
let thumbDataURL = null;
let currentTitle = '';

// ── Elements ──
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const thumbPreviewImg = document.getElementById('thumbPreviewImg');
const videoTitleInput = document.getElementById('videoTitle');
const charCounter = document.getElementById('charCounter');
const previewBtn = document.getElementById('previewBtn');
const previewSection = document.getElementById('previewSection');

// ── Platform title character limits ──
// These are approximate limits before YouTube truncates titles on each surface
const platformLimits = [
  { name: 'Desktop Home Feed',    limit: 60 },
  { name: 'Desktop Search Results', limit: 70 },
  { name: 'Desktop Watch Sidebar', limit: 45 },
  { name: 'Mobile Home Feed',     limit: 50 },
  { name: 'Mobile Search Results', limit: 45 },
  { name: 'YouTube TV',           limit: 40 },
  { name: 'Embedded Player',      limit: 55 },
];

// =============================================
//   DRAG & DROP + FILE INPUT
// =============================================

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    loadImage(file);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) loadImage(e.target.files[0]);
});

// Read image file and store as base64 data URL
function loadImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    thumbDataURL = e.target.result;
    thumbPreviewImg.src = thumbDataURL;
    dropZone.classList.add('has-image');
    // Auto-refresh previews if they're already visible
    if (previewSection.style.display !== 'none') {
      updatePreviews();
    }
  };
  reader.readAsDataURL(file);
}

// =============================================
//   TITLE INPUT
// =============================================

videoTitleInput.addEventListener('input', () => {
  const len = videoTitleInput.value.length;
  charCounter.textContent = `${len} / 100`;
  charCounter.className = 'char-counter' + (len > 100 ? ' warn' : '');
  currentTitle = videoTitleInput.value;

  // Live update previews if visible
  if (previewSection.style.display !== 'none') {
    updatePreviews();
  }
  updateSearchDisplays();
});

// Update the simulated search bar text in both desktop and mobile search previews
function updateSearchDisplays() {
  const query = currentTitle ? truncate(currentTitle, 30) : 'your video topic...';
  document.getElementById('search-query-display').textContent = query;
  document.getElementById('mob-search-display').textContent = query;
}

// =============================================
//   PREVIEW BUTTON
// =============================================

previewBtn.addEventListener('click', () => {
  if (!thumbDataURL && !currentTitle) {
    alert('Please upload a thumbnail or enter a title first!');
    return;
  }
  updatePreviews();
  previewSection.style.display = 'block';
  setTimeout(() => {
    previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
});

// =============================================
//   UPDATE ALL PREVIEWS
// =============================================

function updatePreviews() {
  const title = currentTitle || 'Your Video Title';

  // Set thumbnail image in each preview, or show placeholder if no image uploaded
  setThumb('dh-thumb',     'dh-ph');
  setThumb('sr-thumb',     'sr-ph');
  setThumb('sb-thumb',     'sb-ph');
  setThumb('mob-thumb',    'mob-ph');
  setThumb('mob-sr-thumb', 'mob-sr-ph');
  setThumb('tv-thumb',     'tv-ph');

  // Embedded player (slightly different pattern — no placeholder div id, uses inline style)
  const embedImg = document.getElementById('embed-thumb');
  const embedPh  = document.getElementById('embed-ph');
  if (thumbDataURL) {
    embedImg.src = thumbDataURL;
    embedImg.style.display = 'block';
    if (embedPh) embedPh.style.display = 'none';
  } else {
    embedImg.style.display = 'none';
    if (embedPh) embedPh.style.display = 'flex';
  }

  // Set truncated titles per platform
  document.getElementById('dh-title').textContent      = truncate(title, 60);
  document.getElementById('sr-title').textContent      = truncate(title, 70);
  document.getElementById('sb-title').textContent      = truncate(title, 45);
  document.getElementById('mob-title').textContent     = truncate(title, 50);
  document.getElementById('mob-sr-title').textContent  = truncate(title, 45);
  document.getElementById('tv-title').textContent      = truncate(title, 40);
  document.getElementById('embed-title').textContent   = truncate(title, 55);

  updateSearchDisplays();
  buildTitleAnalysis(title);
}

// Helper: show thumbnail image or placeholder icon
function setThumb(imgId, phId) {
  const img = document.getElementById(imgId);
  const ph  = document.getElementById(phId);
  if (thumbDataURL) {
    img.src = thumbDataURL;
    img.style.display = 'block';
    if (ph) ph.style.display = 'none';
  } else {
    img.style.display = 'none';
    if (ph) ph.style.display = 'flex';
  }
}

// =============================================
//   TITLE ANALYSIS BARS
// =============================================

function buildTitleAnalysis(title) {
  const container = document.getElementById('titleAnalysis');
  container.innerHTML = '';
  const len = title.length;

  platformLimits.forEach((platform) => {
    const pct      = Math.min(100, Math.round((len / platform.limit) * 100));
    const isOver   = len > platform.limit;
    const isWarn   = !isOver && pct >= 80;

    let statusText, statusClass, barClass;

    if (isOver) {
      statusText  = `✂️ Truncated at ${platform.limit}`;
      statusClass = 'over';
      barClass    = 'over';
    } else if (isWarn) {
      statusText  = `⚠️ ${len}/${platform.limit} chars`;
      statusClass = 'warn';
      barClass    = 'warn';
    } else {
      statusText  = `✅ ${len}/${platform.limit} chars`;
      statusClass = 'ok';
      barClass    = '';
    }

    const row = document.createElement('div');
    row.className = 'pt-row';
    row.innerHTML = `
      <div class="pt-platform">${platform.name}</div>
      <div class="pt-bar-wrap">
        <div class="pt-bar ${barClass}" style="width:${pct}%"></div>
      </div>
      <div class="pt-status ${statusClass}">${statusText}</div>
    `;
    container.appendChild(row);
  });
}

// =============================================
//   UTILITY
// =============================================

// Truncate a string to a character limit and add ellipsis
function truncate(text, limit) {
  if (!text) return '';
  return text.length > limit ? text.substring(0, limit) + '…' : text;
}