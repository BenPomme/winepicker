# Icon Resources Setup

This document explains how to properly set up the icon resources required for the MyWine app.

## Fonts

The application uses standard Google Fonts (Inter and Outfit) which are automatically loaded from Google's CDN - no manual setup is required.

## Icon Resources

The application requires two app icons in PNG format:

- `app-icon-192.png` (192×192 pixels)
- `app-icon-512.png` (512×512 pixels)

These should be placed in the `/public/icons/` directory.

### Generating placeholder icons

If you don't have the production icons, you can generate placeholder icons using:

```bash
# Generate placeholder resources
npm run generate-icons
```

### Verifying icon setup

To verify that the icons are set up correctly:

```bash
# Run the resource checker
npm run check-resources

# Or verify manually
file public/icons/app-icon-192.png
file public/icons/app-icon-512.png
```

## Automatic Resource Checking

The application includes automatic resource checking:

- When running `npm install` (postinstall script)
- Before running `npm run dev` (predev script)
- Before running `npm run build` (prebuild script)

You can also manually check resources at any time:

```bash
npm run check-resources
```

## Troubleshooting

### Font Loading Issues

If you see errors like:

```
Failed to decode downloaded font: https://pickmywine-live.web.app/fonts/CalSans-SemiBold.woff2
OTS parsing error: invalid sfntVersion: 1008813135
```

This indicates that the font file is missing or corrupted. Make sure to:

1. Download the proper CalSans font from Fontshare
2. Place it in the correct location (`/public/fonts/CalSans-SemiBold.woff2`)
3. Check that the file is a valid woff2 font file

### Icon Loading Issues

If you see errors like:

```
Error while trying to use the following icon from the Manifest: https://pickmywine-live.web.app/icons/app-icon-192.png (Download error or resource isn't a valid image)
```

This indicates that the icon files are missing or invalid. Make sure to:

1. Generate placeholder icons if needed: `npm run generate-icons`
2. Verify that the icon files exist in `/public/icons/`
3. Check that the files are valid PNG images