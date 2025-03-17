import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:math' as math;
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:share_plus/share_plus.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

// Conditionally import platform-specific libraries
import 'dart:io' if (dart.library.html) 'dart:html' as io;

// This import causes issues in web - use conditionally
import 'package:google_ml_kit/google_ml_kit.dart'
    if (dart.library.html) 'web_ml_kit_stub.dart' as ml_kit;

// OpenAI API key should be provided via environment variables or secure storage
// For development, we'll load it from the .env file using flutter_dotenv
String openAIApiKey = 'undefined'; // Will be loaded from .env file

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize mobile ads
  if (!kIsWeb) {
    await MobileAds.instance.initialize();
  }

  // Load environment variables from .env file
  await dotenv.load(fileName: ".env");

  // Get API key from .env file
  openAIApiKey = dotenv.env['OPENAI_API_KEY'] ?? 'undefined';

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pick My Wine',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF3333CC), // Deep blue as primary color
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF3333CC), // Deep blue background
          elevation: 0,
          foregroundColor: Colors.white,
          titleTextStyle: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: 24,
            letterSpacing: 0.5,
          ),
        ),
        scaffoldBackgroundColor:
            const Color(0xFF3333CC), // Deep blue background
        cardTheme: CardTheme(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          color: const Color(0xFF4444DD), // Slightly lighter blue for cards
        ),
        textTheme: const TextTheme(
          headlineMedium: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 28,
          ),
          titleLarge: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 22,
          ),
          bodyLarge: TextStyle(
            color: Colors.white,
            fontSize: 16,
          ),
          bodyMedium: TextStyle(
            color: Colors.white70,
            fontSize: 14,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF00CCFF), // Bright cyan for buttons
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          ),
        ),
      ),
      home: const WineApp(),
    );
  }
}

class Wine {
  final String name;
  final String? year;
  final String? winery;
  final String? grapeVariety;
  final String? region;
  final String rawText;
  final WineRating? rating;
  final Map<String, double> pairingScores; // Added pairing scores

  Wine({
    required this.name,
    this.year,
    this.winery,
    this.grapeVariety,
    this.region,
    required this.rawText,
    this.rating,
    Map<String, double>? pairingScores,
  }) : pairingScores = pairingScores ?? {};

  @override
  String toString() {
    return '$name (${year ?? "Unknown Year"}) - ${winery ?? "Unknown Winery"} - ${grapeVariety ?? "Unknown Grape"} - ${region ?? "Unknown Region"}';
  }
}

class WineRating {
  final double score;
  final String source;
  final String? review;
  final double? price;
  final bool isPriceValue;
  final Map<String, double> profile; // Added for wine profile characteristics

  WineRating({
    required this.score,
    required this.source,
    this.review,
    this.price,
    this.isPriceValue = false,
    Map<String, double>? profile,
  }) : profile = profile ?? {};
}

// Banner Ad Widget for monetization
class AdBannerWidget extends StatefulWidget {
  const AdBannerWidget({Key? key}) : super(key: key);

  @override
  _AdBannerWidgetState createState() => _AdBannerWidgetState();
}

class _AdBannerWidgetState extends State<AdBannerWidget> {
  BannerAd? _bannerAd;
  bool _isAdLoaded = false;

  @override
  void initState() {
    super.initState();
    _loadBannerAd();
  }

  void _loadBannerAd() {
    // Test ad unit ID for development - replace with your real ad unit ID in production
    const adUnitId = kIsWeb
        ? 'ca-app-pub-3940256099942544/6300978111' // Web test ID
        : 'ca-app-pub-3940256099942544/2934735716'; // Mobile test ID

    _bannerAd = BannerAd(
      adUnitId: adUnitId,
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          setState(() {
            _isAdLoaded = true;
          });
        },
        onAdFailedToLoad: (ad, error) {
          ad.dispose();
          print('Ad failed to load: $error');
        },
      ),
    );

    _bannerAd?.load();
  }

  @override
  Widget build(BuildContext context) {
    return _isAdLoaded && _bannerAd != null
        ? Container(
            margin: const EdgeInsets.symmetric(vertical: 10),
            alignment: Alignment.center,
            width: _bannerAd!.size.width.toDouble(),
            height: _bannerAd!.size.height.toDouble(),
            child: AdWidget(ad: _bannerAd!),
          )
        : const SizedBox.shrink();
  }

  @override
  void dispose() {
    _bannerAd?.dispose();
    super.dispose();
  }
}

