/* ==========================================================================
   AS.DEPT Retro-Futuristic CRT & Chrome Portfolio - Main Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initInteractiveClouds();
  initChrome3DLogo();
  initNavigationScrollHighlight();
  initProjectModals();
  initContactForm();
});

/* ==========================================================================
   1. Interactive 3D Metallic Chrome Logo Engine (Vanilla Canvas 3D)
   ========================================================================== */
function initChrome3DLogo() {
  const canvas = document.getElementById('canvas-logo');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width;
  let height = canvas.height;
  
  // 3D coordinates system variables
  let rx = 0.3; // rotation angles
  let ry = 0.5;
  let rz = 0;
  
  let targetSpeedX = 0.005;
  let targetSpeedY = 0.01;
  let speedX = 0.005;
  let speedY = 0.01;

  let mouse = { x: 0, y: 0 };
  
  // Track mouse coordinates on canvas to alter speed/reflection angles
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - (rect.width / 2);
    const y = e.clientY - rect.top - (rect.height / 2);
    
    // Dynamically alter rotation targets based on cursor
    targetSpeedX = y * 0.00008;
    targetSpeedY = x * 0.00008;
  });

  window.addEventListener('mouseleave', () => {
    targetSpeedX = 0.004;
    targetSpeedY = 0.008;
  });

  // Mathematically define 3D vertices for a hollow silver circular ring (Emblem)
  // Two parallel circles offset along the Z axis, with interconnecting ribs.
  const numPoints = 24;
  const radius = 100;
  const depth = 28;
  const vertices = [];
  const faces = [];

  // Circle 1 (front face)
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * (radius * 0.65); // Slightly squished oval look to match references
    vertices.push({ x, y, z: -depth / 2 });
  }

  // Circle 2 (back face)
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const x = Math.cos(angle) * (radius * 0.95);
    const y = Math.sin(angle) * (radius * 0.62);
    vertices.push({ x, y, z: depth / 2 });
  }

  // Inner Cutout Circle (front)
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const x = Math.cos(angle) * (radius * 0.55);
    const y = Math.sin(angle) * (radius * 0.35);
    vertices.push({ x, y, z: -depth / 2 });
  }

  // Inner Cutout Circle (back)
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const x = Math.cos(angle) * (radius * 0.52);
    const y = Math.sin(angle) * (radius * 0.33);
    vertices.push({ x, y, z: depth / 2 });
  }

  // Connect Vertices to form Quad Polygons (Faces)
  // Outer cylindrical rim faces
  for (let i = 0; i < numPoints; i++) {
    const next = (i + 1) % numPoints;
    faces.push({
      indices: [i, next, next + numPoints, i + numPoints],
      type: 'rim'
    });
  }

  // Inner cylindrical rim faces
  const startInnerFront = numPoints * 2;
  const startInnerBack = numPoints * 3;
  for (let i = 0; i < numPoints; i++) {
    const next = (i + 1) % numPoints;
    faces.push({
      indices: [i + startInnerFront, next + startInnerFront, next + startInnerBack, i + startInnerBack],
      type: 'inner-rim'
    });
  }

  // Front solid ring face
  for (let i = 0; i < numPoints; i++) {
    const next = (i + 1) % numPoints;
    faces.push({
      indices: [i, next, next + startInnerFront, i + startInnerFront],
      type: 'front'
    });
  }

  // Projection math: 3D -> 2D
  function project(vertex, rx, ry, rz) {
    // 3D rotations on X, Y, Z axes
    // Rotate Y
    let x1 = vertex.x * Math.cos(ry) - vertex.z * Math.sin(ry);
    let z1 = vertex.x * Math.sin(ry) + vertex.z * Math.cos(ry);

    // Rotate X
    let y2 = vertex.y * Math.cos(rx) - z1 * Math.sin(rx);
    let z2 = vertex.y * Math.sin(rx) + z1 * Math.cos(rx);

    // Rotate Z
    let x3 = x1 * Math.cos(rz) - y2 * Math.sin(rz);
    let y3 = x1 * Math.sin(rz) + y2 * Math.cos(rz);

    // Perspective projection
    const distance = 350;
    const scale = 250;
    const fov = scale / (distance + z2);
    
    return {
      x: x3 * fov + width / 2,
      y: y3 * fov + height / 2,
      z: z2 // keep depth value for back-to-front sorting (painters algorithm)
    };
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Interpolate speed
    speedX += (targetSpeedX - speedX) * 0.05;
    speedY += (targetSpeedY - speedY) * 0.05;
    rx += speedX;
    ry += speedY;
    rz += 0.002;

    // Project all vertices
    const projected = vertices.map(v => project(v, rx, ry, rz));

    // Calculate face depths
    faces.forEach(f => {
      let sumZ = 0;
      f.indices.forEach(idx => {
        sumZ += projected[idx].z;
      });
      f.depth = sumZ / f.indices.length;
    });

    // Sort faces (Painter's algorithm: draw back faces first)
    faces.sort((a, b) => b.depth - a.depth);

    // Draw faces
    faces.forEach(f => {
      ctx.beginPath();
      ctx.moveTo(projected[f.indices[0]].x, projected[f.indices[0]].y);
      for (let i = 1; i < f.indices.length; i++) {
        ctx.lineTo(projected[f.indices[i]].x, projected[f.indices[i]].y);
      }
      ctx.closePath();

      // Create Chrome Silver metallic reflectivity gradient
      // Angle gradients representing ambient sky-cloud reflection highlights
      const grad = ctx.createLinearGradient(width / 2 - 120, height / 2 - 120, width / 2 + 120, height / 2 + 120);
      
      // Metallic color stops: chrome reflection alternates white, grey, silver and dark chrome blue
      grad.addColorStop(0.0, '#ffffff');
      grad.addColorStop(0.15, '#c8d4df');
      grad.addColorStop(0.3, '#8ea3b5');
      grad.addColorStop(0.45, '#ffffff');
      grad.addColorStop(0.6, '#3e5870'); // Dark sky-blue chrome reflection
      grad.addColorStop(0.8, '#a2b4c5');
      grad.addColorStop(1.0, '#ffffff');

      ctx.fillStyle = grad;
      ctx.fill();

      // Industrial border lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(14, 32, 48, 0.4)';
      ctx.stroke();
    });

    // Draw stylized AS letter overlays inside the chrome canvas center for branding
    ctx.font = "bold 32px 'Space Grotesk'";
    ctx.fillStyle = "rgba(14, 32, 48, 0.75)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("AS", width / 2, height / 2);

    requestAnimationFrame(draw);
  }

  draw();
}

