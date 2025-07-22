// Popup script for MeanTran extension settings

class SettingsManager {
  constructor() {
    this.defaultSettings = {
      targetLanguage: "en",
      translationStyle: "natural",
      showOriginal: true,
      autoDetectLanguage: true,
      colorTheme: "dark-blue",
    };

    this.initialize();
  }

  async initialize() {
    await this.loadSettings();
    this.bindEvents();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(["apiKey", "settings"]);

      // Load API key
      if (result.apiKey) {
        document.getElementById("apiKey").value = result.apiKey;
      }

      // Load settings
      const settings = { ...this.defaultSettings, ...result.settings };

      document.getElementById("targetLanguage").value = settings.targetLanguage;
      document.getElementById("translationStyle").value =
        settings.translationStyle;
      document.getElementById("autoDetectLanguage").checked =
        settings.autoDetectLanguage;
      document.getElementById("showOriginal").checked = settings.showOriginal;
      document.getElementById("colorTheme").value = settings.colorTheme;
    } catch (error) {
      console.error("Error loading settings:", error);
      this.showStatus("Error loading settings", "error");
    }
  }

  async saveSettings() {
    try {
      const apiKey = document.getElementById("apiKey").value.trim();
      const settings = {
        targetLanguage: document.getElementById("targetLanguage").value,
        translationStyle: document.getElementById("translationStyle").value,
        autoDetectLanguage:
          document.getElementById("autoDetectLanguage").checked,
        showOriginal: document.getElementById("showOriginal").checked,
        colorTheme: document.getElementById("colorTheme").value,
      };

      await chrome.storage.sync.set({ apiKey, settings });
      this.showStatus("Settings saved successfully!", "success");
    } catch (error) {
      console.error("Error saving settings:", error);
      this.showStatus("Error saving settings", "error");
    }
  }

  bindEvents() {
    // Save settings button
    document.getElementById("saveSettings").addEventListener("click", () => {
      this.saveSettings();
    });

    // Test translation button
    document.getElementById("testTranslation").addEventListener("click", () => {
      this.openTestModal();
    });

    // Test modal events
    document.getElementById("runTest").addEventListener("click", () => {
      this.runTest();
    });

    // Modal close events
    document.querySelector(".close").addEventListener("click", () => {
      this.closeTestModal();
    });

    window.addEventListener("click", (event) => {
      const modal = document.getElementById("testModal");
      if (event.target === modal) {
        this.closeTestModal();
      }
    });

    // Auto-save on input changes
    const inputs = document.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      input.addEventListener("change", () => {
        // Debounce auto-save
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
          this.saveSettings();
        }, 1000);
      });
    });
  }

  openTestModal() {
    document.getElementById("testModal").style.display = "block";
    document.getElementById("testResult").style.display = "none";
  }

  closeTestModal() {
    document.getElementById("testModal").style.display = "none";
  }

  async runTest() {
    const testText = document.getElementById("testText").value.trim();
    const customPrompt = document.getElementById("customPrompt").value.trim();
    const resultDiv = document.getElementById("testResult");

    if (!testText) {
      this.showTestResult("Please enter text to translate", "error");
      return;
    }

    // Show loading state
    resultDiv.style.display = "block";
    resultDiv.className = "test-result";
    resultDiv.textContent = "Translating...";

    try {
      // Send translation request to background script
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: "translate",
            text: testText,
            customPrompt: customPrompt || null,
          },
          resolve
        );
      });

      if (response.success) {
        this.showTestResult(response.translation, "success");
      } else {
        this.showTestResult(`Error: ${response.error}`, "error");
      }
    } catch (error) {
      this.showTestResult(`Error: ${error.message}`, "error");
    }
  }

  showTestResult(message, type) {
    const resultDiv = document.getElementById("testResult");
    resultDiv.style.display = "block";
    resultDiv.className = `test-result ${type === "error" ? "error" : ""}`;
    resultDiv.textContent = message;
  }

  showStatus(message, type) {
    const status = document.getElementById("status");
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = "block";

    // Auto-hide success messages
    if (type === "success") {
      setTimeout(() => {
        status.style.display = "none";
      }, 3000);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SettingsManager();
});
