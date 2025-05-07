const podcastConfig = {
  defaultProvider: "apple", // You can change this to "spotify" or make it dynamic if needed
};

/**
 * Podcast Player
 * Handles tab functionality and copy capabilities for the podcast player
 */
document.addEventListener("DOMContentLoaded", () => {
  const podcastPlayer = document.getElementById("podcast-player");
  if (!podcastPlayer) return;

  const tabs = podcastPlayer.querySelectorAll(".podcast-player__tab");
  const panels = podcastPlayer.querySelectorAll(".podcast-player__panel");
  const copyButton = document.getElementById("btn-copy-rss");
  const rssUrlInput = document.getElementById("podcast-rss-url");

  // Tab functionality
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Update active tab
      tabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      // Update active panel
      const panelId = tab.getAttribute("aria-controls");
      panels.forEach((panel) => {
        panel.classList.remove("active");
        panel.hidden = true;
      });
      const activePanel = document.getElementById(panelId);
      activePanel.classList.add("active");
      activePanel.hidden = false;

      // Adjust height for different embeds
      const embed = activePanel.querySelector(".podcast-player__embed");
      if (embed) {
        // Responsive height adjustment based on panel content and screen width
        const setResponsiveHeight = () => {
          const width = window.innerWidth;
          if (width <= 480) {
            embed.style.height = "300px";
          } else if (width <= 768) {
            embed.style.height = panelId === "panel-apple" ? "450px" : "350px";
          } else {
            embed.style.height = panelId === "panel-apple" ? "500px" : "380px";
          }
        };

        setResponsiveHeight();
        window.addEventListener("resize", setResponsiveHeight);
      }
    });

    // Keyboard navigation
    tab.addEventListener("keydown", (e) => {
      let index = Array.from(tabs).indexOf(tab);

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        index = index < tabs.length - 1 ? index + 1 : 0;
        tabs[index].focus();
        e.preventDefault();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        index = index > 0 ? index - 1 : tabs.length - 1;
        tabs[index].focus();
        e.preventDefault();
      } else if (e.key === "Home") {
        tabs[0].focus();
        e.preventDefault();
      } else if (e.key === "End") {
        tabs[tabs.length - 1].focus();
        e.preventDefault();
      }
    });
  });

  // Copy RSS URL functionality
  if (copyButton && rssUrlInput) {
    copyButton.addEventListener("click", () => {
      rssUrlInput.select();
      navigator.clipboard
        .writeText(rssUrlInput.value)
        .then(() => {
          const originalText = copyButton.textContent;
          copyButton.textContent = "Copied!";
          copyButton.classList.add("copied");

          setTimeout(() => {
            copyButton.textContent = originalText;
            copyButton.classList.remove("copied");
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy:", err);
        });
    });
  }

  // Initial tab setup
  if (tabs.length > 0 && !tabs[0].classList.contains("active")) {
    tabs[0].click();
  }
});
