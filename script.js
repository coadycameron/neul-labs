const root = document.documentElement;
const flight = document.querySelector(".flight");
const beats = [...document.querySelectorAll(".beat")];
const smokeField = document.querySelector(".smoke-field");
const altitude = document.querySelector(".altitude-value");
const form = document.querySelector(".contact-form");
const formStatus = document.querySelector(".form-status");
const contact = document.querySelector(".contact");
const rocketWrap = document.querySelector(".rocket-wrap");
const ambientFlight = document.querySelector(".ambient-flight");
const miniRocket = document.querySelector(".mini-rocket");
const shootingStar = document.querySelector(".shooting-star");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let progress = 0;
let previousScroll = window.scrollY;
let puffAccumulator = 0;
let ticking = false;
let bottomArrivalTimer = 0;
let shootingStarTimer = 0;
let miniFlightFrame = 0;
let isAtBottom = false;
let hasMiniRocketFlown = false;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function mix(start, end, amount) {
  return Math.round(start + (end - start) * amount);
}

function makePuff(intensity) {
  if (prefersReducedMotion.matches || intensity < 0.25) return;

  const existingPuffs = smokeField.querySelectorAll(".puff");
  if (existingPuffs.length >= 28) {
    existingPuffs[0].remove();
  }

  const puff = document.createElement("i");
  const size = 18 + Math.random() * 32;
  const direction = Math.random() > 0.5 ? 1 : -1;
  puff.className = "puff";
  puff.style.setProperty("--size", `${size}px`);
  puff.style.setProperty("--drift", `${direction * (28 + Math.random() * 70)}px`);
  puff.style.setProperty("--fall", `${48 + Math.random() * 90}px`);
  puff.style.setProperty("--spin", `${direction * (25 + Math.random() * 80)}deg`);
  puff.style.left = `${(Math.random() - 0.5) * 18}px`;
  smokeField.appendChild(puff);
  puff.addEventListener("animationend", () => puff.remove(), { once: true });
}

function makeContrailPuff(x, y) {
  if (!ambientFlight) return;

  const puff = document.createElement("i");
  puff.className = "contrail-puff";
  puff.style.left = `${x}px`;
  puff.style.top = `${y}px`;
  puff.style.setProperty("--trail-size", `${5 + Math.random() * 7}px`);
  ambientFlight.appendChild(puff);
  puff.addEventListener("animationend", () => puff.remove(), { once: true });
}

function launchMiniRocket() {
  if (
    !miniRocket ||
    !isAtBottom ||
    hasMiniRocketFlown ||
    prefersReducedMotion.matches ||
    miniFlightFrame
  ) return;

  hasMiniRocketFlown = true;
  const duration = 9400;
  const startTime = performance.now();
  let lastTrailTime = 0;
  miniRocket.classList.add("is-flying");

  function fly(now) {
    const flightProgress = clamp((now - startTime) / duration, 0, 1);
    const eased = 0.5 - Math.cos(flightProgress * Math.PI) / 2;
    const x = -50 + eased * (window.innerWidth + 100);
    const arc = Math.sin(flightProgress * Math.PI);
    const y = window.innerHeight * (0.66 - arc * 0.58);
    const slope =
      (-0.58 * window.innerHeight * Math.PI * Math.cos(flightProgress * Math.PI)) /
      (window.innerWidth + 100);
    const angle = Math.atan(slope) * (180 / Math.PI);

    miniRocket.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;

    if (now - lastTrailTime > 68) {
      makeContrailPuff(x + 5, y + 9);
      lastTrailTime = now;
    }

    if (flightProgress < 1 && isAtBottom) {
      miniFlightFrame = window.requestAnimationFrame(fly);
      return;
    }

    miniRocket.classList.remove("is-flying");
    miniFlightFrame = 0;
  }

  miniFlightFrame = window.requestAnimationFrame(fly);
}

function scheduleMiniRocket() {
  window.clearTimeout(bottomArrivalTimer);
  if (hasMiniRocketFlown) return;
  bottomArrivalTimer = window.setTimeout(launchMiniRocket, 5000 + Math.random() * 5000);
}

