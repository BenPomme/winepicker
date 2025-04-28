const fs = require('fs');
const path = require('path');

// Create a very simple placeholder PNG
const createSimplePNG = (width, height) => {
  // PNG header (8 bytes)
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrChunk = Buffer.from('0000000D4948445200000000000000000806000000000000000000','hex');
  // Fix the dimensions in the IHDR chunk
  ihdrChunk.writeUInt32BE(width, 8);
  ihdrChunk.writeUInt32BE(height, 12);
  
  // IDAT chunk with minimal empty data (just enough to make a valid PNG)
  const idatChunk = Buffer.from('0000000849444154789C63000100000500010000000000','hex');
  
  // IEND chunk
  const iendChunk = Buffer.from('00000000494E4445AE426082','hex');
  
  // Combine all parts
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
};

// Generate icons
console.log('Generating placeholder app icons...');
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure the icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create placeholder icons
const icon192 = createSimplePNG(192, 192);
const icon512 = createSimplePNG(512, 512);

// Write the icon files
fs.writeFileSync(path.join(iconsDir, 'app-icon-192.png'), icon192);
fs.writeFileSync(path.join(iconsDir, 'app-icon-512.png'), icon512);

console.log('Placeholder icons generated successfully at:');
console.log(`- ${path.join(iconsDir, 'app-icon-192.png')}`);
console.log(`- ${path.join(iconsDir, 'app-icon-512.png')}`);

// Clean up any old font placeholder files that might exist
const fontsDir = path.join(__dirname, '../public/fonts');
const fontPlaceholder = path.join(fontsDir, 'CalSans-SemiBold.woff2.placeholder');

if (fs.existsSync(fontPlaceholder)) {
  try {
    fs.unlinkSync(fontPlaceholder);
    console.log('\nRemoved old font placeholder file (no longer needed).');
  } catch (err) {
    console.error('Could not remove old placeholder file:', err);
  }
}