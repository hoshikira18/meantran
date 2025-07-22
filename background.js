// Background script for handling API calls and extension logic
class GeminiTranslator {
  constructor() {
    this.apiKey = null;
    this.defaultSettings = {
      targetLanguage: "en",
      translationStyle: "natural",
      showOriginal: true,
      autoDetectLanguage: true,
      colorTheme: "dark-blue",
    };
  }

  async initialize() {
    const result = await chrome.storage.sync.get(["apiKey", "settings"]);
    this.apiKey = result.apiKey;
    this.settings = { ...this.defaultSettings, ...result.settings };
  }

  async translateText(text, style = "translate") {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const prompt = this.buildPromptForStyle(text, style);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Translation error:", error);
      throw error;
    }
  }

  buildPromptForStyle(text, style) {
    const { targetLanguage } = this.settings;

    const stylePrompts = {
      translate: `Translate the following text to ${targetLanguage}. Provide a natural, fluent translation:\n\n"${text}"`,

      formal: `Translate the following text to ${targetLanguage} and rewrite it in a formal, professional tone while maintaining the original meaning:\n\n"${text}"`,

      casual: `Translate the following text to ${targetLanguage} and rewrite it in a casual, friendly, conversational tone:\n\n"${text}"`,

      professional: `Translate the following text to ${targetLanguage} and rewrite it for a professional business context, making it clear and authoritative:\n\n"${text}"`,

      simple: `Translate the following text to ${targetLanguage} and rewrite it using simple, easy-to-understand language that anyone can comprehend:\n\n"${text}"`,

      academic: `Translate the following text to ${targetLanguage} and rewrite it in an academic, scholarly tone with precise language and formal structure:\n\n"${text}"`,

      creative: `Translate the following text to ${targetLanguage} and rewrite it in a creative, engaging, and expressive way while preserving the core message:\n\n"${text}"`,
    };

    return stylePrompts[style] || stylePrompts.translate;
  }

  buildDefaultPrompt(text) {
    const { targetLanguage, translationStyle, autoDetectLanguage } =
      this.settings;

    let prompt = `Translate the following text to ${targetLanguage}`;

    if (autoDetectLanguage) {
      prompt += " (auto-detect source language)";
    }

    if (translationStyle === "literal") {
      prompt += ". Provide a literal, word-for-word translation:";
    } else if (translationStyle === "contextual") {
      prompt +=
        ". Provide a contextual translation that captures the meaning and cultural nuances:";
    } else {
      prompt += ". Provide a natural, fluent translation:";
    }

    prompt += `\n\n"${text}"`;

    if (this.settings.showOriginal) {
      prompt +=
        "\n\nFormat the response as:\nTranslation: [translated text]\nOriginal: [original text]";
    }

    return prompt;
  }
}

const translator = new GeminiTranslator();

// Initialize when extension starts
chrome.runtime.onStartup.addListener(async () => {
  await translator.initialize();
});

chrome.runtime.onInstalled.addListener(async () => {
  await translator.initialize();
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate") {
    translator
      .initialize()
      .then(() => {
        return translator.translateText(request.text, request.style);
      })
      .then((result) => {
        sendResponse({ success: true, translation: result });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  if (request.action === "getSettings") {
    translator.initialize().then(() => {
      sendResponse({
        settings: translator.settings,
        hasApiKey: !!translator.apiKey,
      });
    });
    return true;
  }
});

// Handle storage changes
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === "sync") {
    await translator.initialize();
  }
});
