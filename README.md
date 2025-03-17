# Pick My Wine

An elegant wine selection app to help you find the perfect wine for any occasion.

## Features

- **Wine Recognition**: Take a photo of a wine menu or bottle to instantly get ratings
- **Wine Pairing**: Select your preferences to get personalized wine recommendations
- **Detailed Information**: Get comprehensive details about each wine, including ratings, price, and reviews
- **Modern Interface**: Enjoy a sleek, music-player inspired design
- **Splash Screen**: Engaging animated splash screen for a polished user experience
- **Monetization**: Elegant ad integration that doesn't interfere with the user experience
- **Web Support**: Fully functional web version with responsive design

## Setup

### OpenAI API Key

This app uses OpenAI's API for wine analysis. To set up your own API key:

1. Copy the `.env.example` file to `.env`
2. Replace the placeholder with your actual OpenAI API key
3. Restart the app

Never commit your actual API key to Git. The `.env` file is already in the `.gitignore`.

## How to Use

1. **Scan Wines**: Tap the camera icon to take a photo of a wine menu or select one from your gallery
2. **View Ratings**: See instant ratings and reviews for each wine detected
3. **Set Preferences**: Tap the wine glass icon to set your pairing preferences (meat, fish, etc.)
4. **Explore Details**: Tap on any wine card to see detailed information
5. **Filter Options**: Use the filter icon to find wines within your price range
6. **Sort Wines**: Tap the sort icon to arrange wines by rating, price, or preference match

## Platform Support

- **Mobile**: Native iOS and Android apps with full functionality
- **Web**: Responsive web version with all core features
- **Desktop**: Support for macOS, Windows, and Linux platforms

## Recent Improvements

- Enhanced error handling for more reliable wine recognition
- Improved web initialization for better cross-platform compatibility
- Added splash screen for a more engaging startup experience
- Integrated monetization with non-intrusive ads
- Fixed JSON parsing issues for more reliable API responses

Check the [CHANGELOG.md](CHANGELOG.md) for a detailed list of all changes.

## Beta Testing Notes

This is version 1.1.0 of Pick My Wine. As a beta tester, your feedback is invaluable! Please note:

- This is a testing version and may contain bugs
- Wine recognition works best on clear, well-lit images of wine lists or bottles
- Please report any issues or suggestions to the developer

Thank you for helping test Pick My Wine!
