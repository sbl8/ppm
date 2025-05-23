/**
 * ParaPowerMapping Website JavaScript
 * Handles all interactive functionality for the website
 * - Mobile navigation
 * - Scroll animations
 * - Dynamic podcast player
 * - Share dialog functionality
 * - Performance optimizations
 */

// Use strict mode for better error catching and performance
"use strict";

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize all components
  initMobileNavigation();
  initScrollAnimations();
  initPodcastPlayer();
  initShareDialog();
  initBackToTop();
  initAccessibility();
  initIntersectionAnimations();
  initParallaxEffects();
  initActiveNavHighlighting(); // Added active nav highlighting
  initHeroLogoHoverEffect(); // Add the new function call
});

/**
 * Mobile Navigation Functionality
 * Toggles mobile menu and handles navigation events
 */
function initMobileNavigation() {
  const menuToggle = document.querySelector(".nav__toggle");
  const menu = document.querySelector(".nav__list");
  const body = document.body;

  if (!menuToggle || !menu) return;

  // Toggle menu visibility
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    body.classList.toggle("menu-open", !isExpanded);
    menuToggle.setAttribute("aria-expanded", String(isExpanded));
  });

  // Close menu when clicking outside
  document.addEventListener("click", (event) => {
    if (
      !menu.contains(event.target) &&
      !menuToggle.contains(event.target) &&
      body.classList.contains("menu-open")
    ) {
      menuToggle.setAttribute("aria-expanded", "false");
      body.classList.toggle("menu-open");
    }
  });

  // Close menu when clicking nav links
  const navLinks = menu.querySelectorAll(".nav__link");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      // Update active state immediately on click for responsiveness
      navLinks.forEach((l) => {
        l.classList.remove("active");
        l.removeAttribute("aria-current");
      });
      link.classList.add("active");
      link.setAttribute("aria-current", "page");

      if (window.innerWidth < 769) {
        // Use 769px breakpoint consistent with CSS
        menuToggle.setAttribute("aria-expanded", "false");
        body.classList.remove("menu-open");

        // Reset mobile menu styles (handled by CSS now)
      }
    });
  });

  // Handle resize events to fix menu state
  window.addEventListener(
    "resize",
    debounce(() => {
      if (window.innerWidth >= 769) {
        // Reset styles potentially added by JS for mobile
        menuToggle.setAttribute("aria-expanded", "false");
      } else if (!body.classList.contains("menu-open")) {
        // Ensure menu is hidden if not open on mobile

        menu.style.display = "none";
      }
    }, 150)
  );
}

/**
 * Highlight Active Navigation Link based on Scroll Position
 */
function initActiveNavHighlighting() {
  const sections = document.querySelectorAll("main > section[id]");
  const navLinks = document.querySelectorAll(".nav__link");

  if (!sections.length || !navLinks.length) return;

  const observerOptions = {
    root: null, // relative to document viewport
    rootMargin: "-40% 0px -60% 0px", // Trigger when section is roughly centered
    threshold: 0, // Trigger as soon as any part enters/leaves the margin
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.remove("active");
          link.removeAttribute("aria-current");
          if (link.getAttribute("href") === `#${id}`) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach((section) => {
    observer.observe(section);
  });

  // Special case for home link when at the very top
  const homeObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        navLinks.forEach((link) => {
          link.classList.remove("active");
          link.removeAttribute("aria-current");
          if (link.getAttribute("href") === "#home") {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
          }
        });
      }
    },
    { threshold: 0.5, rootMargin: "0px 0px -90% 0px" }
  ); // Observe top 10% of viewport

  const header = document.querySelector("#header");
  if (header) {
    homeObserver.observe(header);
  }
}

/**
 * Initialize Podcast Player
 * Creates a dynamic podcast player that can switch between Spotify and Apple Podcasts
 */
