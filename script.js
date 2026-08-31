const introBoard = document.querySelector('.intro-board');
const portfolio = document.querySelector('.portfolio-word');
const portfolioChars = [...portfolio.querySelectorAll('span')];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// These are direct PNG exports from the corresponding Figma frames. Several
// frames belong to one project and are shown in the same top-to-bottom order
// as the canvas. AI Movie uses the two new Figma exports (Frame 32 and Frame 33).
const projectImages = {
  about: [],
  internship1: ['frame8.png', 'frame9.png', 'frame24.png', 'frame25.png'],
  layout: ['frame26.png', 'frame27.png', 'frame28.png', 'frame29.png'],
  internship2: ['frame31.png'],
  brand: ['frame30.png'],
  aiMovie: ['frame32.png', 'frame33.png']
};
const projectNavTop = {
  // Updated from the current Figma frame geometry (thumbnail strip begins
  // at the Div Bottom y-position in each export).
  frame8: 11.51, frame9: 13.19, frame24: 13.01, frame25: 13.01,
  // Re-synced from the latest Figma Frame 26–29 canvas: Div 1 + Div Bottom
  // gives the actual strip y-position for each differently sized page.
  frame26: 34.67, frame27: 34.58, frame28: 19.97, frame29: 26.57,
  frame31: 19.75, frame30: 16.95,
  // Frame 32/33 values are derived from the Figma Div 1 + Div Bottom bounds.
  frame32: 31.0449, frame33: 18.0972
};
const projectNavHeight = {
  frame8: 2.95, frame9: 3.30, frame24: 3.34, frame25: 3.34,
  frame26: 6.23, frame27: 6.06, frame28: 3.59, frame29: 4.87,
  frame31: 3.25, frame30: 3.25,
  frame32: 6.0450, frame33: 4.3067
};
const projectNavLeft = {
  // Frame 8/9/24/25 use Div 1 x=163 in the current Figma file.
  frame8:  [8.42, 24.00, 37.18, 50.37, 63.55, 76.73],
  frame9:  [8.42, 21.55, 36.78, 49.96, 63.15, 76.34],
  frame24: [8.42, 21.55, 34.67, 50.25, 63.73, 76.76],
  frame25: [8.42, 21.55, 34.67, 47.66, 63.73, 76.76],
  frame26: [8.42, 25.73, 40.38, 55.08],
  frame27: [8.42, 23.01, 39.93, 54.58],
  frame28: [8.42, 23.01, 37.59, 54.90],
  frame29: [8.42, 23.01, 37.59, 52.02],
  frame31: [3.82, 21.14, 35.78, 50.44, 65.08, 79.73],
  frame30: [3.82, 21.14, 35.78, 50.44, 65.08, 79.73],
  frame32: [8.42, 24.00],
  frame33: [8.42, 21.55]
};
const projectNavWidth = {
  frame8: [14.40, 12.00, 12.00, 12.00, 12.00, 12.00],
  frame9: [11.95, 14.03, 12.00, 12.00, 12.00, 12.00],
  frame24:[11.95, 11.93, 14.40, 12.00, 12.00, 12.00],
  frame25:[11.95, 11.93, 11.81, 14.40, 12.00, 12.00],
  frame26:[16.00, 13.33, 13.33, 13.33],
  frame27:[13.27, 15.59, 13.33, 13.33],
  frame28:[13.27, 13.26, 16.00, 13.33],
  frame29:[13.27, 13.26, 13.12, 16.00],
  frame31:[16.00, 13.33, 13.33, 13.33, 13.33, 13.33],
  frame30:[16.00, 13.33, 13.33, 13.33, 13.33, 13.33],
  frame32:[14.40, 12.00],
  frame33:[11.95, 14.03]
};
// Transparent link hotspots preserve the Figma-rendered typography while
// making the two underlined title treatments interactive like the source.
const projectLinkHotspots = {
  frame32: {
    href: 'https://youtu.be/LaKVxmCeK_U',
    label: 'Open FEAR MACHINE on YouTube',
    top: 22.6898, left: 37.1901, width: 28.3574, height: 2.0174
  },
  frame33: {
    href: 'https://youtu.be/xefTge20-I0',
    label: 'Open SPRING MESSAGERS on YouTube',
    top: 8.5592, left: 8.3678, width: 38.2231, height: 1.4741
  }
};
const projectViewer = document.querySelector('.project-viewer');
const projectScroll = document.querySelector('.project-scroll');
const projectClose = document.querySelector('.project-close');
const contentHits = [...document.querySelectorAll('.content-hit:not(:disabled)')];
const contentBoard = document.querySelector('.content-board');
const projectImageReady = new Map();
let projectFrameRequest = 0;
let projectCloseTimer = 0;
const projectAssetVersion = 'figma-ai-movie-2';

