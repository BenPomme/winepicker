// This is a stub file for web platform to replace google_ml_kit functionality
// This allows the app to compile for web without using the unsupported ML Kit libraries

// Create placeholder classes/methods to match the interface used in the app
class TextRecognizer {
  Future<RecognizedText> processImage(dynamic image) async {
    // Return an empty response for web
    return RecognizedText(text: 'Web platform simulation', blocks: []);
  }

  void close() {
    // No-op for web
  }
}

class RecognizedText {
  final String text;
  final List<TextBlock> blocks;

  RecognizedText({required this.text, required this.blocks});
}

class TextBlock {
  final String text;
  final List<TextLine> lines;

  TextBlock({required this.text, required this.lines});
}

class TextLine {
  final String text;
  final List<TextElement> elements;

  TextLine({required this.text, required this.elements});
}

class TextElement {
  final String text;

  TextElement({required this.text});
}

// Placeholder for the ML Kit library
class GoogleMlKit {
  static final GoogleMlKit _instance = GoogleMlKit._();
  static GoogleMlKit get instance => _instance;

  GoogleMlKit._();

  TextRecognizer textRecognizer() {
    return TextRecognizer();
  }
}

// Export the instance for use
final googleMlKit = GoogleMlKit.instance;