function initPodcastPlayer() {
  const playerContainer = document.getElementById("podcast-player");
  if (!playerContainer) return;

  // Create player structure
  playerContainer.innerHTML = `
        <div class="podcast-player__container">
            <div class="podcast-player__tabs">
                <button class="podcast-player__tab active" data-provider="apple">
                    <span class="icon icon-apple"></span> Apple Podcasts
                </button>
                <button class="podcast-player__tab" data-provider="spotify">
                    <span class="icon icon-spotify"></span> Spotify
                </button>
            </div>
            <div id="podcast-embed" class="podcast-player__embed">
                <div class="loading-spinner">
                    <span class="visually-hidden">Loading podcast player...</span>
                </div>
            </div>
        </div>
    `;

  // Get elements
  const tabs = playerContainer.querySelectorAll(".podcast-player__tab");
  const embedContainer = document.getElementById("podcast-embed");

  // Load the default provider
  loadPodcastEmbed(podcastConfig.defaultProvider, embedContainer);

  // Add tab click handlers
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Update active tab
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Load selected provider
      const provider = tab.dataset.provider;
      loadPodcastEmbed(provider, embedContainer);
    });
  });
}

/**
 * Load podcast embed based on provider
 * @param {string} provider - The provider to load (spotify or apple)
 * @param {HTMLElement} container - The container to load the embed into
 */
function loadPodcastEmbed(provider, container) {
  if (!container) return;

  // Show loading spinner
  container.innerHTML = `<div class="loading-spinner"><span class="visually-hidden">Loading podcast player...</span></div>`;

  // Create appropriate embed based on provider
  let embedHtml = "";

  if (provider === "spotify") {
    embedHtml = `
            <iframe style="border-radius:12px" 
                src="https://open.spotify.com/embed/show/6fw1VCpTK9W4K56N1kyR6O?utm_source=generator&theme=0" 
                width="100%" 
                height="352" 
                frameBorder="0" 
                allowfullscreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy">
            </iframe>
        `;
  } else if (provider === "apple") {
    embedHtml = `
            <iframe 
                height="450" 
                width="100%" 
                title="Media player" 
                src="https://embed.podcasts.apple.com/us/podcast/parapower-mapping/id1674362158?itscg=30200&amp;itsct=podcast_box_player&amp;ls=1&amp;mttnsubad=1674362158&amp;theme=dark" 
                id="embedPlayer" 
                style="border: 0px; border-radius: 12px; width: 100%; height: 450px; max-width: 100%;" 
                sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation" 
                allow="autoplay; encrypted-media; clipboard-write">
            </iframe>
        `;
  }

  // Insert embed HTML
  container.innerHTML = embedHtml;

  // Handle errors
  const iframe = container.querySelector("iframe");
  if (iframe) {
    iframe.onerror = () => {
      container.innerHTML = `
                <div class="error-message">
                    <p>Unable to load podcast player from ${provider}.</p>
                    <p>Please try another provider or visit directly:</p>
                    <div class="podcast-player__fallback-buttons">
                        <a href="https://open.spotify.com/show/6fw1VCpTK9W4K56N1kyR6O" 
                           class="btn btn--secondary" target="_blank" rel="noopener">
                            <span class="icon icon-spotify"></span> Spotify
                        </a>
                        <a href="https://podcasts.apple.com/us/podcast/parapower-mapping/id1674362158" 
                           class="btn btn--secondary" target="_blank" rel="noopener">
                            <span class="icon icon-apple"></span> Apple Podcasts
                        </a>
                    </div>
                </div>
            `;
    };
  }
}

/**
 * Scroll Animations
 * Detects when elements enter viewport and triggers animations
 */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll(".animate-on-scroll");

  if (animatedElements.length === 0) return;

  // Use Intersection Observer for better performance
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          // Once animated, no need to observe anymore
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px",
      threshold: 0.15, // Element is 15% visible
    }
  );

  // Observe all animated elements
  animatedElements.forEach((el) => {
    observer.observe(el);
  });
}

/**
 * Intersection-based Animations
 * Advanced animations triggered by scroll position
 */
