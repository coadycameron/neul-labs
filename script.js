const root = document.documentElement;
const flight = document.querySelector(".flight");
const beats = [...document.querySelectorAll(".beat")];
const smokeField = document.querySelector(".smoke-field");
const altitude = document.querySelector(".altitude-value");
const form = document.querySelector(".contact-form");
const formStatus = document.querySelector(".form-status");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let progress = 0;
let previousScroll = window.scrollY;
let puffAccumulator = 0;
let ticking = false;

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

  root.style.setProperty("--progress", progress.toFixed(4));
  root.style.setProperty("--sky-r", mix(239, 25, progress));
  root.style.setProperty("--sky-g", mix(112, 58, progress));
  root.style.setProperty("--sky-b", mix(58, 100, progress));

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