/* ==========================================================================
   2. Scroll Trigger highlights for Navigation Links
   ========================================================================== */
function initNavigationScrollHighlight() {
  const sections = document.querySelectorAll('section');
  const navItems = document.querySelectorAll('.nav-item');

  const options = {
    root: null,
    rootMargin: '-50% 0px -50% 0px', // Trigger highlight when section is centered
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        
        navItems.forEach(item => {
          if (item.getAttribute('href') === `#${id}`) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }
    });
  }, options);

  sections.forEach(sec => observer.observe(sec));
}

/* ==========================================================================
   3. Telemetry Side Drawer Panel & Database
   ========================================================================== */
const projectDetailsDB = {
  "scribe": {
    title: "Scribe AI",
    tag: "AI / COLLABORATION",
    desc: "Scribe AI is a premium writing platform for developers and creators. It integrates complex multi-agent layers directly with collaborative document writing, turning standard text spaces into collaborative AI pair rooms.",
    features: [
      "Dynamic prompt completion using Gemini context caches.",
      "Multiplayer collaboration loops utilizing WebSockets.",
      "Real-time semantic search and automated code/text translations."
    ],
    tech: ["React", "Node.js", "Express", "Vite", "Gemini API", "WebSockets"],
    imageText: "SCRIBE_AI // CORE_ENGINE",
    telemetry: {
      latency: "45ms",
      coverage: "94.2%",
      health: "ACTIVE"
    },
    aiSummary: "Ashutosh engineered the WebSocket collaborative layers and optimized Gemini token-streaming pipelines to lower interface lag below 50ms, resolving major real-time sync hurdles."
  },
  "quantum": {
    title: "Quantum Ledger",
    tag: "WEB3 / ANALYTICS",
    desc: "Quantum Ledger provides real-time analytics for smart contract developers. By pulling live event logs straight from blockchain nodes, it indexes telemetry data to display transaction histories, gas usage optimizations, and system errors.",
    features: [
      "Decentralized node connections with fallback providers.",
      "Optimized charts plotting live contract telemetry.",
      "Smart-contract vulnerability auditing helpers."
    ],
    tech: ["HTML5 Canvas", "Ethers.js", "Web3.js", "Node.js", "Chart.js"],
    imageText: "QUANTUM_LEDGER // TELEMETRY",
    telemetry: {
      latency: "112ms",
      coverage: "88.6%",
      health: "SYNCED"
    },
    aiSummary: "Ashutosh developed the modular Ethers.js integration for telemetry indexing and constructed the high-performance HTML5 Canvas rendering engine for smooth real-time transaction updates."
  },
  "neuroflow": {
    title: "NeuroFlow",
    tag: "PYTHON / AI TOOLS",
    desc: "NeuroFlow allows engineers to design complex multi-agent systems via a visual, canvas-based block editor. Connect models, define logic triggers, and deploy full agent systems with zero setup.",
    features: [
      "Custom node editor using canvas and SVG connectors.",
      "Real-time step-by-step model execution inspector.",
      "Direct API code generation for Python/JS deployments."
    ],
    tech: ["Python", "PyTorch", "FastAPI", "WebAssembly", "Gemini API"],
    imageText: "NEUROFLOW // ORCHESTRATION",
    telemetry: {
      latency: "28ms",
      coverage: "96.5%",
      health: "NOMINAL"
    },
    aiSummary: "Ashutosh architected the node graph editor engine, allowing visual graph representations of LLM pipelines, and wrote a FastAPI code generator to translate visual layouts into deployable code."
  }
};

