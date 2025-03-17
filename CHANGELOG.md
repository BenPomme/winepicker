# Changelog

## [1.1.0] - 2024-03-17

### Added
- Splash screen with animated logo for improved user experience
- AdBannerWidget for elegant monetization on native platforms
- Enhanced error handling for OpenAI API responses
- Markdown code block stripping for robust JSON parsing

### Fixed
- Removed duplicate "picture" entry on the home page
- Fixed web initialization issues with service worker
- Resolved JSON parsing errors when receiving markdown-formatted responses
- Improved error handling and fallback to demo wines when API fails

### Changed
- Updated OpenAI system prompt to explicitly request raw JSON without markdown
- Enhanced JSON sanitization to handle various formatting issues
- Improved web app loading with proper Flutter initialization
- Added responsive design elements for better cross-platform experience

### Technical Improvements
- Added Google Mobile Ads integration
- Fixed Flutter web initialization in index.html
- Added proper error handling for image processing
- Enhanced API response parsing with multiple fallback strategies 