function initIntersectionAnimations() {
  const staggeredElements = document.querySelectorAll("[data-stagger]");
  const revealElements = document.querySelectorAll("[data-reveal]");

  // Handle staggered animations
  const staggerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Add staggered delay based on index
          setTimeout(() => {
            entry.target.classList.add("revealed");
          }, index * 100); // 100ms stagger
          staggerObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  staggeredElements.forEach((el) => {
    staggerObserver.observe(el);
  });

  // Handle reveal animations
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const direction = entry.target.dataset.reveal || "up";
          entry.target.classList.add(`reveal-${direction}`);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  revealElements.forEach((el) => {
    revealObserver.observe(el);
  });
}

/**
 * Parallax Effects
 * Creates smooth parallax scrolling effects
 */
function initParallaxEffects() {
  const parallaxElements = document.querySelectorAll(".parallax");
  const aboutBackground = document.querySelector(".about-background");

  if (aboutBackground && "IntersectionObserver" in window) {
    // Add parallax effect to about section background
    const parallaxObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Enable animation when visible
            aboutBackground.style.animation =
              "slow-drift 20s ease-in-out infinite alternate";
          } else {
            // Disable animation when not visible (performance optimization)
            aboutBackground.style.animation = "none";
          }
        });
      },
      { threshold: 0.1 }
    );

    parallaxObserver.observe(aboutBackground.parentNode);
  }

  if (parallaxElements.length === 0) return;

  // Only apply parallax effect if device likely supports it well
  const supportsParallax = !isMobileDevice();

  if (supportsParallax) {
    window.addEventListener(
      "scroll",
      throttle(() => {
        const scrollY = window.scrollY;

        parallaxElements.forEach((el) => {
          const speed = el.dataset.speed || 0.3;
          const yPos = -(scrollY * speed);
          el.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
      }, 16)
    ); // ~60fps
  }
}

/**
 * Share Dialog Functionality
 * Handles the share dialog for sharing episodes
 */
function initShareDialog() {
  const shareDialog = document.getElementById("share-dialog");
  if (!shareDialog) return;

  // Close dialog when clicking the close button
  const closeButton = shareDialog.querySelector(".dialog__close");
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      shareDialog.close();
    });
  }

  // Close dialog when clicking outside
  shareDialog.addEventListener("click", (e) => {
    if (e.target === shareDialog) {
      shareDialog.close();
    }
  });

  // Handle ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && shareDialog.open) {
      shareDialog.close();
    }
  });

  // Copy link functionality
  const copyLinkButton = document.getElementById("copy-link");
  if (copyLinkButton) {
    copyLinkButton.addEventListener("click", () => {
      const link =
        copyLinkButton.getAttribute("data-link") || window.location.href;

      // Copy to clipboard
      navigator.clipboard
        .writeText(link)
        .then(() => {
          const confirmation = document.getElementById("copy-confirmation");
          if (confirmation) {
            confirmation.classList.remove("hidden");
            setTimeout(() => {
              confirmation.classList.add("hidden");
            }, 2000);
          }
        })
        .catch((err) => {
          console.error("Could not copy text: ", err);
        });
    });
  }

  // Configure share options
  const shareOptions = shareDialog.querySelectorAll(
    ".share-option[data-platform]"
  );
  shareOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const platform = option.getAttribute("data-platform");

      if (platform !== "copy") {
        const url = shareDialog.dataset.shareUrl || window.location.href;
        const title = "Check out this episode of ParaPowerMapping!";

        switch (platform) {
          case "twitter":
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                title
              )}&url=${encodeURIComponent(url)}`,
              "_blank"
            );
            break;
          case "facebook":
            window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                url
              )}`,
              "_blank"
            );
            break;
          case "email":
            window.location.href = `mailto:?subject=${encodeURIComponent(
              title
            )}&body=${encodeURIComponent(url)}`;
            break;
        }
      }
    });
  });
}

/**
 * Back to Top Button
 * Shows/hides and animates the back to top button
 */