function initProjectModals() {
  const modal = document.getElementById('project-detail-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  // Listen to discoveries buttons click
  document.querySelectorAll('.btn-card-detail').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const projId = btn.getAttribute('data-project');
      const data = projectDetailsDB[projId];
      if (data) {
        renderModalContent(data);
        modal.showModal();
      }
    });
  });

  closeBtn.addEventListener('click', () => modal.close());

  // Close if click outside container box
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });
}

function renderModalContent(data) {
  const container = document.getElementById('modal-body-content');
  
  const techPills = data.tech.map(t => `<span class="tech-pill">${t}</span>`).join('');
  const featuresList = data.features.map(f => `<li>${f}</li>`).join('');

  container.innerHTML = `
    <div class="modal-header-section">
      <div class="modal-title-row">
        <h3 class="modal-title">${data.title}</h3>
        <span class="status-dot-pulse" aria-hidden="true"></span>
      </div>
      <div class="modal-meta">
        <span class="project-tag">${data.tag}</span>
      </div>
    </div>
    
    <div class="modal-image">
      <img src="./assets/${data.title.toLowerCase().replace(' ', '_')}.png" alt="${data.title} Mockup Interface" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; background:rgba(255,255,255,0.05);" class="fallback-mockup-graphic">
        <span>[ MOCKUP: ${data.imageText} ]</span>
      </div>
    </div>
    
    <p class="modal-desc">${data.desc}</p>
    
    <div class="drawer-telemetry">
      <div class="telemetry-item">
        <span class="telemetry-lbl">LATENCY</span>
        <span class="telemetry-val">${data.telemetry.latency}</span>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-lbl">COVERAGE</span>
        <span class="telemetry-val">${data.telemetry.coverage}</span>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-lbl">STATUS</span>
        <span class="telemetry-val">${data.telemetry.health}</span>
      </div>
    </div>

    <div class="drawer-ai-summary">
      <div class="ai-summary-header">
        <span>✨ AI ASSESSMENT REPORT</span>
      </div>
      <p class="ai-summary-text">${data.aiSummary}</p>
    </div>
    
    <div class="drawer-features-list">
      <h4>SYSTEM SPECIFICATIONS:</h4>
      <ul>
        ${featuresList}
      </ul>
    </div>
    
    <div class="project-footer">
      ${techPills}
    </div>
    
    <div class="modal-footer">
      <button class="modal-btn" onclick="document.getElementById('project-detail-modal').close()">CLOSE PANEL</button>
      <a href="https://github.com" target="_blank" class="modal-btn primary">VIEW CODEBASE</a>
    </div>
  `;
}