// Splash Screen for initial loading
class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );
    _animation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
    _animationController.repeat(reverse: true);

    // Navigate to main app after delay
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const WineMenuScannerPage()),
        );
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF3333CC),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Animated logo
            ScaleTransition(
              scale: _animation,
              child: const Icon(
                Icons.wine_bar,
                size: 120,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Pick My Wine',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                letterSpacing: 1.5,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Your personal wine sommelier',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white70,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 48),
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF00CCFF)),
            ),
          ],
        ),
      ),
    );
  }
}

class WineApp extends StatelessWidget {
  const WineApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const SplashScreen();
  }
}

class WineMenuScannerPage extends StatefulWidget {
  const WineMenuScannerPage({Key? key}) : super(key: key);

  @override
  _WineMenuScannerPageState createState() => _WineMenuScannerPageState();
}

class _WineMenuScannerPageState extends State<WineMenuScannerPage> {
  final ImagePicker _picker = ImagePicker();
  XFile? _imageFile;
  List<Wine> _originalWines = [];
  List<Wine> _wines = [];
  bool _isProcessing = false;
  final bool _showOnlyBestValue = false;
  final bool _hasAppliedPriceFilter = false;
  final RangeValues _priceRange = const RangeValues(10, 200);
  final String _sortOption = 'default'; // default, rating, price-asc, price-desc
  final String _ocrText = ''; // Added for OCR text storage

  // Add user preference state variables
  final Map<String, bool> _pairingPreferences = {
    'meat': false,
    'fish': false,
    'sweet': false,
    'dry': false,
    'fruity': false,
    'light': false,
    'full-bodied': false,
  };
  bool _usePreferences = false;