function preloadProjectImage(name) {
  if (projectImageReady.has(name)) return projectImageReady.get(name);
  const image = new Image();
  image.src = `assets/projects/${name}?v=${projectAssetVersion}`;
  const ready = image.decode
    ? image.decode().catch(() => new Promise(resolve => image.addEventListener('load', resolve, { once: true })))
    : new Promise(resolve => image.addEventListener('load', resolve, { once: true }));
  projectImageReady.set(name, ready);
  return ready;
}

// Hovering a content category previews the black first-screen composition of
// that Figma project behind the receipt. These are separate exports from the
// project pages, rather than the long detail-page canvases.
const projectPreviewImages = {
  internship1: 'frame8-home-bw.png',
  layout: 'frame26-home-bw.png',
  internship2: 'frame31-home-bw.png',
  brand: 'frame30-home-bw.png',
  aiMovie: 'frame32-home-bw.png'
};

function setContentPreview(projectKey) {
  const previewImage = projectPreviewImages[projectKey];
  if (!previewImage) {
    contentBoard.classList.remove('has-preview');
    contentBoard.style.removeProperty('--content-preview-image');
    delete contentBoard.dataset.previewProject;
    return;
  }
  preloadProjectImage(previewImage);
  // Start fetching the first detail frame while the visitor is deciding
  // which category to open. This removes the apparent dead time on the
  // larger exported Figma canvases without loading every project up front.
  const firstDetailImage = projectImages[projectKey]?.[0];
  if (firstDetailImage) preloadProjectImage(firstDetailImage);
  contentBoard.style.setProperty('--content-preview-image', `url("assets/projects/${previewImage}?v=${projectAssetVersion}")`);
  contentBoard.dataset.previewProject = projectKey;
  contentBoard.classList.add('has-preview');
}

function clearContentPreview() {
  contentBoard.classList.remove('has-preview');
  contentBoard.style.removeProperty('--content-preview-image');
  delete contentBoard.dataset.previewProject;
}

function closeProject() {
  projectFrameRequest += 1;
  window.clearTimeout(projectCloseTimer);
  projectViewer.classList.remove('is-open');
  projectViewer.classList.remove('is-preparing');
  projectViewer.classList.remove('is-loading');
  projectViewer.classList.add('is-closing');
  projectViewer.setAttribute('aria-hidden', 'true');
  // Let the already rendered Figma frame dissolve over the content page.
  // Clearing it immediately was the last source of an all-white frame while
  // closing the viewer.
  projectCloseTimer = window.setTimeout(() => {
    projectViewer.classList.remove('is-closing');
    projectScroll.replaceChildren();
    document.body.classList.remove('project-open');
  }, 240);
}

