/**
 * Zenitude.ai — 3D Workspace Constellation (Year-at-a-Glance Celestial Map)
 * Three.js 3D Celestial Map with Month Clusters, Pulsating Member Stars & Glass Tooltips
 */
(function (window) {
  'use strict';

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let scene, camera, renderer, galaxyGroup;
  let starMeshes = [];
  let raycaster, mouse;
  let hoveredStar = null;

  async function initConstellation() {
    const container = document.getElementById('constellation-3d-canvas');
    if (!container) return;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 480;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 8, 30);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(-100, -100);

    // Studio Ambient Light
    const amb = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(amb);

    galaxyGroup = new THREE.Group();
    scene.add(galaxyGroup);

    // 1. Orbital Month Cluster Zodiac Ring
    const ringRadius = 14;
    const ringGeo = new THREE.TorusGeometry(ringRadius, 0.05, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B, transparent: true, opacity: 0.35 });
    const orbitRing = new THREE.Mesh(ringGeo, ringMat);
    orbitRing.rotation.x = Math.PI / 2.4;
    galaxyGroup.add(orbitRing);

    // 2. Month Node Beacons
    for (let m = 0; m < 12; m++) {
      const angle = (m / 12) * Math.PI * 2;
      const x = Math.cos(angle) * ringRadius;
      const z = Math.sin(angle) * ringRadius;
      const y = Math.sin(angle * 2) * 1.5;

      const mBeaconGeo = new THREE.OctahedronGeometry(0.5, 0);
      const mBeaconMat = new THREE.MeshStandardMaterial({
        color: 0xEA580C,
        wireframe: true,
        metalness: 0.9,
        roughness: 0.1
      });
      const mBeacon = new THREE.Mesh(mBeaconGeo, mBeaconMat);
      mBeacon.position.set(x, y, z);
      galaxyGroup.add(mBeacon);
    }

    // 3. Ambient Stardust Galaxy Cloud
    const dustCount = 200;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      const rad = 4 + Math.random() * 16;
      const theta = Math.random() * Math.PI * 2;
      dustPos[i] = Math.cos(theta) * rad + (Math.random() - 0.5) * 4;
      dustPos[i + 1] = (Math.random() - 0.5) * 8;
      dustPos[i + 2] = Math.sin(theta) * rad + (Math.random() - 0.5) * 4;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xF59E0B,
      size: 0.3,
      transparent: true,
      opacity: 0.6
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    galaxyGroup.add(dust);

    // 4. Fetch Celebrants & Spawn Glowing Member Stars
    try {
      const res = await fetch('/api/birthdays');
      if (res.ok) {
        const celebrants = await res.json();
        spawnCelebrantStars(celebrants, ringRadius);
      }
    } catch (e) {
      console.warn('Could not load celebrants for constellation', e);
    }

    // Mouse Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotVelX = 0;
    let rotVelY = 0;

    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        rotVelY = deltaX * 0.005;
        rotVelX = deltaY * 0.005;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    });

    // Touch support for mobile
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    });

    container.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - prevMouseX;
        const deltaY = e.touches[0].clientY - prevMouseY;
        rotVelY = deltaX * 0.005;
        rotVelX = deltaY * 0.005;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });

    // Animation Loop
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Inertia & continuous gentle cosmic orbit
      galaxyGroup.rotation.y += (isDragging ? rotVelY : 0.003 + rotVelY);
      galaxyGroup.rotation.x += rotVelX;
      rotVelX *= 0.92;
      rotVelY *= 0.92;

      // Pulsate star beacons
      starMeshes.forEach((star, idx) => {
        const pulse = 1 + Math.sin(elapsed * 2.5 + idx) * 0.15;
        star.scale.setScalar(pulse);
      });

      // Raycasting for Tooltip
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(starMeshes);

      if (intersects.length > 0) {
        const target = intersects[0].object;
        if (hoveredStar !== target) {
          hoveredStar = target;
          container.style.cursor = 'pointer';
          showStarTooltip(target.userData, target.position);
        }
      } else {
        if (hoveredStar) {
          hoveredStar = null;
          container.style.cursor = 'grab';
          hideStarTooltip();
        }
      }

      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
      if (!container) return;
      const w = container.clientWidth || 900;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  function spawnCelebrantStars(celebrants, ringRadius) {
    starMeshes.forEach(s => galaxyGroup.remove(s));
    starMeshes = [];

    celebrants.forEach((c, i) => {
      // Determine birth month (MM)
      let monthIndex = 0;
      if (c.date) {
        const parts = c.date.split('-');
        if (parts.length >= 2) {
          monthIndex = parseInt(parts[0], 10) - 1;
          if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
            monthIndex = parseInt(parts[1], 10) - 1 || 0;
          }
        }
      }

      const baseAngle = (monthIndex / 12) * Math.PI * 2;
      const jitterAngle = baseAngle + (Math.random() - 0.5) * 0.35;
      const dist = ringRadius + (Math.random() - 0.5) * 3.5;

      const x = Math.cos(jitterAngle) * dist;
      const z = Math.sin(jitterAngle) * dist;
      const y = (Math.random() - 0.5) * 3 + Math.sin(baseAngle * 2) * 1.5;

      const isToday = c.is_today;

      const starGeo = new THREE.IcosahedronGeometry(isToday ? 0.9 : 0.65, 1);
      const starMat = new THREE.MeshStandardMaterial({
        color: isToday ? 0xFF6B6B : (i % 2 === 0 ? 0xF59E0B : 0x10B981),
        emissive: isToday ? 0xEF4444 : (i % 2 === 0 ? 0xD97706 : 0x059669),
        emissiveIntensity: 0.8,
        metalness: 0.8,
        roughness: 0.1
      });

      const star = new THREE.Mesh(starGeo, starMat);
      star.position.set(x, y, z);
      star.userData = {
        name: c.name,
        date: c.date,
        monthName: MONTHS[monthIndex],
        notes: c.notes || 'Celebrated Circle Member',
        photo: c.photo || null
      };

      galaxyGroup.add(star);
      starMeshes.push(star);
    });
  }

  function showStarTooltip(data, position) {
    let tooltip = document.getElementById('constellation-star-tooltip');
    const container = document.getElementById('constellation-3d-canvas');
    if (!container) return;

    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'constellation-star-tooltip';
      tooltip.className = 'constellation-glass-tooltip';
      container.parentElement.appendChild(tooltip);
    }

    const photoHtml = data.photo 
      ? `<img src="${data.photo}" alt="${data.name}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1.5px solid #F59E0B;">`
      : `<div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #EA580C, #F59E0B); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">${(data.name || 'Z')[0]}</div>`;

    tooltip.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
        ${photoHtml}
        <div>
          <strong style="color: var(--text-heading); font-size: 0.95rem; display: block;">${data.name}</strong>
          <span style="font-size: 0.76rem; color: #EA580C; font-weight: 700;">⭐ ${data.monthName} Milestone</span>
        </div>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">${data.notes}</div>
      <button type="button" class="btn-tooltip-card-studio" data-name="${data.name}">
        <span>🎨 Design VIP Card</span>
      </button>
    `;

    tooltip.style.opacity = '1';
    tooltip.style.visibility = 'visible';

    tooltip.querySelector('.btn-tooltip-card-studio').addEventListener('click', () => {
      if (window.CardStudio) {
        window.CardStudio.open(data.name, 'Birthday Celebration');
      }
    });
  }

  function hideStarTooltip() {
    const tooltip = document.getElementById('constellation-star-tooltip');
    if (tooltip) {
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
    }
  }

  document.addEventListener('DOMContentLoaded', initConstellation);

  window.WorkspaceConstellation = {
    init: initConstellation,
    reload: () => {
      fetch('/api/birthdays')
        .then(r => r.json())
        .then(data => spawnCelebrantStars(data, 14));
    }
  };

})(window);
