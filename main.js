// === CANVAS THIÊN HÀ ===
const canvas = document.getElementById("galaxy"),
  ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;
let centerX = canvas.width / 2,
  centerY = canvas.height / 2;

const stars = [],
  numStars = 2000;
let zoomLevelMain = 1.8,
  targetZoomMain = 1.8;
for (let i = 0; i < numStars; i++) {
  stars.push({
    baseRadius: 50 + Math.random() * 400,
    angle: Math.random() * 2 * Math.PI,
    speed: 0.00005 + Math.random() * 0.0003,
    z: Math.random(),
    size: 0.5 + Math.random() * 2,
    color: `hsl(${Math.random() * 360},100%,${60 + 40 * (1 - Math.random())}%)`,
  });
}
canvas.addEventListener("mousemove", (e) => {
  const dx = e.clientX - centerX,
    dy = e.clientY - centerY;
  targetZoomMain = 1.8 + Math.hypot(dx, dy) / 1500;
});
canvas.addEventListener("click", (e) => {
  const dx = e.clientX - centerX,
    dy = e.clientY - centerY;
  if (Math.hypot(dx, dy) < 80) openSolarModal();
});

function drawColorQuadrants() {
  const r = canvas.width / 3;
  [
    { x: -1, y: -1, c: "rgba(255,0,255,0.2)" },
    { x: 1, y: -1, c: "rgba(0,255,255,0.2)" },
    { x: -1, y: 1, c: "rgba(255,255,0,0.2)" },
    { x: 1, y: 1, c: "rgba(0,255,128,0.2)" },
  ].forEach((q) => {
    const grad = ctx.createRadialGradient(
      centerX + (q.x * r) / 2,
      centerY + (q.y * r) / 3,
      0,
      centerX + (q.x * r) / 2,
      centerY + (q.y * r) / 3,
      r
    );
    grad.addColorStop(0, q.c);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
}
function drawCentralStar() {
  const grad = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    80
  );
  grad.addColorStop(0, "white");
  grad.addColorStop(0.3, "#ffdd66");
  grad.addColorStop(1, "rgba(255,200,0,0.1)");
  ctx.beginPath();
  ctx.arc(centerX, centerY, 80, 0, 2 * Math.PI);
  ctx.fillStyle = grad;
  ctx.fill();
}

function drawGalaxy() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawColorQuadrants();
  zoomLevelMain += (targetZoomMain - zoomLevelMain) * 0.05;
  stars.forEach((s) => {
    s.angle += s.speed;
    const scale = (1 - s.z) * zoomLevelMain;
    const r = s.baseRadius * scale;
    const x = centerX + r * Math.cos(s.angle);
    const y = centerY + r * 0.4 * Math.sin(s.angle);
    const size = s.size * scale * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fillStyle = s.color;
    ctx.fill();
  });
  drawCentralStar();
  requestAnimationFrame(drawGalaxy);
}
drawGalaxy();
window.addEventListener("resize", () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  centerX = canvas.width / 2;
  centerY = canvas.height / 2;
});

// === MODAL HỆ MẶT TRỜI & BẢN ĐỒ (Click Earth chữ để zoom) ===
const modal = document.getElementById("solarModal");
const closeBtn = document.getElementById("closeModal");
const backBtn = document.getElementById("backBtn");
const solarCanvas = document.getElementById("solarCanvas");
const sCtx = solarCanvas.getContext("2d");
const earthMap = new Image();
let earthMapLoaded = false;
earthMap.onload = () => (earthMapLoaded = true);
earthMap.src =
  "https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg";

let mapOffsetX = 0,
  mapOffsetY = 0,
  mapScale = 1;
let isDraggingMap = false,
  dragStart = { x: 0, y: 0 };
let showMessage = false,
  messageY = 0;
let hearts = [];

function drawHeart(ctx, x, y, size = 8) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-size / 2, -size / 2, -size, size / 3, 0, size);
  ctx.bezierCurveTo(size, size / 3, size / 2, -size / 2, 0, 0);
  ctx.closePath();
  ctx.fillStyle = "pink";
  ctx.fill();
  ctx.restore();
}

