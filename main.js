// ============ GALAXY VIEW ============
const canvas = document.getElementById("galaxy");
const ctx = canvas.getContext("2d");
let cw = (canvas.width = window.innerWidth);
let ch = (canvas.height = window.innerHeight);
let cX = cw / 2,
  cY = ch / 2;

window.addEventListener("resize", () => {
  cw = canvas.width = window.innerWidth;
  ch = canvas.height = window.innerHeight;
  cX = cw / 2;
  cY = ch / 2;
});

const stars = [],
  N = 2000;
let zMain = 1.8,
  tzMain = 1.8;
for (let i = 0; i < N; i++) {
  stars.push({
    r0: 50 + Math.random() * 400,
    a: Math.random() * 2 * Math.PI,
    s: 0.00005 + Math.random() * 0.0003,
    z: Math.random(),
    sz: 0.5 + Math.random() * 2,
    c: `hsl(${Math.random() * 360},70%,${60 + 40 * (1 - Math.random())}%)`,
  });
}

canvas.addEventListener("mousemove", (e) => {
  const dx = e.clientX - cX,
    dy = e.clientY - cY;
  tzMain = 1.8 + Math.hypot(dx, dy) / 1500;
});
canvas.addEventListener("click", (e) => {
  const dx = e.clientX - cX,
    dy = e.clientY - cY;
  if (Math.hypot(dx, dy) < 80) openSolarModal();
});

function drawGalaxy() {
  ctx.clearRect(0, 0, cw, ch);
  zMain += (tzMain - zMain) * 0.05;

  const quadR = cw / 3;
  [
    ["rgba(255,0,255,0.2)", -1, -1],
    ["rgba(0,255,255,0.2)", 1, -1],
    ["rgba(255,255,0,0.2)", -1, 1],
    ["rgba(0,255,128,0.2)", 1, 1],
  ].forEach(([col, ix, iy]) => {
    const g = ctx.createRadialGradient(
      cX + (ix * quadR) / 2,
      cY + (iy * quadR) / 3,
      0,
      cX + (ix * quadR) / 2,
      cY + (iy * quadR) / 3,
      quadR
    );
    g.addColorStop(0, col);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
  });

  stars.forEach((s) => {
    s.a += s.s;
    const sc = (1 - s.z) * zMain;
    const rr = s.r0 * sc;
    const x = cX + rr * Math.cos(s.a);
    const y = cY + rr * 0.4 * Math.sin(s.a);
    ctx.beginPath();
    ctx.arc(x, y, s.sz * sc * 0.6, 0, 2 * Math.PI);
    ctx.fillStyle = s.c;
    ctx.fill();
  });

  const mg = ctx.createRadialGradient(cX, cY, 0, cX, cY, 80);
  mg.addColorStop(0, "white");
  mg.addColorStop(0.3, "#ffdd66");
  mg.addColorStop(1, "rgba(255,200,0,0.1)");
  ctx.beginPath();
  ctx.arc(cX, cY, 80, 0, 2 * Math.PI);
  ctx.fillStyle = mg;
  ctx.fill();

  requestAnimationFrame(drawGalaxy);
}
drawGalaxy();

// ============ SOLAR SYSTEM + EARTH MAP ============
const modal = document.getElementById("solarModal"),
  closeBtn = document.getElementById("closeModal"),
  backBtn = document.getElementById("backBtn"),
  sCanvas = document.getElementById("solarCanvas"),
  sCtx = sCanvas.getContext("2d");

let cw2, ch2;
let zoomed = null,
  mapStage = false,
  hoverPlanet = null,
  eAngle = 0,
  zl = 1;
let mapReady = false;

const earthImg = new Image();
earthImg.onload = () => (mapReady = true);
earthImg.src =
  "https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg";

let mapX = 0,
  mapY = 0,
  mapZ = 1;
let dragging = false,
  ds = { x: 0, y: 0 };
let showMsg = false,
  vnX = 0,
  vnY = 0;
let hearts = [];

function drawHeart(x, y, s) {
  sCtx.save();
  sCtx.translate(x, y);
  sCtx.beginPath();
  sCtx.moveTo(0, 0);
  sCtx.bezierCurveTo(-s / 2, -s / 2, -s, s / 3, 0, s);
  sCtx.bezierCurveTo(s, s / 3, s / 2, -s / 2, 0, 0);
  sCtx.fillStyle = "pink";
  sCtx.fill();
  sCtx.restore();
}

closeBtn.onclick = () => (modal.style.display = "none");
backBtn.onclick = () => {
  zoomed = null;
  mapStage = false;
  showMsg = false;
  mapX = mapY = 0;
  mapZ = 1;
};

function openSolarModal() {
  modal.style.display = "block";
  cw2 = sCanvas.width = modal.clientWidth;
  ch2 = sCanvas.height = modal.clientHeight;
  drawSolar();
}