async function openProject(projectKey) {
  if (projectKey === 'about') {
    closeProject();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const images = projectImages[projectKey] || [];
  window.clearTimeout(projectCloseTimer);
  projectViewer.classList.remove('is-closing');
  // Start caching every page in this Figma project while its first frame is
  // displayed, so thumbnail navigation does not wait for a network decode.
  images.forEach(preloadProjectImage);
  // Show immediate click feedback while the first export decodes. The
  // loading state is intentionally lightweight; the current canvas is never
  // removed until the incoming Figma export is ready, so page switches stay
  // free of white flashes.
  projectViewer.classList.remove('is-preparing');
  projectViewer.classList.add('is-open', 'is-loading');
  projectViewer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('project-open');
  projectScroll.scrollTop = 0;
  await showProjectFrame(projectKey, images, 0);
  projectViewer.classList.remove('is-loading');
  projectScroll.focus({ preventScroll: true });
}

async function showProjectFrame(projectKey, images, index) {
  const name = images[index];
  if (!name) return;
  const requestId = ++projectFrameRequest;
  // Never remove the currently visible canvas until the next export is fully
  // decoded. This is what eliminates the white loading flash on a switch.
  await preloadProjectImage(name);
  if (requestId !== projectFrameRequest ||
      (!projectViewer.classList.contains('is-open') && !projectViewer.classList.contains('is-preparing'))) return;

  // The exported image filenames include ".png", while the Figma-derived
  // coordinate table is keyed by the frame ID itself (for example, frame9).
  // Keep the artwork filename intact and use the normalized ID for hotspots.
  const frameId = name.replace(/\.[^.]+$/, '');
  const layer = document.createElement('div');
  layer.className = 'project-layer';
  const canvas = document.createElement('div');
  canvas.className = 'project-canvas';
  const img = document.createElement('img');
  img.src = `assets/projects/${name}?v=${projectAssetVersion}`;
  img.alt = `${projectKey} project frame ${index + 1}`;
  img.loading = 'eager';
  canvas.append(img);

  const linkHotspot = projectLinkHotspots[frameId];
  if (linkHotspot) {
    const link = document.createElement('a');
    link.className = 'project-link-hotspot';
    link.href = linkHotspot.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.ariaLabel = linkHotspot.label;
    link.style.setProperty('--link-top', `${linkHotspot.top}%`);
    link.style.setProperty('--link-left', `${linkHotspot.left}%`);
    link.style.setProperty('--link-width', `${linkHotspot.width}%`);
    link.style.setProperty('--link-height', `${linkHotspot.height}%`);
    canvas.append(link);
  }

  // The thumbnail strip is part of every exported Figma frame. Transparent
  // hotspots preserve the exact artwork while making those designed thumbnails
  // switch between the horizontally arranged frames from the canvas.
  if (images.length > 1) {
    images.forEach((_, thumbIndex) => {
      const hit = document.createElement('button');
      hit.className = 'project-thumb-hit';
      hit.type = 'button';
      hit.ariaLabel = `Show frame ${thumbIndex + 1}`;
      hit.style.setProperty('--nav-top', `${projectNavTop[frameId] ?? 0}%`);
      hit.style.setProperty('--nav-left', `${projectNavLeft[frameId]?.[thumbIndex] ?? 3.82}%`);
      hit.style.setProperty('--nav-width', `${projectNavWidth[frameId]?.[thumbIndex] ?? 13.3}%`);
      hit.style.setProperty('--nav-height', `${projectNavHeight[frameId] ?? 3.25}%`);
      hit.addEventListener('click', () => showProjectFrame(projectKey, images, thumbIndex));
      canvas.append(hit);
    });
  }
  layer.append(canvas);
  projectScroll.append(layer);
  // Images can be decoded before the browser has performed layout for the
  // newly inserted canvas. Reading offsetHeight at that moment may return 0
  // (most visible with the tall AI Movie Frame 33 export), which clips the
  // entire incoming layer. Derive the layer height from the Figma export's
  // intrinsic aspect ratio instead.
  const syncLayerHeight = () => {
    if (!img.naturalWidth || !img.naturalHeight) return;
    const canvasWidth = canvas.getBoundingClientRect().width || projectScroll.clientWidth;
    if (canvasWidth) layer.style.height = `${canvasWidth * img.naturalHeight / img.naturalWidth}px`;
  };
  if (img.complete) syncLayerHeight();
  else img.addEventListener('load', syncLayerHeight, { once: true });

  const currentLayer = projectScroll.querySelector('.project-layer:not(.is-incoming)');
  if (!currentLayer || currentLayer === layer) {
    projectScroll.replaceChildren(layer);
    return;
  }

  // Crossfade the already rendered Figma export with the decoded next export.
  // The original canvas remains in the document until the incoming image is
  // opaque, preventing an empty white intermediate frame.
  projectScroll.scrollTop = 0;
  layer.classList.add('is-incoming');
  requestAnimationFrame(() => layer.classList.add('is-visible'));
  window.setTimeout(() => {
    if (requestId !== projectFrameRequest) return;
    layer.classList.remove('is-incoming', 'is-visible');
    projectScroll.replaceChildren(layer);
  }, 360);
}

contentHits.forEach(button => {
  button.addEventListener('click', () => openProject(button.dataset.project));
  button.addEventListener('pointerenter', () => setContentPreview(button.dataset.project));
  button.addEventListener('focus', () => setContentPreview(button.dataset.project));
  button.addEventListener('pointerleave', clearContentPreview);
  button.addEventListener('blur', clearContentPreview);
  button.addEventListener('mouseenter', () => setContentPreview(button.dataset.project));
  button.addEventListener('mouseleave', clearContentPreview);
});
projectClose.addEventListener('click', closeProject);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && projectViewer.classList.contains('is-open')) closeProject(); });

// TextPressure-style deformation, idle state remains identical to Figma.
let pointer = { x: 0, y: 0 };
let easedPointer = { x: 0, y: 0 };
let pressureActive = false;
let lastPointer = null;

function resetPressure() {
  portfolioChars.forEach(char => {
    char.style.setProperty('--pressure-x', '1');
    char.style.setProperty('--pressure-y', '1');
    char.style.setProperty('--pressure-skew', '0deg');
    char.style.fontWeight = '';
  });
}