/* ==========================================================================
   4. Secure Contact Terminal packet transmitter simulation
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const successLog = document.getElementById('form-success-log');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit-mono');
    
    btn.disabled = true;
    btn.textContent = "TRANSMITTING...";
    successLog.innerHTML = "<p>// COMPOSING DATA PACKETS...</p>";

    setTimeout(() => {
      successLog.innerHTML += "<p>// ROUTING VIA SECURE GATEWAY...</p>";
      
      setTimeout(() => {
        successLog.innerHTML += "<p>// PACKETS DISPATCHED SUCCESSFULLY. TELEMETRY LOGGED.</p>";
        btn.textContent = "TRANSMIT PACKETS";
        btn.disabled = false;
        form.reset();
      }, 800);
    }, 600);
  });
}

/* ==========================================================================
   5. Cursor-Responsive Interactive Clouds
   ========================================================================== */
function initInteractiveClouds() {
  const clouds = document.querySelectorAll('.interactive-cloud');
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  
  // Vertical upward drift speeds for airplane climb simulation
  const driftSpeeds = [0.4, 0.7, 0.3, 0.55, 0.45, 0.8, 0.35, 0.65, 0.4, 0.6, 0.35, 0.75];
  // Spread positionsX horizontally, and positionsY vertically from bottom upwards
  const positionsX = Array.from(clouds).map(() => Math.random() * (window.innerWidth - 300));
  const positionsY = Array.from(clouds).map((_, i) => (window.innerHeight / 12) * i + Math.random() * 100);

  window.addEventListener('mousemove', (e) => {
    // Normalize coordinates between -1 and 1 relative to screen center
    targetX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
    targetY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
  });

  function update() {
    // Snappier, faster interpolation (easing) for mouse coordinate reaction
    mouseX += (targetX - mouseX) * 0.055;
    mouseY += (targetY - mouseY) * 0.055;

    clouds.forEach((cloud, index) => {
      const depth = parseFloat(cloud.getAttribute('data-depth'));
      
      // Auto vertical upward drift (clouds move from bottom to top)
      positionsY[index] -= driftSpeeds[index];
      
      // Wrap around screen boundaries (reset to bottom when exiting top)
      const cloudHeight = cloud.offsetHeight || 300;
      if (positionsY[index] < -cloudHeight) {
        positionsY[index] = window.innerHeight + 100;
        positionsX[index] = Math.random() * (window.innerWidth - 300); // Randomize horizontal position on reset
      }

      // Parallax shift in cursor direction (high multiplier for fast airplane view displacement)
      const displaceX = mouseX * 280 * depth;
      const displaceY = mouseY * 180 * depth;
      
      // Apply translations using hardware accelerated top/left and translate3d
      cloud.style.left = `${positionsX[index]}px`;
      cloud.style.top = `${positionsY[index]}px`;
      cloud.style.transform = `translate3d(${displaceX}px, ${displaceY}px, 0)`;
    });

    requestAnimationFrame(update);
  }

  update();
}
