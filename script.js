const PHONE_NUMBER = "593969069585";
const GENERAL_MESSAGE = "Hola, tengo una consulta.";
const OFFER_MESSAGE =
  "Hola, quiero canjear mi c\u00f3digo de descuento *EMPEZAR10* y m\u00e1s informaci\u00f3n sobre crear mi p\u00e1gina web para mi negocio.";

const offerPeriods = ["día", "semana", "mes", "año"];

const analytics = {
  track(eventName) {
    if (!eventName) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName });

    // Ejemplos para activar cuando se conecten herramientas:
    // dataLayer.push({ event: 'whatsapp_click' });
    // fbq('track', 'Lead');
    // gtag('event', 'conversion', {'send_to': 'AW-XXXX/CONVERSION_LABEL'});
    // No enviar datos personales sensibles en eventos.
    if (eventName === "lead_submit" && typeof window.fbq === "function") {
      window.fbq("track", "Lead");
    }
  },
};

function buildWhatsAppUrl(message) {
  return `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
}

function setupNav() {
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-menu a");

  const closeMenu = () => {
    if (!navToggle || !navMenu) return;
    navToggle.setAttribute("aria-expanded", "false");
    navMenu.classList.remove("is-open");
    document.body.classList.remove("nav-open");
  };

  const openMenu = () => {
    if (!navToggle || !navMenu) return;
    navToggle.setAttribute("aria-expanded", "true");
    navMenu.classList.add("is-open");
    document.body.classList.add("nav-open");
  };

  if (!navToggle || !navMenu) return;

  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 1024px)").matches) closeMenu();
  });
}

function setupTracking() {
  document.addEventListener("click", (event) => {
    const tracked = event.target.closest("[data-track]");
    if (!tracked) return;
    analytics.track(tracked.dataset.track);
  });
}

function setupHeroVideos() {
  const videos = [...document.querySelectorAll(".hero-video")];
  const bars = [...document.querySelectorAll(".story-bar")];

  if (!videos.length || !bars.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let activeIndex = 0;
  let rafId = 0;

  const setBars = () => {
    bars.forEach((bar, index) => {
      const fill = bar.firstElementChild;
      if (!fill) return;
      if (index < activeIndex) fill.style.width = "100%";
      else if (index > activeIndex) fill.style.width = "0%";
      else fill.style.width = prefersReducedMotion ? "100%" : "0%";
    });
  };

  const updateActiveBarFill = () => {
    const active = videos[activeIndex];
    const fill = bars[activeIndex] && bars[activeIndex].firstElementChild;
    if (fill && active.duration) {
      fill.style.width = ((active.currentTime / active.duration) * 100).toFixed(1) + "%";
    }
    rafId = window.requestAnimationFrame(updateActiveBarFill);
  };

  const playStory = (index) => {
    if (rafId) window.cancelAnimationFrame(rafId);
    activeIndex = ((index % videos.length) + videos.length) % videos.length;

    videos.forEach((video, i) => {
      const isActive = i === activeIndex;
      video.classList.toggle("is-active", isActive);
      if (isActive) {
        video.currentTime = 0;
        if (!prefersReducedMotion) video.play().catch(() => {});
      } else {
        video.pause();
      }
    });

    setBars();
    if (!prefersReducedMotion) rafId = window.requestAnimationFrame(updateActiveBarFill);
  };

  videos.forEach((video, index) => {
    video.muted = true;
    video.addEventListener("ended", () => {
      if (index === activeIndex) playStory(activeIndex + 1);
    });
  });

  bars.forEach((bar, index) => {
    bar.addEventListener("click", () => playStory(index));
  });

  document.addEventListener("visibilitychange", () => {
    const active = videos[activeIndex];
    if (document.hidden) {
      active.pause();
    } else if (!prefersReducedMotion) {
      active.play().catch(() => {});
    }
  });

  playStory(0);
}

function setupOfferHeadline() {
  const period = document.querySelector("[data-offer-period]");
  if (!period || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let index = offerPeriods.indexOf(period.textContent.trim());
  if (index < 0) index = 1;

  window.setInterval(() => {
    period.classList.add("is-changing");

    window.setTimeout(() => {
      index = (index + 1) % offerPeriods.length;
      period.textContent = offerPeriods[index];
      period.classList.remove("is-changing");
    }, 180);
  }, 2200);
}

function setupPortfolio() {
  const shell = document.querySelector(".portfolio-shell");
  const track = document.querySelector("[data-portfolio-track]");
  const cards = [...document.querySelectorAll(".portfolio-card")];
  const previous = document.querySelector("[data-portfolio-prev]");
  const next = document.querySelector("[data-portfolio-next]");
  const modal = document.querySelector("#portfolio-modal");
  const modalTitle = document.querySelector("#portfolio-modal-title");
  const modalImage = document.querySelector("#portfolio-modal-image");
  const modalStage = document.querySelector(".portfolio-modal-stage");
  const closeControls = document.querySelectorAll("[data-portfolio-close]");
  const zoomIn = document.querySelector("[data-portfolio-zoom-in]");
  const zoomOut = document.querySelector("[data-portfolio-zoom-out]");
  const zoomReset = document.querySelector("[data-portfolio-zoom-reset]");

  if (!track || !cards.length) return;

  let lastFocused = null;
  let zoom = 1;
  let autoplayTimer = null;
  let isAutoplayPaused = false;

  const cardStep = () => {
    const firstCard = cards[0];
    const trackStyles = window.getComputedStyle(track);
    const gap = Number.parseFloat(trackStyles.columnGap || trackStyles.gap || "20") || 20;
    return firstCard ? firstCard.getBoundingClientRect().width + gap : 360;
  };

  const currentCardIndex = () => {
    const step = cardStep();
    return Math.round(track.scrollLeft / step);
  };

  const visibleCardCount = () => Math.max(1, Math.round(track.clientWidth / cardStep()));

  const maxStartIndex = () => Math.max(0, cards.length - visibleCardCount());

  const scrollToCard = (index) => {
    const lastIndex = maxStartIndex();
    let nextIndex = index;
    if (index > lastIndex) nextIndex = 0;
    if (index < 0) nextIndex = lastIndex;
    track.scrollTo({ left: cards[nextIndex].offsetLeft, behavior: "smooth" });
  };

  const stopAutoplay = () => {
    if (!autoplayTimer) return;
    window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  };

  const startAutoplay = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || cards.length <= visibleCardCount()) return;

    stopAutoplay();
    autoplayTimer = window.setInterval(() => {
      const isModalOpen = modal?.classList.contains("is-open");
      if (isAutoplayPaused || document.hidden || isModalOpen) return;
      scrollToCard(currentCardIndex() + 1);
    }, 3000);
  };

  const restartAutoplay = () => {
    stopAutoplay();
    startAutoplay();
  };

  shell?.addEventListener("pointerenter", () => {
    isAutoplayPaused = true;
  });

  shell?.addEventListener("pointerleave", () => {
    isAutoplayPaused = false;
  });

  shell?.addEventListener("focusin", () => {
    isAutoplayPaused = true;
  });

  shell?.addEventListener("focusout", () => {
    isAutoplayPaused = false;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
      return;
    }
    startAutoplay();
  });

  previous?.addEventListener("click", () => {
    scrollToCard(currentCardIndex() - 1);
    restartAutoplay();
  });

  next?.addEventListener("click", () => {
    scrollToCard(currentCardIndex() + 1);
    restartAutoplay();
  });

  startAutoplay();

  if (!modal || !modalTitle || !modalImage || !modalStage) return;

  const setZoom = (value) => {
    zoom = Math.min(2.5, Math.max(0.7, value));
    modalImage.style.setProperty("--portfolio-zoom", zoom.toFixed(2));
    if (zoomReset) zoomReset.textContent = `${Math.round(zoom * 100)}%`;
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    modalImage.removeAttribute("src");
    isAutoplayPaused = false;
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  };

  const openModal = (card) => {
    const title = card.dataset.title || "Proyecto";
    const fullImage = card.dataset.full;
    if (!fullImage) return;

    lastFocused = document.activeElement;
    modalTitle.textContent = title;
    modalImage.alt = `Captura completa de ${title}`;
    modalImage.src = fullImage;
    setZoom(1);
    modalStage.scrollTo({ top: 0, left: 0 });
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    window.requestAnimationFrame(() => {
      const closeButton = modal.querySelector("button[data-portfolio-close]");
      closeButton?.focus();
    });
  };

  cards.forEach((card) => {
    card.addEventListener("click", () => openModal(card));
  });

  closeControls.forEach((control) => {
    control.addEventListener("click", closeModal);
  });

  zoomIn?.addEventListener("click", () => setZoom(zoom + 0.25));
  zoomOut?.addEventListener("click", () => setZoom(zoom - 0.25));
  zoomReset?.addEventListener("click", () => {
    setZoom(1);
    modalStage.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  });

  modalStage.addEventListener("dblclick", () => {
    setZoom(zoom >= 1.75 ? 1 : zoom + 0.5);
  });

  document.addEventListener("keydown", (event) => {
    if (!modal.classList.contains("is-open")) return;
    if (event.key === "Escape") closeModal();
    if (event.key === "+" || event.key === "=") setZoom(zoom + 0.25);
    if (event.key === "-" || event.key === "_") setZoom(zoom - 0.25);
  });
}

function setupLeadForm() {
  const form = document.querySelector("#lead-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const business = String(formData.get("business") || "").trim();
    const need = String(formData.get("need") || "").trim();

    const message = [
      OFFER_MESSAGE,
      "",
      `Nombre: ${name}`,
      `Negocio: ${business}`,
      `Necesito: ${need}`,
    ].join("\n");

    analytics.track("lead_submit");
    window.open(buildWhatsAppUrl(message), "_blank", "noopener");
  });
}

function setupFloatingWhatsapp() {
  const widget = document.querySelector(".whatsapp-widget");
  const button = document.querySelector(".floating-whatsapp");
  const menuLinks = document.querySelectorAll(".whatsapp-menu a");

  if (!widget || !button) return;

  const closeWidget = () => {
    widget.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  };

  const openWidget = () => {
    widget.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  };

  button.addEventListener("click", () => {
    widget.classList.contains("is-open") ? closeWidget() : openWidget();
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", closeWidget);
  });

  document.addEventListener("click", (event) => {
    if (!widget.contains(event.target)) closeWidget();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeWidget();
  });
}

function setupReveals() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    targets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((target) => observer.observe(target));
}

setupNav();
setupTracking();
setupHeroVideos();
setupOfferHeadline();
setupPortfolio();
setupLeadForm();
setupFloatingWhatsapp();
setupReveals();