  @override
  Widget build(BuildContext context) {
    // Determine if we're on a phone-sized screen
    final isPhone = MediaQuery.of(context).size.width < 600;

    // Determine the top wine (best value or first in the list)
    Wine? topWine;
    if (_wines.isNotEmpty) {
      if (_usePreferences) {
        // Find the wine with the highest pairing score for selected preferences
        topWine = _findBestPairingWine(_wines, _pairingPreferences);
      } else {
        // Original logic - find best value wine
        topWine = _wines.firstWhere(
          (wine) => wine.rating?.isPriceValue == true,
          orElse: () => _wines.first,
        );
      }
    }

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Pick My Wine'),
        actions: [
          if (_wines.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: CircleAvatar(
                backgroundColor: Colors.white.withOpacity(0.2),
                child: IconButton(
                  icon: const Icon(Icons.wine_bar, color: Colors.white),
                  onPressed: _showPairingPreferences,
                  tooltip: 'Wine Pairing Preferences',
                ),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(isPhone ? 16.0 : 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Page title
              Padding(
                padding: const EdgeInsets.only(bottom: 24.0),
                child: Text(
                  'Wine Selection',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
              ),

              // Image selection container - Single instance
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                height: isPhone ? 150 : 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFF4444DD), // Lighter blue
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: const Color(0xFF00CCFF), // Bright cyan
                          borderRadius: BorderRadius.circular(30),
                        ),
                        child: IconButton(
                          icon: const Icon(Icons.image_search,
                              size: 30, color: Colors.white),
                          onPressed: _isProcessing ? null : _pickMenuImage,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Select Wine Image',
                        style: TextStyle(
                          fontSize: isPhone ? 14 : 16,
                          color: Colors.white,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Ad banner widget - Elegantly placed
              if (!_isProcessing &&
                  !kIsWeb) // Only show on native platforms for now
                const AdBannerWidget(),

              // Processing indicator
              if (_isProcessing)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24.0),
                    child: Column(
                      children: [
                        const CircularProgressIndicator(
                            valueColor: AlwaysStoppedAnimation<Color>(
                                Color(0xFF00CCFF))),
                        const SizedBox(height: 16),
                        Text(
                          'Analyzing wine bottles, please wait...',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w500,
                            fontSize: isPhone ? 14 : 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // Placeholder message for no wines
              if (!_isProcessing && _wines.isEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(24),
                  margin: const EdgeInsets.only(top: 32),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4444DD),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.wine_bar_outlined,
                          size: 64, color: Colors.white.withOpacity(0.7)),
                      const SizedBox(height: 16),
                      const Text(
                        'Welcome to Pick My Wine!',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Take a photo of a wine menu or bottle label to get ratings and recommendations.',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.white,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.camera_alt),
                        label: const Text('Select an Image'),
                        onPressed: _pickMenuImage,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 16),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // Display wine list when available
              if (!_isProcessing && _wines.isNotEmpty) ...[
                // Top recommended wine card
                if (topWine != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 24),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF00CCFF).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFF00CCFF),
                        width: 2,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(
                              Icons.recommend,
                              color: Color(0xFF00CCFF),
                              size: 24,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _usePreferences
                                        ? 'Best Match for Your Preferences'
                                        : 'Recommended Wine',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF00CCFF),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    topWine.name,
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            if (topWine.winery != null)
                              _buildInfoChip(Icons.house, topWine.winery!),
                            if (topWine.year != null)
                              _buildInfoChip(
                                  Icons.calendar_today, topWine.year!),
                            if (topWine.region != null)
                              _buildInfoChip(Icons.place, topWine.region!),
                            if (topWine.grapeVariety != null)
                              _buildInfoChip(Icons.eco, topWine.grapeVariety!),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (topWine.rating != null) ...[
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFD700),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.star,
                                        size: 16, color: Colors.black),
                                    const SizedBox(width: 4),
                                    Text(
                                      topWine.rating!.score.toString(),
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                topWine.rating!.source,
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: Colors.white,
                                ),
                              ),
                              const Spacer(),
                              if (topWine.rating!.price != null)
                                Text(
                                  '\$${topWine.rating!.price!.toStringAsFixed(0)}',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                            ],
                          ),
                          if (topWine.rating!.review != null) ...[
                            const SizedBox(height: 12),
                            Text(
                              topWine.rating!.review!,
                              style: const TextStyle(
                                fontSize: 14,
                                fontStyle: FontStyle.italic,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ],
                      ],
                    ),
                  ),

                // Other wines list
                ...List.generate(
                  _wines.length,
                  (index) {
                    final wine = _wines[index];
                    // Skip the top wine to avoid duplication
                    if (topWine != null && wine.name == topWine.name) {
                      return const SizedBox.shrink();
                    }

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF4444DD),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        title: Text(
                          wine.name,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            if (wine.winery != null)
                              Text(
                                wine.winery!,
                                style: const TextStyle(
                                  color: Colors.white70,
                                ),
                              ),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                if (wine.year != null)
                                  _buildInfoChip(
                                      Icons.calendar_today, wine.year!),
                                if (wine.region != null)
                                  _buildInfoChip(Icons.place, wine.region!),
                              ],
                            ),
                          ],
                        ),
                        trailing: wine.rating != null
                            ? Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFFD700),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      wine.rating!.score.toString(),
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  if (wine.rating!.price != null)
                                    Text(
                                      '\$${wine.rating!.price!.toStringAsFixed(0)}',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        color: Colors.white,
                                      ),
                                    ),
                                ],
                              )
                            : null,
                      ),
                    );
                  },
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // Method to handle image picking
  Future<void> _pickMenuImage() async {
    try {
      if (kIsWeb) {
        print('Running in web environment');
      } else {
        print('Running in mobile environment');
      }

      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1800,
        maxHeight: 1800,
      );

      if (pickedFile != null) {
        print('Image picked successfully: ${pickedFile.name}');
        setState(() {
          _imageFile = pickedFile;
          _isProcessing = true;
        });

        try {
          // For web, we need to handle things differently than native platforms
          if (kIsWeb) {
            // Web platform - simulate OpenAI processing with a delay
            print('Web platform detected, using OpenAI API simulation');
            await Future.delayed(
                const Duration(seconds: 2)); // Simulate processing

            if (openAIApiKey != 'undefined' &&
                openAIApiKey != 'your_openai_api_key_here') {
              // Use OpenAI API if key is valid
              await _processWithOpenAI();
            } else {
              // Fallback to demo data
              print('No valid OpenAI API key found, using demo data');
              _processWebDemoWines();
            }
          } else {
            // Mobile platforms - try using ML Kit + OpenAI
            print('Mobile platform detected, attempting OCR + OpenAI');

            if (openAIApiKey != 'undefined' &&
                openAIApiKey != 'your_openai_api_key_here') {
              // Use ML Kit + OpenAI
              await _processWithOpenAI();
            } else {
              // Fallback to demo data
              print('No valid OpenAI API key found, using demo data');
              _processWebDemoWines();
            }
          }
        } catch (e) {
          print('Error processing image: $e');
          if (mounted) {
            setState(() {
              _isProcessing = false;
            });

            // Show an error message
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Failed to process image: ${e.toString()}'),
                backgroundColor: Colors.red,
              ),
            );
          }

          // Still show demo wines even if there's an error
          print('Showing demo wines despite error');
          _processWebDemoWines();
        }
      } else {
        print('No image was selected');
      }
    } catch (e) {
      print('Error picking image: $e');
      setState(() {
        _isProcessing = false;
      });

      // Show error dialog
      if (mounted) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: const Text('Error'),
              content: Text('Failed to pick image: ${e.toString()}'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('OK'),
                ),
              ],
            );
          },
        );
      }
    }
  }

  // Method to process image with OpenAI API
  Future<void> _processWithOpenAI() async {
    print('Processing with OpenAI API...');
    print('Using API key: ${openAIApiKey.substring(0, 10)}...');

    try {
      if (_imageFile == null) {
        print('No image file available to process');
        _processWebDemoWines();
        return;
      }

      // Get image bytes
      List<int> imageBytes;
      if (kIsWeb) {
        // Handle Web platform differently
        final blob = await _imageFile!.readAsBytes();
        imageBytes = blob;
      } else {
        // Mobile platforms
        imageBytes = await _imageFile!.readAsBytes();
      }

      // Convert image bytes to base64
      final base64Image = base64Encode(imageBytes);
      print('Image converted to base64, size: ${base64Image.length} chars');

      // Call OpenAI Vision API
      final response = await http.post(
        Uri.parse('https://api.openai.com/v1/chat/completions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $openAIApiKey',
        },
        body: jsonEncode({
          'model': 'gpt-4o',
          'messages': [
            {
              'role': 'system',
              'content':
                  'You are a wine expert assistant that can recognize wines from images. When given an image of a wine menu, wine bottle, or wine label, extract the wine information and return it in JSON format. Include name, winery, year, region, grape variety if visible, and assign a rating score from 1-100 based on your expert knowledge. IMPORTANT: Return ONLY a raw JSON array without any markdown formatting, explanation, or code blocks. DO NOT use ```json or ``` tags. JUST RETURN THE RAW JSON ARRAY.'
            },
            {
              'role': 'user',
              'content': [
                {
                  'type': 'text',
                  'text':
                      'Analyze this wine image and extract information about the wines you can see. Return the data as JSON.'
                },
                {
                  'type': 'image_url',
                  'image_url': {'url': 'data:image/jpeg;base64,$base64Image'}
                }
              ]
            }
          ],
          'max_tokens': 1000,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final content = data['choices'][0]['message']['content'];
        print('OpenAI Vision response: $content');

        try {
          // Try to parse the JSON response
          final truncatedContent = content.length > 100
              ? '${content.substring(0, 100)}...'
              : content;
          print('Attempting to parse JSON: $truncatedContent');

          // Clean up the content by removing markdown formatting if present
          String cleanContent = content;
          // Remove markdown code blocks (```json and ```)
          if (cleanContent.contains('```')) {
            cleanContent =
                cleanContent.replaceAll('```json', '').replaceAll('```', '');
            print('Removed markdown code blocks from response');
          }
          // Trim whitespace
          cleanContent = cleanContent.trim();

          final List<dynamic> wineData = jsonDecode(cleanContent);
          print('JSON decoded successfully with ${wineData.length} wines');

          // Convert the JSON data to Wine objects
          final wines = wineData.map<Wine>((wine) {
            // Handle field variations for grape variety
            final grapeVariety = wine['grape_variety'] ??
                wine['grapeVariety'] ??
                wine['grape'] ??
                '';

            return Wine(
              name: wine['name'] ?? 'Unknown Wine',
              winery: wine['winery'] ?? '',
              year: wine['year']?.toString() ?? '',
              region: wine['region'] ?? '',
              grapeVariety: grapeVariety,
              rawText: wine['raw_text'] ?? wine['rawText'] ?? '',
              rating: WineRating(
                score: (wine['rating'] is Map)
                    ? (wine['rating']['score'] ?? 90).toDouble()
                    : (wine['rating'] ?? 90).toDouble(),
                source: (wine['rating'] is Map)
                    ? wine['rating']['source'] ?? 'AI Analysis'
                    : 'AI Analysis',
                review:
                    (wine['rating'] is Map) ? wine['rating']['review'] : null,
                price: _parsePrice(wine['price']),
                isPriceValue:
                    wine['is_price_value'] ?? wine['isPriceValue'] ?? false,
                profile: {
                  'meat': 7.0,
                  'fish': 7.0,
                  'sweet': 5.0,
                  'dry': 5.0,
                  'fruity': 5.0,
                  'light': 5.0,
                  'full-bodied': 5.0,
                },
              ),
              pairingScores: {
                'meat': 7.0,
                'fish': 7.0,
                'sweet': 5.0,
                'dry': 5.0,
                'fruity': 5.0,
                'light': 5.0,
                'full-bodied': 5.0,
              },
            );
          }).toList();

          if (wines.isNotEmpty) {
            setState(() {
              _originalWines = wines;
              _wines = List.from(wines);
              _isProcessing = false;
            });
            return;
          }
        } catch (e) {
          print('Error parsing OpenAI response: $e');
          print('Full response content: $content');

          // Try to sanitize the JSON and retry
          try {
            String sanitizedContent = content;

            // Remove markdown formatting
            if (sanitizedContent.contains('```')) {
              sanitizedContent = sanitizedContent
                  .replaceAll('```json', '')
                  .replaceAll('```', '');
              print('Removed markdown code blocks during sanitization');
            }

            // Replace problematic characters
            sanitizedContent = sanitizedContent.replaceAll("Ã¢", "â");

            // Trim whitespace
            sanitizedContent = sanitizedContent.trim();

            print(
                'Sanitized content: ${sanitizedContent.substring(0, math.min(100, sanitizedContent.length))}...');

            final List<dynamic> wineData = jsonDecode(sanitizedContent);
            print(
                'Sanitized JSON parsing successful with ${wineData.length} wines');

            // Rest of conversion code
            final wines = wineData.map<Wine>((wine) {
              // Handle field variations for grape variety
              final grapeVariety = wine['grape_variety'] ??
                  wine['grapeVariety'] ??
                  wine['grape'] ??
                  '';

              return Wine(
                name: wine['name'] ?? 'Unknown Wine',
                winery: wine['winery'] ?? '',
                year: wine['year']?.toString() ?? '',
                region: wine['region'] ?? '',
                grapeVariety: grapeVariety,
                rawText: wine['raw_text'] ?? wine['rawText'] ?? '',
                rating: WineRating(
                  score: (wine['rating'] is Map)
                      ? (wine['rating']['score'] ?? 90).toDouble()
                      : (wine['rating'] ?? 90).toDouble(),
                  source: (wine['rating'] is Map)
                      ? wine['rating']['source'] ?? 'AI Analysis'
                      : 'AI Analysis',
                  review:
                      (wine['rating'] is Map) ? wine['rating']['review'] : null,
                  price: _parsePrice(wine['price']),
                  isPriceValue:
                      wine['is_price_value'] ?? wine['isPriceValue'] ?? false,
                  profile: {
                    'meat': 7.0,
                    'fish': 7.0,
                    'sweet': 5.0,
                    'dry': 5.0,
                    'fruity': 5.0,
                    'light': 5.0,
                    'full-bodied': 5.0,
                  },
                ),
                pairingScores: {
                  'meat': 7.0,
                  'fish': 7.0,
                  'sweet': 5.0,
                  'dry': 5.0,
                  'fruity': 5.0,
                  'light': 5.0,
                  'full-bodied': 5.0,
                },
              );
            }).toList();

            if (wines.isNotEmpty) {
              setState(() {
                _originalWines = wines;
                _wines = List.from(wines);
                _isProcessing = false;
              });
              return;
            }
          } catch (retryError) {
            print('Retry with sanitized content failed: $retryError');
          }
        }
      } else {
        print('OpenAI API error: ${response.statusCode} - ${response.body}');
      }

      // Fallback to demo wines if OpenAI processing fails
      print('Using demo wines as fallback');
      _processWebDemoWines();
    } catch (e) {
      print('Error in OpenAI processing: $e');
      _processWebDemoWines();
    }
  }

  // Helper method to process demo wines for web and mobile
  void _processWebDemoWines() {
    // Create some sample wines for demonstration
    final demoWines = [
      Wine(
        name: 'Château Margaux 2015',
        winery: 'Château Margaux',
        year: '2015',
        region: 'Bordeaux, France',
        grapeVariety: 'Cabernet Sauvignon Blend',
        rawText: 'Château Margaux 2015 Bordeaux',
        rating: WineRating(
          score: 98,
          source: 'Wine Spectator',
          review: 'Exquisite balance of fruit and tannins with a long finish.',
          price: 120,
          isPriceValue: true,
          profile: {
            'meat': 9.5,
            'fish': 5.0,
            'sweet': 3.0,
            'dry': 8.5,
            'fruity': 7.5,
            'light': 4.0,
            'full-bodied': 9.0,
          },
        ),
        pairingScores: {
          'meat': 9.5,
          'fish': 5.0,
          'sweet': 3.0,
          'dry': 8.5,
          'fruity': 7.5,
          'light': 4.0,
          'full-bodied': 9.0,
        },
      ),
      Wine(
        name: 'Cloudy Bay Sauvignon Blanc 2020',
        winery: 'Cloudy Bay',
        year: '2020',
        region: 'Marlborough, New Zealand',
        grapeVariety: 'Sauvignon Blanc',
        rawText: 'Cloudy Bay Sauvignon Blanc 2020 Marlborough',
        rating: WineRating(
          score: 91,
          source: 'Wine Enthusiast',
          review:
              'Crisp and refreshing with notes of citrus and tropical fruit.',
          price: 35,
          profile: {
            'meat': 4.0,
            'fish': 9.0,
            'sweet': 5.0,
            'dry': 8.0,
            'fruity': 8.5,
            'light': 9.0,
            'full-bodied': 3.0,
          },
        ),
        pairingScores: {
          'meat': 4.0,
          'fish': 9.0,
          'sweet': 5.0,
          'dry': 8.0,
          'fruity': 8.5,
          'light': 9.0,
          'full-bodied': 3.0,
        },
      ),
      Wine(
        name: 'La Crema Pinot Noir 2019',
        winery: 'La Crema',
        year: '2019',
        region: 'Sonoma Coast, California',
        grapeVariety: 'Pinot Noir',
        rawText: 'La Crema Pinot Noir 2019 Sonoma Coast',
        rating: WineRating(
          score: 90,
          source: 'Wine Enthusiast',
          review:
              'Elegant with balanced acidity and notes of cherry and earthy tones.',
          price: 28,
          isPriceValue: true,
          profile: {
            'meat': 7.0,
            'fish': 8.0,
            'sweet': 5.0,
            'dry': 6.5,
            'fruity': 8.0,
            'light': 7.5,
            'full-bodied': 5.5,
          },
        ),
        pairingScores: {
          'meat': 7.0,
          'fish': 8.0,
          'sweet': 5.0,
          'dry': 6.5,
          'fruity': 8.0,
          'light': 7.5,
          'full-bodied': 5.5,
        },
      ),
    ];

    setState(() {
      _originalWines = demoWines;
      _wines = List.from(demoWines);
      _isProcessing = false;
    });
  }

  // Method to show pairing preferences dialog
  void _showPairingPreferences() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return Container(
              decoration: const BoxDecoration(
                color: Color(0xFF3333CC),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Wine Pairing Preferences',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Food pairing options
                  const Text(
                    'What food are you pairing with?',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildPreferenceChip('meat', 'Meat', setModalState),
                      _buildPreferenceChip('fish', 'Fish', setModalState),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Wine style options
                  const Text(
                    'Wine style preference:',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildPreferenceChip('sweet', 'Sweet', setModalState),
                      _buildPreferenceChip('dry', 'Dry', setModalState),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Wine characteristics
                  const Text(
                    'Wine characteristics:',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildPreferenceChip('fruity', 'Fruity', setModalState),
                      _buildPreferenceChip('light', 'Light', setModalState),
                      _buildPreferenceChip(
                          'full-bodied', 'Full-bodied', setModalState),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Apply preferences
                  Row(
                    children: [
                      const Text(
                        'Use my preferences',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      const Spacer(),
                      Switch.adaptive(
                        value: _usePreferences,
                        onChanged: (value) {
                          setModalState(() {
                            _usePreferences = value;
                          });
                        },
                        activeColor: const Color(0xFF00CCFF),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Apply button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        setState(() {
                          // Apply preferences from the modal
                          _usePreferences = _usePreferences;
                          _applyPairingPreferences();
                        });
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: const Text('Apply Preferences'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // Helper method to build a consistent preference chip
  Widget _buildPreferenceChip(
      String preference, String label, StateSetter setModalState) {
    final bool isSelected = _pairingPreferences[preference] ?? false;

    return GestureDetector(
      onTap: () {
        setModalState(() {
          _pairingPreferences[preference] = !isSelected;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF00CCFF)
              : Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(30),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  // Helper method to find the best wine for selected pairing preferences
  Wine? _findBestPairingWine(List<Wine> wines, Map<String, bool> preferences) {
    if (wines.isEmpty) return null;

    // Get active preferences
    final activePreferences = preferences.entries
        .where((entry) => entry.value)
        .map((entry) => entry.key)
        .toList();

    if (activePreferences.isEmpty) {
      // If no preferences selected, return first wine
      return wines.first;
    }

    // Calculate pairing scores for each wine
    final scoredWines = wines.map((wine) {
      double totalScore = 0;
      for (final pref in activePreferences) {
        totalScore += wine.pairingScores[pref] ?? 0;
      }
      return MapEntry(wine, totalScore / activePreferences.length);
    }).toList();

    // Sort by score
    scoredWines.sort((a, b) => b.value.compareTo(a.value));

    // Return highest scoring wine
    return scoredWines.first.key;
  }

  // Method to apply pairing preferences for sorting
  void _applyPairingPreferences() {
    if (_wines.isEmpty) return;

    // Apply active preference filtering
    _wines = _wines.toList()
      ..sort((a, b) {
        double scoreA = 0;
        double scoreB = 0;

        // Calculate matching score for active preferences
        for (var entry in _pairingPreferences.entries) {
          if (entry.value) {
            scoreA += a.pairingScores[entry.key] ?? 0;
            scoreB += b.pairingScores[entry.key] ?? 0;
          }
        }

        // If equal preference match, consider rating or price
        if ((scoreA - scoreB).abs() < 0.1) {
          // Fall back to rating comparison
          double ratingA = a.rating?.score ?? 0;
          double ratingB = b.rating?.score ?? 0;
          return ratingB.compareTo(ratingA);
        }

        return scoreB.compareTo(scoreA);
      });
  }

  // Helper widget for info chips
  Widget _buildInfoChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white70),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.white70,
            ),
          ),
        ],
      ),
    );
  }

  // Helper method to parse price values from various formats
  double? _parsePrice(dynamic priceValue) {
    if (priceValue == null) return null;

    // If already a number, convert to double
    if (priceValue is num) return priceValue.toDouble();

    // If it's a string, try to extract the numeric part
    if (priceValue is String) {
      // Remove currency symbols, commas, and whitespace
      String cleanPrice = priceValue.replaceAll(RegExp(r'[$£€,\s]'), '');

      try {
        return double.parse(cleanPrice);
      } catch (e) {
        print('Could not parse price from: $priceValue');
        return null;
      }
    }

    return null;
  }
}