function openSolarModal() {
  modal.style.display = "block";
  solarCanvas.width = modal.clientWidth;
  solarCanvas.height = modal.clientHeight;
  drawSolarSystem();
}
closeBtn.onclick = () => (modal.style.display = "none");

function drawPlanetWithDetails(x, y, r, color) {
  const grad = sCtx.createRadialGradient(x - r / 2, y - r / 2, 1, x, y, r);
  grad.addColorStop(0, "white");
  grad.addColorStop(0.3, color);
  grad.addColorStop(1, color);
  sCtx.beginPath();
  sCtx.arc(x, y, r, 0, 2 * Math.PI);
  sCtx.fillStyle = grad;
  sCtx.fill();
  for (let i = 0; i < 100; i++) {
    const a = Math.random() * 2 * Math.PI;
    const rr = r * Math.sqrt(Math.random());
    sCtx.beginPath();
    sCtx.arc(
      x + rr * Math.cos(a),
      y + rr * Math.sin(a),
      Math.random() * 1.5,
      0,
      2 * Math.PI
    );
    sCtx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    sCtx.fill();
  }
  sCtx.beginPath();
  sCtx.arc(x - r / 3, y - r / 3, r / 5, 0, 2 * Math.PI);
  sCtx.fillStyle = "rgba(255,255,255,0.15)";
  sCtx.fill();
}