function initBackToTop() {
  const backToTopButton = document.getElementById("back-to-top");
  if (!backToTopButton) return;

  const showButton = () => {
    const scrollPosition = window.scrollY;
    // Show button after scrolling 800px
    if (scrollPosition > 800) {
      backToTopButton.classList.add("visible");
    } else {
      backToTopButton.classList.remove("visible");
    }
  };

  // Debounce for performance
  window.addEventListener("scroll", debounce(showButton, 100));

  // Smooth scroll to top
  backToTopButton.addEventListener("click", (e) => {
    e.preventDefault();

    // Use smooth scrolling API if available
    if ("scrollBehavior" in document.documentElement.style) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      // Fallback for browsers that don't support smooth scrolling
      const scrollToTop = () => {
        const c = document.documentElement.scrollTop || document.body.scrollTop;
        if (c > 0) {
          window.requestAnimationFrame(scrollToTop);
          window.scrollTo(0, c - c / 8);
        }
      };
      scrollToTop();
    }
  });
}

/**
 * Accessibility Improvements
 * Ensures the site is accessible to all users
 */
function initAccessibility() {
  // Focus trap for modal dialogs
  const dialogs = document.querySelectorAll("dialog");
  dialogs.forEach((dialog) => {
    dialog.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        const focusableElements = dialog.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // If shift+tab is pressed and focus is on first element, move to last
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
        // If tab is pressed and focus is on last element, move to first
        else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  });

  // Improve focus visibility
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      document.body.classList.add("keyboard-navigation");
    }
  });

  document.addEventListener("mousedown", () => {
    document.body.classList.remove("keyboard-navigation");
  });

  // Ensure sufficient contrast in text
  document
    .querySelectorAll("a, button, h1, h2, h3, h4, h5, h6")
    .forEach((element) => {
      element.style.textShadow =
        element.style.textShadow || "1px 1px 1px rgba(0,0,0,.2)";
    });
}

/**
 * Utility function to check if the current device is mobile
 * @return {boolean} True if the device is mobile
 */
function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) ||
    (window.matchMedia && window.matchMedia("(max-width: 768px)").matches)
  );
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce delay in ms
 * @return {Function} - The debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Throttle function to limit how often a function can be called
 * @param {Function} func - The function to throttle
 * @param {number} limit - The throttle limit in ms
 * @return {Function} - The throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Format a date string for display
 * @param {string} dateString - ISO date string
 * @return {string} Formatted date string
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

/**
 * Truncate text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - The maximum length of the text
 * @return {string} - The truncated text
 */
function truncateText(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

/**
 * Function to initialize the hero logo hover effect
 */
function initHeroLogoHoverEffect() {
  const heroSection = document.querySelector(".hero");
  const heroLogo = document.querySelector(".hero__logo");

  if (!heroSection || !heroLogo) {
    console.warn("Hero section or logo not found for hover effect.");
    return;
  }

  const originalBackgroundImage = 'url("/images/background6.png")'; // Assuming this is the correct path as per CSS
  const gifs = ["/ghost.gif", "/ghost2.gif", "/ghost3.gif"].map(
    (gif) => `url("${gif}")`
  ); // Prepend url() and ensure correct paths

  if (isMobileDevice()) {
    let logoEffectActive = false;
    heroLogo.addEventListener("click", () => {
      if (!logoEffectActive) {
        const randomGifUrl = gifs[Math.floor(Math.random() * gifs.length)];
        heroSection.style.backgroundImage = randomGifUrl;
        heroLogo.classList.add("glitch-active");
        logoEffectActive = true;
      } else {
        heroSection.style.backgroundImage = originalBackgroundImage;
        heroLogo.classList.remove("glitch-active");
        logoEffectActive = false;
      }
    });
  } else {
    heroLogo.addEventListener("mouseenter", () => {
      const randomGifUrl = gifs[Math.floor(Math.random() * gifs.length)];
      heroSection.style.backgroundImage = randomGifUrl;
    });

    heroLogo.addEventListener("mouseleave", () => {
      heroSection.style.backgroundImage = originalBackgroundImage;
    });
  }
}
