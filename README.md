# MeanTran - Smart Text Translator Chrome Extension

A Chrome extension that translates selected text using Google's Gemini AI with customizable translation preferences.

## Features

- 🌐 **Smart Text Selection**: Simply select any text on a webpage to see translation options
- 🤖 **Gemini AI Powered**: Uses Google's advanced Gemini AI for accurate translations
- 🎯 **Custom Prompts**: Add custom translation instructions for specific needs
- 🌍 **Multiple Languages**: Support for 15+ languages including English, Spanish, French, German, Japanese, Chinese, and more
- ⚙️ **Customizable Settings**: Choose translation style (natural, literal, or contextual)
- 💾 **Persistent Settings**: Your preferences are saved and synced across devices

## Installation

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key for use in the extension

2. **Install the Extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `meantran` folder
   - The extension icon should appear in your toolbar

3. **Configure the Extension**:
   - Click the MeanTran extension icon
   - Enter your Gemini API key
   - Configure your translation preferences
   - Click "Save Settings"

## Usage

### Basic Translation
1. Select any text on a webpage
2. Click the "🌐 Translate" button that appears
3. View the translation in the popup

### Custom Translation
1. Select text as above
2. In the translation popup, enter a custom prompt (e.g., "Translate to formal Spanish for business use")
3. Click "Translate with Custom Prompt"

### Settings
- **Target Language**: Choose your preferred translation language
- **Translation Style**: 
  - Natural & Fluent: Easy-to-read translations
  - Literal: Word-for-word translations
  - Contextual & Cultural: Translations that consider cultural context
- **Auto-detect source language**: Automatically identify the original language
- **Show original text**: Include the original text in translation results

## Supported Languages

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Japanese (ja)
- Korean (ko)
- Chinese Simplified (zh)
- Chinese Traditional (zh-TW)
- Arabic (ar)
- Hindi (hi)
- Thai (th)
- Vietnamese (vi)

## Technical Details

### Files Structure
```
meantran/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for API calls
├── content.js            # Content script for text selection
├── content.css           # Styles for translation popup
├── popup.html            # Settings page HTML
├── popup.css             # Settings page styles
├── popup.js              # Settings page functionality
├── icons/                # Extension icons
└── README.md             # This file
```

### Permissions
- `activeTab`: Access to the current tab for text selection
- `storage`: Store API key and user preferences
- `scripting`: Inject content scripts
- `https://generativelanguage.googleapis.com/*`: Access to Gemini API

## Privacy & Security

- Your API key is stored locally and never shared
- Text is only sent to Google's Gemini API for translation
- No tracking or analytics are implemented
- All data remains on your device except for API calls

## Development

To modify or extend the extension:

1. Clone or download the source code
2. Make your changes
3. Reload the extension in `chrome://extensions/`
4. Test your changes

### Key Components

- **Background Script** (`background.js`): Handles API communication with Gemini
- **Content Script** (`content.js`): Manages text selection and popup display
- **Popup** (`popup.html/js/css`): Extension settings and configuration

## Troubleshooting

### Common Issues

1. **"API key not configured" error**:
   - Make sure you've entered a valid Gemini API key in settings
   - Verify the API key has proper permissions

2. **Translation not working**:
   - Check your internet connection
   - Verify the API key is correct
   - Try refreshing the webpage

3. **Popup not appearing**:
   - Make sure you've selected text (not just clicked)
   - Try selecting text again
   - Check if the page allows content scripts

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key is working with the test function
3. Try disabling other extensions temporarily

## API Usage

This extension uses the Google Gemini API. Please be aware of:
- API usage limits and pricing
- Google's terms of service
- Rate limiting for free tier users

## License

This project is open source. Feel free to modify and distribute according to your needs.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or report issues.

---

**Note**: This extension requires a Google Gemini API key to function. The extension is not affiliated with Google.