function drawSolarSystem() {
  const cx = solarCanvas.width / 2;
  const cy = solarCanvas.height / 2 + 40;
  const sunR = 70;

  const planets = [
    {
      name: "Mercury",
      dist: 90,
      radius: 6,
      color: "#d4d4d4",
      speed: 0.004,
      tilt: 0.8,
    },
    {
      name: "Venus",
      dist: 130,
      radius: 8,
      color: "#e3c07b",
      speed: 0.003,
      tilt: 0.85,
    },
    {
      name: "Earth",
      dist: 170,
      radius: 10,
      color: "#3399ff",
      speed: 0.002,
      tilt: 0.9,
    },
    {
      name: "Mars",
      dist: 210,
      radius: 9,
      color: "#d94c3d",
      speed: 0.0015,
      tilt: 0.93,
    },
    {
      name: "Jupiter",
      dist: 270,
      radius: 16,
      color: "#f4e2c0",
      speed: 0.001,
      tilt: 0.7,
    },
    {
      name: "Saturn",
      dist: 320,
      radius: 14,
      color: "#f6d98a",
      speed: 0.0008,
      tilt: 0.75,
    },
    {
      name: "Uranus",
      dist: 370,
      radius: 12,
      color: "#b3ffff",
      speed: 0.0006,
      tilt: 0.7,
    },
  ];
  planets.forEach((p) => (p.angle = Math.random() * 2 * Math.PI));

  const backgroundStars = [];
  for (let i = 0; i < 1000; i++) {
    backgroundStars.push({
      x: Math.random() * solarCanvas.width,
      y: Math.random() * solarCanvas.height,
      radius: Math.random() * 1.2,
      alpha: 0.2 + Math.random() * 0.4,
    });
  }

  let zoomed = null,
    mapShown = false;
  let hoveredPlanet = null,
    earthHoverAngle = 0;

  // Thiết lập text font & alignment CẦN cho đo click chữ
  sCtx.font = "12px Arial";
  sCtx.textAlign = "center";
  sCtx.textBaseline = "top";

  solarCanvas.onmousemove = (e) => {
    if (zoomed || mapShown) return;
    const rect = solarCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left,
      my = e.clientY - rect.top;
    hoveredPlanet = null;
    planets.forEach((p) => {
      const x = cx + p.dist * Math.cos(p.angle);
      const y = cy + p.dist * p.tilt * Math.sin(p.angle);
      if (Math.hypot(mx - x, my - y) < p.radius * 1.8) {
        hoveredPlanet = p;
      }
    });
  };

  solarCanvas.onmousedown = (e) => {
    if (zoomed && mapShown) {
      isDraggingMap = true;
      dragStart = { x: e.clientX, y: e.clientY };
    }
  };
  solarCanvas.onmousemove = (e) => {
    if (isDraggingMap) {
      mapOffsetX += e.clientX - dragStart.x;
      mapOffsetY += e.clientY - dragStart.y;
      dragStart = { x: e.clientX, y: e.clientY };
    }
  };
  solarCanvas.onmouseup = solarCanvas.onmouseleave = () => {
    isDraggingMap = false;
  };

  solarCanvas.onwheel = (e) => {
    if (zoomed && mapShown && e.ctrlKey) {
      e.preventDefault();
      const d = -e.deltaY * 0.001;
      mapScale = Math.min(Math.max(mapScale * (1 + d), 0.5), 3);
    }
  };

  solarCanvas.onclick = (e) => {
    const rect = solarCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left,
      my = e.clientY - rect.top;

    if (!zoomed) {
      planets.forEach((p) => {
        const x = cx + p.dist * Math.cos(p.angle);
        const y = cy + p.dist * p.tilt * Math.sin(p.angle);
        const textY = y + p.radius + 4;
        const tw = sCtx.measureText(p.name).width;
        const isClickTxt =
          p.name === "Earth" &&
          mx > x - tw / 2 &&
          mx < x + tw / 2 &&
          my > textY &&
          my < textY + 14;

        if (isClickTxt) {
          zoomed = p;
          mapShown = false;
          showMessage = false;
          mapOffsetX = 0;
          mapOffsetY = 0;
          mapScale = 1;
        }
      });
    } else if (zoomed.name === "Earth" && mapShown && earthMapLoaded) {
      const base = 300 * zoomLevel;
      const w0 = base * mapScale;
      const h0 = (w0 * earthMap.height) / earthMap.width;
      const drawX = cx - w0 / 2 + mapOffsetX;
      const drawY = cy - h0 / 2 + mapOffsetY;
      const vnX = drawX + w0 * 0.65;
      const vnY = drawY + h0 * 0.5;
      if (Math.hypot(mx - vnX, my - vnY) < 12) {
        showMessage = true;
        messageY = vnY - 40;
        hearts = [];
      }
    }
  };

  backBtn.onclick = () => {
    zoomed = null;
    mapShown = false;
    showMessage = false;
    mapScale = 1;
    mapOffsetX = 0;
    mapOffsetY = 0;
  };

  let zoomLevel = 1;

  function frame() {
    sCtx.fillStyle = "black";
    sCtx.fillRect(0, 0, solarCanvas.width, solarCanvas.height);
    backgroundStars.forEach((st) => {
      sCtx.beginPath();
      sCtx.arc(st.x, st.y, st.radius, 0, 2 * Math.PI);
      sCtx.fillStyle = `rgba(255,255,255,${st.alpha})`;
      sCtx.fill();
    });

    // Mặt trời
    const sunGrad = sCtx.createRadialGradient(cx, cy, 0, cx, cy, sunR * 2);
    sunGrad.addColorStop(0, "#ffffee");
    sunGrad.addColorStop(0.3, "#ffd54f");
    sunGrad.addColorStop(0.6, "rgba(255,160,0,0.6)");
    sunGrad.addColorStop(1, "rgba(255,120,0,0.2)");
    sCtx.beginPath();
    sCtx.arc(cx, cy, sunR * (zoomed ? 0.5 : 1), 0, 2 * Math.PI);
    sCtx.fillStyle = sunGrad;
    sCtx.shadowBlur = 30;
    sCtx.shadowColor = "#ffd54f";
    sCtx.fill();
    sCtx.shadowBlur = 0;

    if (!zoomed) {
      sCtx.setLineDash([4, 4]);
      planets.forEach((p) => {
        sCtx.beginPath();
        sCtx.strokeStyle = "rgba(255,255,255,0.15)";
        sCtx.ellipse(cx, cy, p.dist, p.dist * p.tilt, 0, 0, 2 * Math.PI);
        sCtx.stroke();
      });
      sCtx.setLineDash([]);
      planets.forEach((p) => {
        p.angle += p.speed;
        let x = cx + p.dist * Math.cos(p.angle);
        let y = cy + p.dist * p.tilt * Math.sin(p.angle);

        if (p === hoveredPlanet && p.name === "Earth") {
          earthHoverAngle += 0.04;
          const shake = Math.sin(Date.now() / 80) * 1.2;
          x += shake;
          y += shake;
          const r0 = p.radius * 1.2;
          sCtx.save();
          sCtx.translate(x, y);
          sCtx.rotate(earthHoverAngle);
          drawPlanetWithDetails(0, 0, r0, p.color);
          sCtx.restore();
          sCtx.beginPath();
          sCtx.arc(x, y, r0 + 4, 0, 2 * Math.PI);
          sCtx.strokeStyle = "rgba(0,255,255,0.7)";
          sCtx.lineWidth = 2;
          sCtx.stroke();
        } else {
          drawPlanetWithDetails(x, y, p.radius, p.color);
        }
        sCtx.fillStyle = "#ccc";
        sCtx.fillText(p.name, x, y + p.radius + 4);
      });
    } else {
      zoomLevel += (4 - zoomLevel) * 0.05;
      zoomed.angle += zoomed.speed;

      if (zoomed.name === "Earth" && mapShown && earthMapLoaded) {
        const base = 300 * zoomLevel,
          w0 = base * mapScale;
        const h0 = (w0 * earthMap.height) / earthMap.width;
        const maxOX = Math.max((w0 - solarCanvas.width) / 2, 0),
          maxOY = Math.max((h0 - solarCanvas.height) / 2, 0);
        mapOffsetX = Math.min(maxOX, Math.max(-maxOX, mapOffsetX));
        mapOffsetY = Math.min(maxOY, Math.max(-maxOY, mapOffsetY));

        const drawX = cx - w0 / 2 + mapOffsetX;
        const drawY = cy - h0 / 2 + mapOffsetY;

        sCtx.fillStyle = "#001f3f";
        sCtx.fillRect(0, 0, solarCanvas.width, solarCanvas.height);
        sCtx.drawImage(earthMap, drawX, drawY, w0, h0);

        const vnX = drawX + w0 * 0.65,
          vnY = drawY + h0 * 0.5;
        sCtx.beginPath();
        sCtx.arc(vnX, vnY, 6, 0, 2 * Math.PI);
        sCtx.fillStyle = "yellow";
        sCtx.shadowBlur = 15;
        sCtx.shadowColor = "yellow";
        sCtx.fill();
        sCtx.shadowBlur = 0;

        if (showMessage) {
          const msg =
            "anh chỉ yêu mk bé thôi ở đất nước này có rất nhiều người nhưng anh chỉ iu mk bé thôi";
          sCtx.fillStyle = "#fff";
          sCtx.font = "16px Arial";
          sCtx.fillText(msg, cx + mapOffsetX, messageY);
          messageY -= 0.5;

          if (hearts.length < 100 && Math.random() < 0.3) {
            hearts.push({
              x: vnX + (Math.random() - 0.5) * 50,
              y: vnY,
              vy: 0.5 + Math.random(),
              alpha: 1,
              scale: 0.6 + Math.random() * 0.5,
            });
          }
          hearts.forEach((h, i) => {
            h.y += h.vy;
            h.alpha -= 0.008;
            if (h.alpha <= 0) hearts.splice(i, 1);
            else {
              sCtx.globalAlpha = h.alpha;
              drawHeart(sCtx, h.x, h.y, 8 * h.scale);
              sCtx.globalAlpha = 1;
            }
          });
        }
      } else {
        const size = zoomed.radius * zoomLevel * 5;
        drawPlanetWithDetails(cx, cy, size, zoomed.color);
        sCtx.fillStyle = "#fff";
        sCtx.fillText(zoomed.name, cx, cy + size + 8);
      }
    }

    requestAnimationFrame(frame);
  }
  frame();
}
