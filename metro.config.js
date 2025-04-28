/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * This config is necessary for Metro to work properly in a
 * Next.js + React Native Web hybrid app setup.
 */

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  // Add resolver config to ensure Next.js components work properly
  resolver: {
    resolverMainFields: ['browser', 'main', 'react-native'],
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
  },
};