function animatePressure() {
  if (pressureActive) {
    easedPointer.x += (pointer.x - easedPointer.x) / 10;
    easedPointer.y += (pointer.y - easedPointer.y) / 10;
    const titleRect = portfolio.getBoundingClientRect();
    const maxDistance = titleRect.width / 2;

    portfolioChars.forEach(char => {
      const rect = char.getBoundingClientRect();
      const distance = Math.hypot(easedPointer.x - (rect.left + rect.width / 2), easedPointer.y - (rect.top + rect.height / 2));
      const amount = Math.max(0, 1 - distance / maxDistance);
      char.style.setProperty('--pressure-x', (0.5 + amount * 1.4).toFixed(3));
      char.style.setProperty('--pressure-y', (0.82 + amount * 0.34).toFixed(3));
      char.style.setProperty('--pressure-skew', `${(-amount * 17).toFixed(2)}deg`);
      char.style.fontWeight = Math.round(220 + amount * 700);
    });
  }
  requestAnimationFrame(animatePressure);
}

function splitText(element) {
  [...element.childNodes].forEach(node => {
    if (node.nodeType !== Node.TEXT_NODE) return;
    let text = node.textContent.replace(/\s+/g, ' ');
    if (!node.previousSibling || node.previousSibling.nodeName === 'BR') text = text.trimStart();
    if (!node.nextSibling || node.nextSibling.nodeName === 'BR') text = text.trimEnd();
    const fragment = document.createDocumentFragment();
    [...text].forEach(char => {
      const span = document.createElement('span');
      span.className = 'text-anim-char';
      span.textContent = char === ' ' ? '\u00a0' : char;
      fragment.append(span);
    });
    node.replaceWith(fragment);
  });
}

const reveals = [...document.querySelectorAll('.scroll-reveal')];
reveals.forEach(splitText);
reveals.forEach(element => element.classList.add('is-prepared'));

function revealParagraph(index) {
  const element = reveals[index];
  [...element.querySelectorAll('.text-anim-char')].forEach((char, characterIndex) => {
    char.style.transitionDelay = `${characterIndex * 28}ms`;
  });
  requestAnimationFrame(() => element.classList.add('is-revealed'));
}

let scrollStage = 0;
let ignoreWheelUntil = 0;
const gesturePause = 360;

function setIntroStage(stage) {
  introBoard.classList.remove('stage-0', 'stage-1', 'stage-2');
  introBoard.classList.add(`stage-${stage}`);
}

function stageScroll(event) {
  if (projectViewer?.classList.contains('is-open')) return;
  if (event.deltaY <= 0) return;

  // Consume momentum from the current gesture. A fresh mouse/trackpad gesture
  // is required for each reveal and for leaving the introduction.
  if (performance.now() < ignoreWheelUntil) {
    event.preventDefault();
    return;
  }

  if (scrollStage === 0) {
    event.preventDefault();
    setIntroStage(1);
    revealParagraph(0);
    scrollStage = 1;
    ignoreWheelUntil = performance.now() + gesturePause;
    return;
  }
  if (scrollStage === 1) {
    event.preventDefault();
    setIntroStage(2);
    revealParagraph(1);
    scrollStage = 2;
    ignoreWheelUntil = performance.now() + gesturePause;
    return;
  }

  // This is the third distinct scroll: let the browser perform its normal
  // page scroll, revealing the sticker page.
  window.removeEventListener('wheel', stageScroll);
}

if (prefersReducedMotion) {
  setIntroStage(2);
  reveals.forEach(element => element.classList.add('is-revealed'));
} else {
  window.addEventListener('wheel', stageScroll, { passive: false });
  window.addEventListener('pointermove', event => {
    const boardRect = introBoard.getBoundingClientRect();
    const isOnHomepage = event.clientX >= boardRect.left && event.clientX <= boardRect.right && event.clientY >= boardRect.top && event.clientY <= boardRect.bottom;
    const deltaX = lastPointer ? event.clientX - lastPointer.x : 0;
    const deltaY = lastPointer ? event.clientY - lastPointer.y : 0;
    lastPointer = { x: event.clientX, y: event.clientY };

    // A horizontal movement anywhere on the opening frame drives the word,
    // while vertical browsing movements leave the Figma layout untouched.
    const isHorizontalSwipe = isOnHomepage && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) >= 1;
    if (!isHorizontalSwipe) {
      if (pressureActive) resetPressure();
      pressureActive = false;
      return;
    }
    const portfolioRect = portfolio.getBoundingClientRect();
    pointer = { x: event.clientX, y: portfolioRect.top + portfolioRect.height / 2 };
    if (!pressureActive) easedPointer = { ...pointer };
    pressureActive = true;
  }, { passive: true });
  requestAnimationFrame(animatePressure);
}