function showShootingStar() {
  if (!shootingStar || !isAtBottom || prefersReducedMotion.matches) return;

  const fromLeft = Math.random() > 0.5;
  const startX = fromLeft ? window.innerWidth * (0.08 + Math.random() * 0.3) : window.innerWidth * 0.8;
  const startY = window.innerHeight * (0.08 + Math.random() * 0.25);
  const travelX = (fromLeft ? 1 : -1) * (180 + Math.random() * 170);
  const travelY = 90 + Math.random() * 100;
  const angle = Math.atan2(travelY, travelX) * (180 / Math.PI);

  shootingStar.style.left = `${startX}px`;
  shootingStar.style.top = `${startY}px`;
  shootingStar.style.setProperty("--star-travel-x", `${travelX}px`);
  shootingStar.style.setProperty("--star-travel-y", `${travelY}px`);
  shootingStar.style.setProperty("--star-angle", `${angle}deg`);
  shootingStar.classList.remove("is-shooting");
  void shootingStar.offsetWidth;
  shootingStar.classList.add("is-shooting");
  shootingStarTimer = window.setTimeout(showShootingStar, 22000 + Math.random() * 30000);
}

function setAmbientActivity(atBottom) {
  if (atBottom === isAtBottom) return;
  isAtBottom = atBottom;

  window.clearTimeout(bottomArrivalTimer);
  window.clearTimeout(shootingStarTimer);

  if (isAtBottom) {
    scheduleMiniRocket();
    shootingStarTimer = window.setTimeout(showShootingStar, 12000 + Math.random() * 18000);
    return;
  }

  if (miniFlightFrame) {
    window.cancelAnimationFrame(miniFlightFrame);
    miniFlightFrame = 0;
  }
  miniRocket?.classList.remove("is-flying");
}

function setActiveBeat() {
  const scrollPoint = window.scrollY + window.innerHeight * 0.48;

  beats.forEach((beat, index) => {
    if (index === 0) {
      const active = progress < 0.11;
      beat.style.opacity = active ? String(clamp(1 - progress * 10, 0, 1)) : "0";
      beat.style.pointerEvents = active ? "auto" : "none";
      return;
    }

    const top = flight.offsetTop + beat.offsetTop;
    const distance = Math.abs(scrollPoint - top);
    beat.classList.toggle("is-active", distance < window.innerHeight * 0.62);
  });
}

function updateScene() {
  const flightTop = flight.offsetTop;
  const flightRange = flight.offsetHeight - window.innerHeight;
  progress = clamp((window.scrollY - flightTop) / flightRange, 0, 1);
  const rocketBottom = window.innerHeight * (window.innerWidth <= 820 ? 0.34 : 0.52) +
    rocketWrap.offsetHeight * (window.innerWidth <= 820 ? 0.35 : 0.5);
  const launchStart = contact.offsetTop - rocketBottom;
  const launchEnd = document.documentElement.scrollHeight - window.innerHeight;
  const launchProgress = clamp(
    (window.scrollY - launchStart) / Math.max(1, launchEnd - launchStart),
    0,
    1
  );

  const isMobile = window.innerWidth <= 820;
  const headerFadeStart = 0.06;
  const headerFadeEnd = 0.34;
  const mobileHeaderOpacity = isMobile
    ? 1 - clamp(
        (launchProgress - headerFadeStart) / (headerFadeEnd - headerFadeStart),
        0,
        1
      )
    : 1;

  root.style.setProperty("--progress", progress.toFixed(4));
  root.style.setProperty("--launch-progress", launchProgress.toFixed(4));
  root.style.setProperty("--mobile-header-opacity", mobileHeaderOpacity.toFixed(4));
  root.classList.toggle("mobile-header-hidden", isMobile && mobileHeaderOpacity < 0.05);
  root.style.setProperty("--sky-r", mix(239, 25, progress));
  root.style.setProperty("--sky-g", mix(112, 58, progress));
  root.style.setProperty("--sky-b", mix(58, 100, progress));
  setAmbientActivity(window.scrollY >= launchEnd - Math.min(80, window.innerHeight * 0.08));

  const kilometers = Math.round(progress * 408);
  altitude.textContent = String(kilometers).padStart(3, "0");
  setActiveBeat();

  const scrollDelta = Math.abs(window.scrollY - previousScroll);
  puffAccumulator += scrollDelta;
  if (puffAccumulator > 18) {
    makePuff(clamp(scrollDelta / 18, 0, 1));
    puffAccumulator = 0;
  }
  previousScroll = window.scrollY;
  ticking = false;
}

function requestSceneUpdate() {
  if (!ticking) {
    window.requestAnimationFrame(updateScene);
    ticking = true;
  }
}

window.addEventListener("scroll", requestSceneUpdate, { passive: true });
window.addEventListener("resize", requestSceneUpdate);
updateScene();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const button = form.querySelector("button");
  const original = button.querySelector("span").textContent;
  button.disabled = true;
  button.querySelector("span").textContent = "Transmission received";
  formStatus.textContent =
    "Thank you. This demo is ready to connect to your email, CRM, or form service.";

  window.setTimeout(() => {
    button.disabled = false;
    button.querySelector("span").textContent = original;
  }, 3500);
});