function drawSolar() {
  const cx = cw2 / 2,
    cy = ch2 / 2 + 40;
  const sunR = 70;

  const planets = [
    { name: "Mercury", d: 90, r: 6, c: "#d4d4d4", s: 0.004, t: 0.8 },
    { name: "Venus", d: 130, r: 8, c: "#e3c07b", s: 0.003, t: 0.85 },
    { name: "Earth", d: 170, r: 10, c: "#3399ff", s: 0.002, t: 0.9 },
    { name: "Mars", d: 210, r: 9, c: "#d94c3d", s: 0.0015, t: 0.93 },
    { name: "Jupiter", d: 270, r: 16, c: "#f4e2c0", s: 0.001, t: 0.7 },
    { name: "Saturn", d: 320, r: 14, c: "#f6d98a", s: 0.0008, t: 0.75 },
    { name: "Uranus", d: 370, r: 12, c: "#b3ffff", s: 0.0006, t: 0.7 },
  ];
  planets.forEach((p) => (p.a = Math.random() * 2 * Math.PI));

  const bgStars = [];
  for (let i = 0; i < 600; i++) {
    bgStars.push({
      x: Math.random() * cw2,
      y: Math.random() * ch2,
      r: Math.random() * 1.2,
      a: 0.2 + Math.random() * 0.4,
    });
  }

  sCtx.font = "12px Arial";
  sCtx.textAlign = "center";
  sCtx.textBaseline = "top";

  sCanvas.onmousemove = (e) => {
    const rect = sCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left,
      my = e.clientY - rect.top;
    if (!zoomed) {
      hoverPlanet = null;
      planets.forEach((p) => {
        const x = cx + p.d * Math.cos(p.a),
          y = cy + p.d * p.t * Math.sin(p.a);
        if (Math.hypot(mx - x, my - y) < p.r * 1.8) hoverPlanet = p;
      });
    }
  };

  sCanvas.onmousedown = (e) => {
    if (zoomed && mapStage && mapReady) {
      dragging = true;
      ds = { x: e.clientX, y: e.clientY };
    }
  };

  sCanvas.onmousemove = (e) => {
    if (dragging) {
      mapX += e.clientX - ds.x;
      mapY += e.clientY - ds.y;
      ds = { x: e.clientX, y: e.clientY };
    }
  };

  sCanvas.onmouseup = sCanvas.onmouseleave = () => (dragging = false);

  sCanvas.onwheel = (e) => {
    if (zoomed && mapStage && mapReady && e.ctrlKey) {
      e.preventDefault();
      const d = -e.deltaY * 0.001;
      mapZ = Math.min(Math.max(mapZ * (1 + d), 0.5), 3);
    }
  };

  sCanvas.addEventListener("touchstart", (e) => {
    if (zoomed && mapStage && mapReady) {
      dragging = true;
      const t = e.touches[0];
      ds = { x: t.clientX, y: t.clientY };
    }
  });
  sCanvas.addEventListener("touchmove", (e) => {
    if (dragging) {
      const t = e.touches[0];
      mapX += t.clientX - ds.x;
      mapY += t.clientY - ds.y;
      ds = { x: t.clientX, y: t.clientY };
    }
    e.preventDefault();
  });
  sCanvas.addEventListener("touchend", () => (dragging = false));

  sCanvas.onclick = (e) => {
    const rect = sCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left,
      my = e.clientY - rect.top;

    if (!zoomed) {
      planets.forEach((p) => {
        const x = cx + p.d * Math.cos(p.a),
          y = cy + p.d * p.t * Math.sin(p.a),
          ty = y + p.r + 4,
          tw = sCtx.measureText(p.name).width,
          M = 6;
        if (
          p.name === "Earth" &&
          mx > x - tw / 2 - M &&
          mx < x + tw / 2 + M &&
          my > ty - M &&
          my < ty + 12 + M
        ) {
          zoomed = p;
          mapStage = false;
          showMsg = false;
          mapX = mapY = 0;
          mapZ = 1;
        }
      });
    } else if (zoomed.name === "Earth" && mapStage && mapReady) {
      const base = 300 * zl;
      const W = base * mapZ,
        H = (W * earthImg.height) / earthImg.width;
      const dx = mx - (cx - W / 2 + mapX + W * 0.65),
        dy = my - (cy - H / 2 + mapY + H * 0.5);
      if (dx * dx + dy * dy < 12 * 12) {
        showMsg = true;
      }
    }
  };

  function frame() {
    sCtx.clearRect(0, 0, cw2, ch2);
    bgStars.forEach((st) => {
      sCtx.beginPath();
      sCtx.arc(st.x, st.y, st.r, 0, 2 * Math.PI);
      sCtx.fillStyle = `rgba(255,255,255,${st.a})`;
      sCtx.fill();
    });

    const sg = sCtx.createRadialGradient(cx, cy, 0, cx, cy, sunR * 2);
    sg.addColorStop(0, "#ffffee");
    sg.addColorStop(0.3, "#ffd54f");
    sg.addColorStop(0.6, "rgba(255,160,0,0.6)");
    sg.addColorStop(1, "rgba(255,120,0,0.2)");
    sCtx.beginPath();
    sCtx.arc(cx, cy, sunR * (zoomed ? 0.5 : 1), 0, 2 * Math.PI);
    sCtx.fillStyle = sg;
    sCtx.shadowBlur = 30;
    sCtx.shadowColor = "#ffd54f";
    sCtx.fill();
    sCtx.shadowBlur = 0;

    if (!zoomed) {
      sCtx.setLineDash([4, 4]);
      planets.forEach((p) => {
        sCtx.beginPath();
        sCtx.strokeStyle = "rgba(255,255,255,0.15)";
        sCtx.ellipse(cx, cy, p.d, p.d * p.t, 0, 0, 2 * Math.PI);
        sCtx.stroke();
      });
      sCtx.setLineDash([]);

      planets.forEach((p) => {
        p.a += p.s;
        const x = cx + p.d * Math.cos(p.a),
          y = cy + p.d * p.t * Math.sin(p.a);
        if (hoverPlanet === p && p.name === "Earth") {
          eAngle += 0.04;
          const shake = Math.sin(Date.now() / 80) * 1.2;
          sCtx.save();
          sCtx.translate(x + shake, y + shake);
          sCtx.rotate(eAngle);
          drawPlanet(x, y, p.r * 1.2, p.c);
          sCtx.restore();
          sCtx.beginPath();
          sCtx.arc(x, y, p.r * 1.2 + 4, 0, 2 * Math.PI);
          sCtx.strokeStyle = "rgba(0,255,255,0.7)";
          sCtx.lineWidth = 2;
          sCtx.stroke();
        } else {
          drawPlanet(x, y, p.r, p.c);
        }
        sCtx.fillStyle = "#ccc";
        sCtx.fillText(p.name, x, y + p.r + 4);
      });
    } else {
      zl += (4 - zl) * 0.05;
      zoomed.a += zoomed.s;

      if (mapReady) mapStage = true;

      if (mapStage) {
        const base = 300 * zl;
        const W = base * mapZ,
          H = (W * earthImg.height) / earthImg.width;

        const mx_ = cx - W / 2 + mapX,
          my_ = cy - H / 2 + mapY;

        const maxX = Math.max((W - cw2) / 2, 0);
        const maxY = Math.max((H - ch2) / 2, 0);
        mapX = Math.min(maxX, Math.max(-maxX, mapX));
        mapY = Math.min(maxY, Math.max(-maxY, mapY));

        sCtx.fillStyle = "#001f3f";
        sCtx.fillRect(0, 0, cw2, ch2);
        sCtx.drawImage(earthImg, mx_, my_, W, H);

        // chấm VN
        vnX = mx_ + W * 0.65;
        vnY = my_ + H * 0.5;
        sCtx.beginPath();
        sCtx.arc(vnX, vnY, 6, 0, 2 * Math.PI);
        sCtx.fillStyle = "yellow";
        sCtx.shadowBlur = 15;
        sCtx.shadowColor = "yellow";
        sCtx.fill();
        sCtx.shadowBlur = 0;

        if (showMsg) {
          sCtx.fillStyle = "#fff";
          sCtx.font = "20px Arial";
          sCtx.textAlign = "center";
          sCtx.fillText(
            "anh chỉ yêu IU bé Hiền bởi sự đáng yêu, ngây thơ của em sự đang iu vô cùng luôn làm anh mềm lòng iu quá đi thôi bé iu của me ơi sao lại dễ thương vậy chứ muốn lúc nào cx ôm ôm . ngày nào cx rất muốn đc ss xx ôm ôm bé iu đi ngủ iu iu bé iu bé thôi...",
            cw2 / 2,
            ch2 / 2 - 60
          );

          if (hearts.length < 150 && Math.random() < 0.3) {
            hearts.push({
              x: mx_ + Math.random() * W,
              y: my_ + Math.random() * H,
              vy: 0.4 + Math.random() * 0.6,
              alpha: 1,
              scale: 0.5 + Math.random() * 0.6,
            });
          }
          hearts = hearts.filter((h) => {
            h.y += h.vy;
            h.alpha -= 0.008;
            if (h.alpha <= 0) return false;
            sCtx.globalAlpha = h.alpha;
            drawHeart(h.x, h.y, 8 * h.scale);
            sCtx.globalAlpha = 1;
            return true;
          });
        }
      }
    }

    requestAnimationFrame(frame);
  }
  frame();

  function drawPlanet(x, y, r, color) {
    const g = sCtx.createRadialGradient(x - r / 2, y - r / 2, 1, x, y, r);
    g.addColorStop(0, "white");
    g.addColorStop(0.3, color);
    g.addColorStop(1, color);
    sCtx.beginPath();
    sCtx.arc(x, y, r, 0, 2 * Math.PI);
    sCtx.fillStyle = g;
    sCtx.fill();

    for (let i = 0; i < 80; i++) {
      const a = Math.random() * 2 * Math.PI;
      const rr = r * Math.sqrt(Math.random());
      sCtx.beginPath();
      sCtx.arc(
        x + rr * Math.cos(a),
        y + rr * Math.sin(a),
        Math.random() * 1.4,
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
}
