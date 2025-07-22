// Content script for handling text selection and showing translation popup

class TranslationPopup {
  constructor() {
    this.popup = null;
    this.isVisible = false;
    this.selectedText = "";
    this.selectionRect = null;
    this.settings = null;
    this.isTransitioning = false; // Flag to prevent race conditions

    this.initialize();
  }

  // Simple markdown parser for AI responses
  parseMarkdown(text) {
    if (!text) return text;

    // Escape HTML first to prevent XSS
    text = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    // Convert markdown to HTML
    let html = text
      // Headers (must be at start of line)
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")

      // Code blocks (before other formatting)
      .replace(
        /```([\s\S]*?)```/gim,
        '<pre class="meantran-code-block"><code>$1</code></pre>'
      )

      // Bold and italic (order matters)
      .replace(/\*\*\*(.*?)\*\*\*/gim, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/gim, "<em>$1</em>")

      // Inline code (after bold/italic)
      .replace(
        /`([^`\n]*?)`/gim,
        '<code class="meantran-inline-code">$1</code>'
      )

      // Lists (numbered and bullet)
      .replace(/^\d+\.\s+(.*$)/gim, '<li class="numbered">$1</li>')
      .replace(/^[\*\-]\s+(.*$)/gim, '<li class="bullet">$1</li>')

      // Blockquotes
      .replace(/^>\s+(.*$)/gim, "<blockquote>$1</blockquote>")

      // Horizontal rules
      .replace(/^---+$/gim, "<hr>")

      // Line breaks and paragraphs
      .replace(/\n\n+/gim, "</p><p>")
      .replace(/\n/gim, "<br>");

    // Wrap consecutive list items in appropriate list tags
    html = html.replace(/(<li class="numbered">.*?<\/li>)/gims, (match) => {
      return "<ol>" + match.replace(/class="numbered"/g, "") + "</ol>";
    });

    html = html.replace(/(<li class="bullet">.*?<\/li>)/gims, (match) => {
      return "<ul>" + match.replace(/class="bullet"/g, "") + "</ul>";
    });

    // Clean up multiple consecutive list tags
    html = html.replace(/<\/ol>\s*<ol>/gim, "");
    html = html.replace(/<\/ul>\s*<ul>/gim, "");

    // Wrap in paragraph if no block elements exist
    if (
      !html.includes("<h") &&
      !html.includes("<ul") &&
      !html.includes("<ol") &&
      !html.includes("<pre") &&
      !html.includes("<blockquote")
    ) {
      html = "<p>" + html + "</p>";
    }

    // Clean up empty paragraphs and excessive line breaks
    html = html.replace(/<p><\/p>/gim, "");
    html = html.replace(/<br>\s*<br>/gim, "<br>");

    return html;
  }

  async initialize() {
    // Get settings from background script
    chrome.runtime.sendMessage({ action: "getSettings" }, (response) => {
      if (response) {
        this.settings = response.settings;
      }
    });

    // Listen for text selection
    document.addEventListener("mouseup", this.handleTextSelection.bind(this));
    document.addEventListener("keyup", this.handleTextSelection.bind(this));

    // Hide popup when clicking elsewhere (but not inside the popup or translate button)
    document.addEventListener("click", (e) => {
      console.log(
        "Document click detected",
        e.target.className,
        e.target.tagName,
        "isTransitioning:",
        this.isTransitioning,
        "popup exists:",
        !!this.popup
      );

      // Don't close popup during transitions
      if (this.isTransitioning) {
        console.log("Ignoring click during transition");
        return;
      }

      if (this.popup) {
        const isInsidePopup = this.popup.contains(e.target);
        const isPopupElement = e.target.closest(".meantran-popup");
        const isTranslateButton = e.target.closest(
          ".meantran-translate-button"
        );

        console.log("Click analysis:", {
          isInsidePopup,
          isPopupElement,
          isTranslateButton,
          targetClass: e.target.className,
        });

        if (!isInsidePopup && !isPopupElement && !isTranslateButton) {
          console.log("Click outside popup detected, will close in 200ms");
          // Add a small delay to prevent immediate closing
          setTimeout(() => {
            if (
              this.popup &&
              !this.popup.contains(e.target) &&
              !e.target.closest(".meantran-popup") &&
              !e.target.closest(".meantran-translate-button") &&
              !this.isTransitioning
            ) {
              console.log("Closing popup due to outside click");
              this.hidePopup();
            } else {
              console.log("Not closing popup - conditions not met");
            }
          }, 200);
        }
      }
    });

    // Hide popup on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isVisible) {
        this.hidePopup();
      }
    });
  }

  handleTextSelection(e) {
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText && selectedText.length > 0) {
        this.selectedText = selectedText;
        this.selectionRect = selection.getRangeAt(0).getBoundingClientRect();
        this.showTranslateButton();
      } else if (this.isVisible) {
        this.hidePopup();
      }
    }, 100);
  }

  showTranslateButton() {
    this.hidePopup();

    const button = document.createElement("div");
    button.id = "meantran-translate-btn";
    button.innerHTML = "🌐 Translate";
    button.className = "meantran-translate-button";

    // Position the button near the selection
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    button.style.left = this.selectionRect.left + scrollX + "px";
    button.style.top = this.selectionRect.bottom + scrollY + 5 + "px";

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log("Translate button clicked");
      // Set transition flag to prevent popup from closing
      this.isTransitioning = true;
      // Small delay to ensure the click event is fully processed
      setTimeout(() => {
        this.showTranslationPopup();
        // Clear transition flag after popup is shown and settled
        setTimeout(() => {
          this.isTransitioning = false;
          console.log("Transition flag cleared");
        }, 500);
      }, 100);
    });

    document.body.appendChild(button);
    this.popup = button;
    this.isVisible = true;
  }

  showTranslationPopup() {
    console.log("showTranslationPopup called");

    // Remove the translate button but keep transition flag active
    this.removeTranslateButton();

    const popup = document.createElement("div");
    popup.id = "meantran-popup";
    popup.className = "meantran-popup";

    // Apply theme class
    const theme = this.settings?.colorTheme || "dark-blue";
    popup.classList.add(`meantran-theme-${theme}`);

    popup.innerHTML = `
      <div class="meantran-header">
        <span class="meantran-title">MeanTran</span>
        <button class="meantran-close">&times;</button>
      </div>
      <div class="meantran-content">
        <div class="meantran-original">
          <strong>Original:</strong> ${this.selectedText}
        </div>
        <div class="meantran-options">
          <h4 class="meantran-options-title">Rewrite Options</h4>
          <div class="meantran-options-grid">
            <button class="meantran-option-btn" data-style="formal">
              <span class="meantran-option-icon">📝</span>
              <span class="meantran-option-text">Formal</span>
            </button>
            <button class="meantran-option-btn" data-style="casual">
              <span class="meantran-option-icon">💬</span>
              <span class="meantran-option-text">Casual</span>
            </button>
            <button class="meantran-option-btn" data-style="professional">
              <span class="meantran-option-icon">💼</span>
              <span class="meantran-option-text">Professional</span>
            </button>
            <button class="meantran-option-btn" data-style="simple">
              <span class="meantran-option-icon">✨</span>
              <span class="meantran-option-text">Simple</span>
            </button>
            <button class="meantran-option-btn" data-style="academic">
              <span class="meantran-option-icon">🎓</span>
              <span class="meantran-option-text">Academic</span>
            </button>
            <button class="meantran-option-btn" data-style="creative">
              <span class="meantran-option-icon">🎨</span>
              <span class="meantran-option-text">Creative</span>
            </button>
          </div>
        </div>
        <div class="meantran-translation">
          <div class="meantran-loading">Translating...</div>
        </div>
      </div>
    `;

    // Position popup with better positioning logic
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // Ensure popup stays within viewport
    let leftPos = this.selectionRect.left + scrollX;
    let topPos = this.selectionRect.bottom + scrollY + 10;

    // Adjust if popup would go off-screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (leftPos + 300 > viewportWidth) {
      leftPos = viewportWidth - 320;
    }
    if (leftPos < 10) {
      leftPos = 10;
    }

    popup.style.left = leftPos + "px";
    popup.style.top = topPos + "px";
    popup.style.position = "absolute";
    popup.style.zIndex = "10001";

    // Prevent popup from closing on clicks inside it
    popup.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log("Popup clicked, preventing propagation");
    });

    // Also prevent events on all child elements
    popup.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    popup.addEventListener("mouseup", (e) => {
      e.stopPropagation();
    });

    // Add event listeners
    popup.querySelector(".meantran-close").addEventListener("click", (e) => {
      e.stopPropagation();
      console.log("Close button clicked");
      this.hidePopup();
    });

    // Add event listeners for option buttons
    const optionButtons = popup.querySelectorAll(".meantran-option-btn");
    optionButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const style = button.getAttribute("data-style");
        console.log("Option clicked:", style);

        // Remove active class from all buttons
        optionButtons.forEach((btn) => btn.classList.remove("active"));
        // Add active class to clicked button
        button.classList.add("active");

        // Translate with the selected style
        this.translateText(style, popup);
      });
    });

    // Add the popup to DOM and update state
    document.body.appendChild(popup);
    this.popup = popup;
    this.isVisible = true;

    // Start with default translation
    this.translateText("translate", popup);
  }

  async translateText(style, popup) {
    const translationDiv = popup.querySelector(".meantran-translation");
    translationDiv.innerHTML =
      '<div class="meantran-loading">Processing...</div>';

    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: "translate",
            text: this.selectedText,
            style: style,
          },
          resolve
        );
      });

      if (response.success) {
        let resultTitle = "Translation:";
        if (style !== "translate") {
          const styleName = style.charAt(0).toUpperCase() + style.slice(1);
          const targetLang = this.settings?.targetLanguage || "target language";
          resultTitle = `${styleName} rewrite (${targetLang}):`;
        }

        // Parse markdown in the response
        const parsedContent = this.parseMarkdown(response.translation);

        translationDiv.innerHTML = `
          <div class="meantran-result">
            <strong>${resultTitle}</strong>
            <div class="meantran-translation-text">${parsedContent}</div>
          </div>
        `;
      } else {
        translationDiv.innerHTML = `
          <div class="meantran-error">
            <strong>Error:</strong> ${response.error}
          </div>
        `;
      }
    } catch (error) {
      translationDiv.innerHTML = `
        <div class="meantran-error">
          <strong>Error:</strong> Failed to process text
        </div>
      `;
    }
  }

  hidePopup() {
    console.log("hidePopup called");
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
      this.isVisible = false;
      this.isTransitioning = false; // Reset transition flag
      console.log("Popup removed");
    }
  }

  removeTranslateButton() {
    console.log("removeTranslateButton called");
    if (this.popup && this.popup.id === "meantran-translate-btn") {
      this.popup.remove();
      this.popup = null;
      this.isVisible = false;
      // Don't reset isTransitioning flag here
      console.log("Translate button removed");
    }
  }
}

// Initialize the translation popup
const translationPopup = new TranslationPopup();
