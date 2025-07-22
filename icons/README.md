# Icon Creation Guide

Since Chrome extensions work best with PNG icons, you'll need to convert the SVG files to PNG format.

## Option 1: Online Conversion
1. Go to https://convertio.co/svg-png/ or similar online converter
2. Upload each SVG file (icon16.svg, icon48.svg, icon128.svg)
3. Convert to PNG format
4. Download and rename to icon16.png, icon48.png, icon128.png

## Option 2: Using Inkscape (if installed)
```bash
inkscape -w 16 -h 16 icon16.svg -o icon16.png
inkscape -w 48 -h 48 icon48.svg -o icon48.png
inkscape -w 128 -h 128 icon128.svg -o icon128.png
```

## Option 3: Use any graphics editor
- Open each SVG in GIMP, Photoshop, or similar
- Export as PNG with the correct dimensions
- Save as icon16.png, icon48.png, icon128.png

## Temporary Solution
For testing purposes, you can temporarily use any PNG images renamed to:
- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels) 
- icon128.png (128x128 pixels)

The extension will work without icons, but they improve the user experience.
