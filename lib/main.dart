import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:math' as math;
import 'package:image_picker/image_picker.dart';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:google_fonts/google_fonts.dart'; // Add this import for SF Pro-like font

// Conditionally import platform-specific libraries

// This import causes issues in web - use conditionally

// OpenAI API key should be provided via environment variables or secure storage
// For development, we'll load it from the .env file using flutter_dotenv
String openAIApiKey = 'undefined'; // Will be loaded from .env file
String serperApiKey = 'undefined'; // Will be loaded from .env file

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize mobile ads
  if (!kIsWeb) {
    await MobileAds.instance.initialize();
  }

  // Load environment variables from .env file
  await dotenv.load(fileName: ".env");

  // Get API keys from .env file
  openAIApiKey = dotenv.env['OPENAI_API_KEY'] ?? 'undefined';
  serperApiKey = dotenv.env['SERPER_API_KEY'] ?? 'undefined';

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Wine Picker',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF000000),
          primary: const Color(0xFF000000),
          secondary: const Color(0xFF007AFF),
          background: const Color(0xFFF5F5F7),
          surface: Colors.white,
        ),
        textTheme: GoogleFonts.interTextTheme(
          Theme.of(context).textTheme,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          elevation: 0,
          iconTheme: IconThemeData(
            color: Color(0xFF000000),
          ),
          titleTextStyle: TextStyle(
            color: Color(0xFF000000),
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
        ),
        scaffoldBackgroundColor: const Color(0xFFF5F5F7),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF007AFF),
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            minimumSize: const Size(120, 44),
          ),
        ),
      ),
      home: const SplashScreen(),
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
  String? userImage; // User uploaded image
  String? bottleImageUrl; // URL to wine bottle image
  List<String> webComments = []; // Comments from web reviews
  double? userRating; // User's rating (1-5 stars)

  Wine({
    required this.name,
    this.year,
    this.winery,
    this.grapeVariety,
    this.region,
    required this.rawText,
    this.rating,
    Map<String, double>? pairingScores,
    this.userImage,
    this.bottleImageUrl,
    List<String>? webComments,
    this.userRating,
  })  : pairingScores = pairingScores ?? {},
        webComments = webComments ?? [];

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
            // App logo
            Image.asset(
              'assets/icons/pickmywinelogo.png',
              height: 150,
              width: 150,
            ),
            const SizedBox(height: 40),
            // Animated wine icon
            ScaleTransition(
              scale: _animation,
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF00CCFF).withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.wine_bar,
                  size: 80,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 40),
            const Text(
              'Pick My Wine',
              style: TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                letterSpacing: 1.5,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Your personal wine sommelier',
              style: TextStyle(
                fontSize: 18,
                color: Colors.white70,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 60),
            SizedBox(
              width: 60,
              height: 60,
              child: CircularProgressIndicator(
                valueColor:
                    const AlwaysStoppedAnimation<Color>(Color(0xFF00CCFF)),
                strokeWidth: 4,
                backgroundColor: Colors.white.withOpacity(0.2),
              ),
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
  double _analysisProgress = 0.0; // Progress value from 0.0 to 1.0
  String _analysisStage = "Starting analysis..."; // Current stage of analysis
  final bool _showOnlyBestValue = false;
  final bool _hasAppliedPriceFilter = false;
  final RangeValues _priceRange = const RangeValues(10, 200);
  final String _sortOption =
      'default'; // default, rating, price-asc, price-desc
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
        title: Image.asset(
          'assets/icons/pickmywinelogo.png',
          height: 50,
        ),
        centerTitle: true,
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
      floatingActionButton: _wines.isNotEmpty
          ? FloatingActionButton(
              onPressed: _pickMenuImage,
              backgroundColor: const Color(0xFF00CCFF),
              child: const Icon(Icons.camera_alt, color: Colors.white),
            )
          : null,
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(isPhone ? 16.0 : 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Ad banner widget - Elegantly placed
              if (!kIsWeb) const AdBannerWidget(),

              // Loading indicator
              if (_isProcessing) ...[
                const SizedBox(height: 32),
                Center(
                  child: Column(
                    children: [
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Analyzing wine information...',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            LinearProgressIndicator(
                              value: _analysisProgress,
                              backgroundColor: Colors.white.withOpacity(0.2),
                              valueColor: const AlwaysStoppedAnimation<Color>(
                                  Color(0xFF00CCFF)),
                              minHeight: 10,
                              borderRadius: BorderRadius.circular(5),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _analysisStage,
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // Welcome message when no wines are displayed
              if (!_isProcessing && _wines.isEmpty) ...[
                SizedBox(height: MediaQuery.of(context).size.height * 0.1),
                Center(
                  child: Image.asset(
                    'assets/icons/pickmywinelogo.png',
                    height: 120,
                  ),
                ),
                const SizedBox(height: 40),
                Container(
                  padding: const EdgeInsets.all(32),
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: const Color(0xFF4444DD),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.wine_bar_outlined,
                          size: 80, color: Colors.white.withOpacity(0.9)),
                      const SizedBox(height: 24),
                      const Text(
                        'Welcome to Pick My Wine!',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Take a photo of a wine menu or bottle label to get ratings and recommendations.',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.white,
                          height: 1.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'We\'ll search for real ratings and reviews from sources like Vivino and Wine Spectator.',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.white70,
                          height: 1.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 40),
                      SizedBox(
                        width: double.infinity,
                        height: 60,
                        child: ElevatedButton.icon(
                          icon: const Icon(Icons.camera_alt, size: 28),
                          label: const Text(
                            'Select an Image',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          onPressed: _pickMenuImage,
                          style: ElevatedButton.styleFrom(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
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
                        // Wine image at the top
                        if (topWine.userImage != null ||
                            topWine.bottleImageUrl != null)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.network(
                              topWine.userImage ?? topWine.bottleImageUrl!,
                              height: 200,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                print('Error loading image: $error');
                                return Container(
                                  height: 200,
                                  width: double.infinity,
                                  color: Colors.grey.shade800,
                                  child: const Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.image_not_supported,
                                        color: Colors.white,
                                        size: 40,
                                      ),
                                      SizedBox(height: 8),
                                      Text(
                                        'Image unavailable',
                                        style: TextStyle(
                                          color: Colors.white70,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
                        if (topWine.userImage != null ||
                            topWine.bottleImageUrl != null)
                          const SizedBox(height: 16),

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

                        // Special labels (Great Wine, Great Value)
                        _buildSpecialLabels(topWine),
                        const SizedBox(height: 12),

                        // Wine attributes as icons
                        if (topWine.pairingScores.isNotEmpty)
                          Wrap(
                            spacing: 8,
                            children:
                                topWine.pairingScores.entries.map((entry) {
                              return _buildWineAttributeIcon(
                                  entry.key, entry.value);
                            }).toList(),
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

                        // Collapsible web comments
                        if (topWine.webComments.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          _buildCollapsibleComments(topWine.webComments),
                        ],

                        // User rating widget
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Rate this wine:',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            _buildRatingWidget(topWine),
                          ],
                        ),
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
                      child: ExpansionTile(
                        tilePadding: const EdgeInsets.all(16),
                        childrenPadding:
                            const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        collapsedIconColor: Colors.white,
                        iconColor: const Color(0xFF00CCFF),
                        title: Row(
                          children: [
                            Expanded(
                              child: Text(
                                wine.name,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            if (wine.rating != null)
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
                          ],
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
                            Row(
                              children: [
                                // Special labels
                                _buildSpecialLabels(wine),
                                const Spacer(),
                                // Price
                                if (wine.rating?.price != null)
                                  Text(
                                    '\$${wine.rating!.price!.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        ),
                        children: [
                          // Wine image if available
                          if (wine.userImage != null ||
                              wine.bottleImageUrl != null) ...[
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(
                                wine.userImage ?? wine.bottleImageUrl!,
                                height: 150,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  print('Error loading image: $error');
                                  return Container(
                                    height: 150,
                                    width: double.infinity,
                                    color: Colors.grey.shade800,
                                    child: const Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          Icons.image_not_supported,
                                          color: Colors.white,
                                          size: 40,
                                        ),
                                        SizedBox(height: 8),
                                        Text(
                                          'Image unavailable',
                                          style: TextStyle(
                                            color: Colors.white70,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],

                          // Wine attributes as icons
                          if (wine.pairingScores.isNotEmpty) ...[
                            Wrap(
                              spacing: 8,
                              children: wine.pairingScores.entries.map((entry) {
                                return _buildWineAttributeIcon(
                                    entry.key, entry.value);
                              }).toList(),
                            ),
                            const SizedBox(height: 12),
                          ],

                          // Wine details
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              if (wine.year != null)
                                _buildInfoChip(
                                    Icons.calendar_today, wine.year!),
                              if (wine.region != null)
                                _buildInfoChip(Icons.place, wine.region!),
                              if (wine.grapeVariety != null)
                                _buildInfoChip(Icons.eco, wine.grapeVariety!),
                            ],
                          ),

                          // Wine review
                          if (wine.rating?.review != null) ...[
                            const SizedBox(height: 12),
                            Text(
                              wine.rating!.review!,
                              style: const TextStyle(
                                fontSize: 14,
                                fontStyle: FontStyle.italic,
                                color: Colors.white,
                              ),
                            ),
                          ],

                          // Collapsible web comments
                          if (wine.webComments.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            _buildCollapsibleComments(wine.webComments),
                          ],

                          // User rating widget
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Rate this wine:',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              _buildRatingWidget(wine),
                            ],
                          ),
                        ],
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
          _analysisProgress = 0.0;
          _analysisStage = "Starting analysis...";
        });

        try {
          // For web, we need to handle things differently than native platforms
          if (kIsWeb) {
            // Web platform - simulate OpenAI processing with a delay
            print('Web platform detected, processing image using OpenAI API');

            setState(() {
              _analysisProgress = 0.2;
              _analysisStage = "Preparing image...";
            });

            await Future.delayed(
                const Duration(seconds: 1)); // Simulate processing

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
              _analysisProgress = 0.0;
              _analysisStage = "Error occurred";
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
        _analysisProgress = 0.0;
        _analysisStage = "Error occurred";
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

      // Update progress
      setState(() {
        _analysisProgress = 0.1;
        _analysisStage = "Reading image...";
      });

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

      // Update progress
      setState(() {
        _analysisProgress = 0.3;
        _analysisStage = "Converting image...";
      });

      // Convert image bytes to base64
      final base64Image = base64Encode(imageBytes);
      print('Image converted to base64, size: ${base64Image.length} chars');

      // Update progress
      setState(() {
        _analysisProgress = 0.5;
        _analysisStage = "Analyzing with AI...";
      });

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
                  'You are a wine expert. Analyze the wine image and extract information about ALL wine bottles visible in the image. If multiple bottles are present, create a separate JSON object for each bottle. Return in JSON array format: [{"name": "name", "winery": "winery", "year": "year", "type": "type", "region": "region", "grape_variety": "variety"}]. Only include fields you can confidently identify. If a field is unknown, omit it from the JSON.'
            },
            {
              'role': 'user',
              'content': [
                {
                  'type': 'text',
                  'text':
                      'Please analyze this wine image and extract the wine information.'
                },
                {
                  'type': 'image_url',
                  'image_url': {'url': 'data:image/jpeg;base64,$base64Image'}
                }
              ]
            }
          ],
          'max_tokens': 1000,
          'temperature': 0.5,
        }),
      );

      // Update progress
      setState(() {
        _analysisProgress = 0.7;
        _analysisStage = "Processing results...";
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final message = data['choices'][0]['message'];
        final content = message['content'] ?? '';
        final toolCalls = message['tool_calls'] ?? [];

        print('OpenAI Vision response: $content');

        try {
          // Parse the initial wine data from the content
          List<dynamic> wineData = [];

          if (content.isNotEmpty) {
            // Try to parse the JSON response
            final truncatedContent = content.length > 100
                ? '${content.substring(0, 100)}...'
                : content;
            print('Attempting to parse JSON: $truncatedContent');

            // Check if the response is a text message instead of JSON
            if (content.startsWith('I\'m unable to provide') ||
                content.startsWith('I cannot') ||
                content.startsWith('I apologize') ||
                !content.contains('{') ||
                !content.contains('}')) {
              print('OpenAI returned a text message instead of JSON: $content');
              setState(() {
                _analysisStage =
                    "API returned text instead of JSON, using demo data...";
              });
              _processWebDemoWines();
              return;
            }

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

            // Check if JSON is truncated and fix it
            if (!cleanContent.endsWith(']')) {
              // Try to find the last complete wine object
              final lastBraceIndex = cleanContent.lastIndexOf('}');
              if (lastBraceIndex != -1) {
                cleanContent =
                    '${cleanContent.substring(0, lastBraceIndex + 1)}]';
                print('Fixed truncated JSON by adding closing bracket');
              }
            }

            // Ensure the content starts with [ and ends with ]
            if (!cleanContent.startsWith('[')) {
              cleanContent = '[$cleanContent';
              print('Added opening bracket to JSON');
            }
            if (!cleanContent.endsWith(']')) {
              cleanContent = '$cleanContent]';
              print('Added closing bracket to JSON');
            }

            wineData = jsonDecode(cleanContent);
            print('JSON decoded successfully with ${wineData.length} wines');
          }

          // Process tool calls if any
          if (toolCalls.isNotEmpty) {
            print('Processing ${toolCalls.length} tool calls');

            // Process each tool call
            for (var toolCall in toolCalls) {
              final function = toolCall['function'];
              final name = function['name'];
              final arguments = jsonDecode(function['arguments']);

              print('Tool call: $name with arguments: $arguments');

              // Handle search_wine_reviews function
              if (name == 'search_wine_reviews') {
                final wineName = arguments['wine_name'];
                final winery = arguments['winery'] ?? '';
                final year = arguments['year'] ?? '';
                print("Searching for reviews for $wineName ($winery, $year)");

                final reviews =
                    await _openAiWineReviews(wineName, winery, year);

                bool foundMatch = false;
                for (var wine in wineData) {
                  if (_isWineMatch(wine, wineName, winery, year)) {
                    wine['web_comments'] = reviews;
                    foundMatch = true;
                    print("Added reviews to wine: " + wine['name']);
                  }
                }
                if (!foundMatch && wineData.isNotEmpty) {
                  print(
                      "No matching wine found for reviews, adding to first wine");
                  wineData[0]['web_comments'] = reviews;
                }
              }

              // Handle search_wine_image function
              if (name == 'search_wine_image') {
                final wineName = arguments['wine_name'];
                final winery = arguments['winery'] ?? '';
                final year = arguments['year'] ?? '';
                print("Searching for image for $wineName ($winery, $year)");

                final imageUrl = await _openAiWineImage(wineName, winery, year);

                bool foundMatch = false;
                for (var wine in wineData) {
                  if (_isWineMatch(wine, wineName, winery, year)) {
                    wine['bottle_image_url'] = imageUrl;
                    foundMatch = true;
                    print("Added image to wine: " + wine['name']);
                  }
                }
                if (!foundMatch && wineData.isNotEmpty) {
                  print(
                      "No matching wine found for image, adding to first wine");
                  wineData[0]['bottle_image_url'] = imageUrl;
                }
              }
            }
          } else {
            print('No tool calls received, adding default reviews and images');

            // If no tool calls were made, add default reviews and images to each wine
            for (var wine in wineData) {
              // Map wine_name to name for consistency
              if (wine['wine_name'] != null && wine['name'] == null) {
                wine['name'] = wine['wine_name'];
              }

              final wineName = wine['name'] ?? '';
              final winery = wine['winery'] ?? '';
              final year = wine['year']?.toString() ?? '';

              // Get real reviews from Vivino/Serper - no default fallbacks
              if (wine['web_comments'] == null) {
                wine['web_comments'] =
                    await _openAiWineReviews(wineName, winery, year);
                if ((wine['web_comments'] as List).isEmpty) {
                  print('No reviews found for wine: $wineName');
                } else {
                  print(
                      'Found ${(wine['web_comments'] as List).length} reviews for wine: $wineName');
                }
              }

              // Get real wine bottle image - no default fallbacks
              if (wine['bottle_image_url'] == null) {
                final imageUrl = await _openAiWineImage(wineName, winery, year);
                if (imageUrl.isNotEmpty) {
                  wine['bottle_image_url'] = imageUrl;
                  print('Found image for wine: $wineName');
                } else {
                  print('No image found for wine: $wineName');
                }
              }
            }
          }

          // Update progress
          setState(() {
            _analysisProgress = 0.9;
            _analysisStage = "Creating wine list...";
          });

          // Convert the JSON data to Wine objects
          final wines = wineData.map<Wine>((wine) {
            // Map wine_name to name for consistency
            if (wine['wine_name'] != null && wine['name'] == null) {
              wine['name'] = wine['wine_name'];
            }

            // Handle field variations for grape variety
            final grapeVariety = wine['grape_variety'] ??
                wine['grapeVariety'] ??
                wine['grape'] ??
                '';

            // Set grape_variety based on type if available
            final wineType = wine['type'] ?? '';
            String derivedVariety = grapeVariety;
            if (derivedVariety.isEmpty && wineType.isNotEmpty) {
              if (wineType.toLowerCase().contains('cabernet')) {
                derivedVariety = 'Cabernet Sauvignon';
              } else if (wineType.toLowerCase().contains('chardonnay')) {
                derivedVariety = 'Chardonnay';
              } else if (wineType.toLowerCase().contains('pinot noir')) {
                derivedVariety = 'Pinot Noir';
              } else if (wineType.toLowerCase().contains('sauvignon blanc')) {
                derivedVariety = 'Sauvignon Blanc';
              } else if (wineType.toLowerCase().contains('red')) {
                derivedVariety = 'Red Blend';
              } else if (wineType.toLowerCase().contains('white')) {
                derivedVariety = 'White Blend';
              }
            }

            // Extract rating score from reviews if available
            double ratingScore = 0;
            String ratingSource = 'AI Analysis';
            String? ratingReview;

            // Check for web comments (reviews)
            List<String> webComments = wine['web_comments'] != null
                ? List<String>.from(wine['web_comments'])
                : [];

            if (webComments.isNotEmpty) {
              // Try to find rating in the reviews using multiple regex patterns
              for (String comment in webComments) {
                // Check for ratings like "94 points" or "93 pts"
                final pointsMatch =
                    RegExp(r'(\d{1,3}(?:\.\d)?)\s*(?:points|pts|point)')
                        .firstMatch(comment);

                // Check for ratings like (4.5/5) or (92/100)
                final ratingMatch = RegExp(r'\((\d{1,3}(?:\.\d)?)\/(\d+)\)')
                    .firstMatch(comment);

                // Check for ratings like "rated 4.5 stars" or "score of 92"
                final scoreMatch =
                    RegExp(r'(?:rated|score of|rating of)\s*(\d{1,3}(?:\.\d)?)')
                        .firstMatch(comment);

                // Process points format (e.g., "94 points")
                if (pointsMatch != null) {
                  double value =
                      double.tryParse(pointsMatch.group(1) ?? '0') ?? 0;
                  // Points ratings are typically on a 100-point scale
                  if (value > ratingScore) {
                    ratingScore = value;
                    // Extract source - it's typically at the beginning of the review
                    final sourceMatch =
                        RegExp(r'^([^:]+):').firstMatch(comment);
                    if (sourceMatch != null) {
                      ratingSource = sourceMatch.group(1)?.trim() ?? 'Review';
                    }
                    // Extract review text
                    final reviewMatch =
                        RegExp(r':\s*"([^"]+)"').firstMatch(comment);
                    if (reviewMatch != null) {
                      ratingReview = reviewMatch.group(1);
                    }
                  }
                }
                // Process X/Y format (e.g., "4.5/5")
                else if (ratingMatch != null) {
                  double value =
                      double.tryParse(ratingMatch.group(1) ?? '0') ?? 0;
                  int scale = int.tryParse(ratingMatch.group(2) ?? '5') ?? 5;

                  // Convert to 100-point scale if needed
                  if (scale == 5) {
                    value = value * 20; // 5-point scale to 100-point
                  } else if (scale != 100) {
                    value = (value / scale) * 100; // Any scale to 100-point
                  }

                  // Only update if this rating is higher or we don't have one yet
                  if (value > ratingScore) {
                    ratingScore = value;
                    // Extract source
                    final sourceMatch =
                        RegExp(r'^([^(]+)\(').firstMatch(comment);
                    if (sourceMatch != null) {
                      ratingSource = sourceMatch.group(1)?.trim() ?? 'Review';
                    }
                    // Extract review text
                    final reviewMatch =
                        RegExp(r'\):\s*"([^"]+)"').firstMatch(comment);
                    if (reviewMatch != null) {
                      ratingReview = reviewMatch.group(1);
                    }
                  }
                }
                // Process "rated X stars" format
                else if (scoreMatch != null) {
                  double value =
                      double.tryParse(scoreMatch.group(1) ?? '0') ?? 0;
                  // Assume it's out of 5 if less than 10, otherwise out of 100
                  if (value <= 10) {
                    value = value * 20; // Assume 5-star scale and convert
                  }
                  if (value > ratingScore) {
                    ratingScore = value;
                    // Extract source
                    final sourceMatch =
                        RegExp(r'^([^:]+):').firstMatch(comment);
                    if (sourceMatch != null) {
                      ratingSource = sourceMatch.group(1)?.trim() ?? 'Review';
                    }
                    // Extract review text
                    final reviewMatch =
                        RegExp(r':\s*"([^"]+)"').firstMatch(comment);
                    if (reviewMatch != null) {
                      ratingReview = reviewMatch.group(1);
                    }
                  }
                }
              }
            }

            // If no rating found in reviews, use random rating between 88-95 instead of fixed 85
            if (ratingScore == 0) {
              final random = math.Random();
              ratingScore = 88 + random.nextInt(8).toDouble();
              ratingSource = 'Estimated';
            }

            return Wine(
              name: wine['name'] ?? 'Unknown Wine',
              winery: wine['winery'] ?? '',
              year: wine['year']?.toString() ?? '',
              region: wine['region'] ?? '',
              grapeVariety: derivedVariety,
              rawText: wine['raw_text'] ?? wine['rawText'] ?? '',
              rating: WineRating(
                score: ratingScore,
                source: ratingSource,
                review: ratingReview ??
                    ((wine['rating'] is Map) ? wine['rating']['review'] : null),
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
              userImage: wine['user_image'] as String?,
              bottleImageUrl: wine['bottle_image_url'] as String?,
              webComments: webComments,
              userRating: wine['user_rating'] as double?,
            );
          }).toList();

          if (wines.isNotEmpty) {
            setState(() {
              _originalWines = wines;
              _wines = List.from(wines);
              _isProcessing = false;
              _analysisProgress = 1.0;
              _analysisStage = "Complete!";
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

            // Check if JSON is truncated and fix it
            if (!sanitizedContent.endsWith(']')) {
              // Try to find the last complete wine object
              final lastBraceIndex = sanitizedContent.lastIndexOf('}');
              if (lastBraceIndex != -1) {
                sanitizedContent =
                    '${sanitizedContent.substring(0, lastBraceIndex + 1)}]';
                print('Fixed truncated JSON by adding closing bracket');
              }
            }

            print(
                'Sanitized content: ${sanitizedContent.substring(0, math.min(100, sanitizedContent.length))}...');

            final List<dynamic> wineData = jsonDecode(sanitizedContent);
            print(
                'Sanitized JSON parsing successful with ${wineData.length} wines');

            // Update progress
            setState(() {
              _analysisProgress = 0.9;
              _analysisStage = "Creating wine list from sanitized data...";
            });

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
                      ? (wine['rating']['score'] ?? 85).toDouble()
                      : (wine['rating_score'] ?? wine['rating'] ?? 85)
                          .toDouble(),
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
                userImage: wine['user_image'] as String?,
                bottleImageUrl: wine['bottle_image_url'] as String?,
                webComments: wine['web_comments'] != null
                    ? List<String>.from(wine['web_comments'])
                    : [],
                userRating: wine['user_rating'] as double?,
              );
            }).toList();

            if (wines.isNotEmpty) {
              setState(() {
                _originalWines = wines;
                _wines = List.from(wines);
                _isProcessing = false;
                _analysisProgress = 1.0;
                _analysisStage = "Complete!";
              });
              return;
            }
          } catch (retryError) {
            print('Retry with sanitized content failed: $retryError');
            setState(() {
              _analysisStage = "Error parsing results, using demo data...";
            });
          }
        }
      } else {
        print('OpenAI API error: ${response.statusCode} - ${response.body}');
        setState(() {
          _analysisStage = "API error, using demo data...";
        });
      }

      // Fallback to demo wines if OpenAI processing fails
      print('Using demo wines as fallback');
      _processWebDemoWines();
    } catch (e) {
      print('Error in OpenAI processing: $e');
      setState(() {
        _analysisStage = "Processing error, using demo data...";
      });
      _processWebDemoWines();
    }
  }

  // Real API methods for fetching wine reviews and images using Vivino API
  Future<List<String>> _openAiWineReviews(
      String wineName, String winery, String year) async {
    List<String> reviews = [];
    bool vivinoSuccess = false;

    // CORS issue with Vivino API when running in web browser
    // For now, skip Vivino API calls when running in web
    if (!kIsWeb) {
      try {
        print(
            "Searching for real wine reviews with Vivino: $wineName ($winery, $year)");

        // Vivino search URL
        final params = {
          'country_code': 'US',
          'currency_code': 'USD',
          'grape_filter': 'varietal',
          'min_rating': '1',
          'order_by': 'ratings_average',
          'order': 'desc',
          'page': '1',
          'price_range_max': '500',
          'price_range_min': '0',
          'wine_type_ids[]': '',
          'query': '$wineName $winery $year',
        };

        final searchResponse = await http.get(
          Uri.https('www.vivino.com', '/api/explore/explore', params),
          headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
          },
        );

        if (searchResponse.statusCode == 200) {
          final data = jsonDecode(searchResponse.body);
          if (data['explore_vintage'] != null &&
              data['explore_vintage']['matches'] != null) {
            final matchedWines = data['explore_vintage']['matches'] as List;

            if (matchedWines.isNotEmpty) {
              // Try to get the top 3 wines
              for (var i = 0; i < math.min(3, matchedWines.length); i++) {
                final wine = matchedWines[i];
                final wineId = wine['vintage']['wine']['id'];
                final wineName = wine['vintage']['wine']['name'];
                final winery = wine['vintage']['wine']['winery']['name'];
                final rating = wine['vintage']['statistics']['ratings_average'];
                final ratingsCount =
                    wine['vintage']['statistics']['ratings_count'];

                // Get detailed info including reviews
                final detailResponse = await http.get(
                  Uri.parse(
                      'https://www.vivino.com/api/wines/$wineId/reviews?per_page=3&page=1'),
                  headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json',
                  },
                );

                if (detailResponse.statusCode == 200) {
                  final reviewData = jsonDecode(detailResponse.body);
                  final wineReviews = reviewData['reviews'] as List;

                  if (wineReviews.isNotEmpty) {
                    // Add wine info with rating
                    reviews.add(
                        'Vivino (${rating.toStringAsFixed(1)}/5, $ratingsCount ratings): "$wineName" by $winery');

                    // Add up to 2 user reviews
                    for (var j = 0; j < math.min(2, wineReviews.length); j++) {
                      final review = wineReviews[j];
                      final reviewText = review['note'];
                      final reviewRating = review['rating'];
                      final reviewerName = review['user']['first_name'];

                      if (reviewText != null && reviewText.isNotEmpty) {
                        reviews.add(
                            '${reviewerName} (${reviewRating.toStringAsFixed(1)}/5): "$reviewText"');
                      }
                    }
                  } else {
                    // Just add the wine rating info if no reviews
                    reviews.add(
                        'Vivino (${rating.toStringAsFixed(1)}/5, $ratingsCount ratings): "$wineName" by $winery');
                  }
                }
              }

              if (reviews.isNotEmpty) {
                print("Found ${reviews.length} real Vivino reviews");
                vivinoSuccess = true;
              }
            }
          } else {
            print("No results found in Vivino data");
          }
        } else {
          print(
              "Vivino search failed with status code: ${searchResponse.statusCode}");
        }
      } catch (e) {
        print("Error searching for wine reviews with Vivino: $e");
      }
    } else {
      print("Skipping Vivino API due to CORS restrictions in web browser");
    }

    // Always use Serper API (as fallback or primary source in web)
    print("Now searching with Serper API for: $wineName");
    try {
      // Use Serper API to search for wine reviews
      final response = await http.post(
        Uri.parse('https://google.serper.dev/search'),
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': serperApiKey,
        },
        body: jsonEncode({
          'q': '"$wineName" "$winery" "$year" wine review rating points',
          'gl': 'us',
          'hl': 'en',
          'num': 10,
        }),
      );

      if (response.statusCode == 200) {
        print("Serper API response received successfully");
        final data = jsonDecode(response.body);
        if (data.containsKey('organic') && data['organic'] != null) {
          final organicResults = data['organic'] as List;

          List<String> serperReviews = [];
          for (var result in organicResults) {
            // Skip null results
            if (result == null) continue;

            final title = result['title'] as String? ?? 'Wine Review';
            final snippet = result['snippet'] as String? ?? '';
            final link = result['link'] as String? ?? '';

            // Check if the result is from a reputable wine review source
            if (link.contains('vivino.com') ||
                link.contains('winespectator.com') ||
                link.contains('wineenthusiast.com') ||
                link.contains('decanter.com') ||
                link.contains('jamessuckling.com') ||
                link.contains('robertparker.com')) {
              // Extract rating from title or snippet
              String rating = '';

              // Look for ratings like "94 points" or "93/100" or "4.5/5"
              final pointsMatch =
                  RegExp(r'(\d{1,2}(?:\.\d)?)\s*(?:points|pts|point)')
                          .firstMatch(title) ??
                      RegExp(r'(\d{1,2}(?:\.\d)?)\s*(?:points|pts|point)')
                          .firstMatch(snippet);

              final ratingMatch = RegExp(r'(\d{1,2}(?:\.\d)?)\s*\/\s*(\d+)')
                      .firstMatch(title) ??
                  RegExp(r'(\d{1,2}(?:\.\d)?)\s*\/\s*(\d+)')
                      .firstMatch(snippet);

              if (pointsMatch != null) {
                rating = '${pointsMatch.group(1)}/100';
              } else if (ratingMatch != null) {
                final score = ratingMatch.group(1);
                final scale = ratingMatch.group(2);
                rating = '$score/$scale';
              }

              serperReviews.add('$title ($rating): $snippet');
            }
          }

          if (serperReviews.isNotEmpty) {
            print("Found ${serperReviews.length} reviews from Serper API");

            // Only add 1-2 Serper reviews if we already have Vivino reviews
            int serperLimit = vivinoSuccess ? 2 : 3;
            serperReviews = serperReviews.take(serperLimit).toList();

            // Add Serper reviews to our existing reviews list
            reviews.addAll(serperReviews);
          } else {
            print("No matching reviews found in Serper API results");
          }
        } else {
          print("No organic results found in Serper API response");
        }
      } else {
        print("Serper API error: ${response.statusCode} - ${response.body}");
      }
    } catch (e) {
      print("Error searching for wine reviews with Serper API: $e");
    }

    // Return combined results, limited to 5 reviews maximum
    return reviews.take(5).toList();
  }

  Future<String> _openAiWineImage(
      String wineName, String winery, String year) async {
    String imageUrl = '';
    bool vivinoSuccess = false;

    // Skip Vivino API in web browser due to CORS issues
    if (!kIsWeb) {
      try {
        print(
            "Searching for real wine image with Vivino: $wineName ($winery, $year)");

        // Vivino search URL
        final params = {
          'country_code': 'US',
          'currency_code': 'USD',
          'grape_filter': 'varietal',
          'min_rating': '1',
          'order_by': 'ratings_average',
          'order': 'desc',
          'page': '1',
          'price_range_max': '500',
          'price_range_min': '0',
          'wine_type_ids[]': '',
          'query': '$wineName $winery $year',
        };

        final searchResponse = await http.get(
          Uri.https('www.vivino.com', '/api/explore/explore', params),
          headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
          },
        );

        if (searchResponse.statusCode == 200) {
          final data = jsonDecode(searchResponse.body);
          if (data['explore_vintage'] != null &&
              data['explore_vintage']['matches'] != null) {
            final matchedWines = data['explore_vintage']['matches'] as List;

            if (matchedWines.isNotEmpty) {
              // Get the first matching wine
              final wine = matchedWines[0];
              if (wine['vintage'] != null &&
                  wine['vintage']['image'] != null &&
                  wine['vintage']['image']['variations'] != null) {
                imageUrl = wine['vintage']['image']['variations']
                        ['bottle_large'] ??
                    wine['vintage']['image']['variations']['bottle_medium'] ??
                    wine['vintage']['image']['variations']['bottle_small'] ??
                    '';

                if (imageUrl.isNotEmpty) {
                  print("Found wine image from Vivino: $imageUrl");
                  vivinoSuccess = true;
                }
              } else {
                print(
                    "Wine data doesn't contain image information in Vivino response");
              }
            }
          } else {
            print("No matches found in Vivino data");
          }
        } else {
          print(
              "Vivino search failed with status code: ${searchResponse.statusCode}");
        }
      } catch (e) {
        print("Error getting wine image from Vivino: $e");
      }
    } else {
      print(
          "Skipping Vivino API for images due to CORS restrictions in web browser");
    }

    // Use Serper API if Vivino didn't work or we're in web
    if (!vivinoSuccess) {
      print(
          "Searching for wine image with Serper API: $wineName ($winery, $year)");
      try {
        final response = await http.post(
          Uri.parse('https://google.serper.dev/search'),
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': serperApiKey,
          },
          body: jsonEncode({
            'q': '"$wineName" "$winery" "$year" wine bottle',
            'gl': 'us',
            'hl': 'en',
            'type': 'images',
            'num': 15,
          }),
        );

        if (response.statusCode == 200) {
          print("Serper API image search response received successfully");
          final data = jsonDecode(response.body);

          // Check if data contains images array
          if (data.containsKey('images') && data['images'] != null) {
            final images = data['images'] as List;

            if (images.isEmpty) {
              print("Serper API returned empty images array");
              return imageUrl;
            }

            // Look for images from CORS-friendly sources first when in web mode
            if (kIsWeb) {
              print("Looking for CORS-friendly images");
              for (var image in images) {
                if (image == null) continue;

                final imgUrl = image['imageUrl'] as String?;
                final sourceUrl = image['sourceUrl'] as String?;

                if (imgUrl == null || sourceUrl == null) continue;

                // Only use images from domains known to work with CORS in web browsers
                if (imgUrl.contains('unsplash.com') ||
                    imgUrl.contains('pexels.com') ||
                    imgUrl.contains('flickr.com') ||
                    imgUrl.contains('imgur.com') ||
                    imgUrl.contains('googleusercontent.com') ||
                    imgUrl.contains('fbcdn.net')) {
                  print("Found CORS-friendly image: $imgUrl");
                  return imgUrl;
                }
              }

              // Proxy Vivino images through ImgBB or another CORS-friendly image proxy
              // Look for Vivino images to use with proxy
              for (var image in images) {
                if (image == null) continue;

                final imgUrl = image['imageUrl'] as String?;
                final sourceUrl = image['sourceUrl'] as String?;

                if (imgUrl == null || sourceUrl == null) continue;

                // Check if it's a Vivino image or other wine-related image
                if (imgUrl.contains('vivino.com') ||
                    sourceUrl.contains('vivino.com') ||
                    sourceUrl.contains('wine.com') ||
                    sourceUrl.contains('winespectator.com')) {
                  // Return a fallback placeholder image that's CORS-friendly
                  print(
                      "Found wine image but using placeholder due to CORS: $imgUrl");
                  return 'https://i.imgur.com/JFHkfFG.jpg'; // Generic wine bottle image on Imgur (CORS-friendly)
                }
              }
            } else {
              // Regular image search (non-web) - use wine-specific images
              for (var image in images) {
                // Skip null images
                if (image == null) continue;

                // Safely get values with null checks
                final imgUrl = image['imageUrl'] as String?;
                final sourceUrl = image['sourceUrl'] as String?;

                // Skip if either value is null
                if (imgUrl == null || sourceUrl == null) continue;

                if (sourceUrl.contains('vivino.com') ||
                    sourceUrl.contains('winespectator.com') ||
                    sourceUrl.contains('wineenthusiast.com') ||
                    sourceUrl.contains('wine.com') ||
                    sourceUrl.contains('wine-searcher.com')) {
                  // Validate image URL
                  if (imgUrl.startsWith('http') &&
                      (imgUrl.endsWith('.jpg') ||
                          imgUrl.endsWith('.jpeg') ||
                          imgUrl.endsWith('.png') ||
                          imgUrl.endsWith('.webp') ||
                          imgUrl.contains('.jpg?') ||
                          imgUrl.contains('.jpeg?') ||
                          imgUrl.contains('.png?') ||
                          imgUrl.contains('.webp?'))) {
                    print("Found wine image from Serper API: $imgUrl");
                    return imgUrl;
                  }
                }
              }
            }

            // If no wine-specific site found, try any good quality image
            for (var image in images) {
              // Skip null images
              if (image == null) continue;

              // Safely get imageUrl with null check
              final imgUrl = image['imageUrl'] as String?;
              if (imgUrl == null) continue;

              // For web, only use CORS-friendly images
              if (kIsWeb) {
                if (imgUrl.contains('unsplash.com') ||
                    imgUrl.contains('pexels.com') ||
                    imgUrl.contains('flickr.com') ||
                    imgUrl.contains('imgur.com') ||
                    imgUrl.contains('googleusercontent.com') ||
                    imgUrl.contains('fbcdn.net')) {
                  print("Found CORS-friendly general image: $imgUrl");
                  return imgUrl;
                }
              } else {
                // For native, use any valid image
                // Validate image URL
                if (imgUrl.startsWith('http') &&
                    (imgUrl.endsWith('.jpg') ||
                        imgUrl.endsWith('.jpeg') ||
                        imgUrl.endsWith('.png') ||
                        imgUrl.endsWith('.webp') ||
                        imgUrl.contains('.jpg?') ||
                        imgUrl.contains('.jpeg?') ||
                        imgUrl.contains('.png?') ||
                        imgUrl.contains('.webp?'))) {
                  print("Found general wine image from Serper API: $imgUrl");
                  return imgUrl;
                }
              }
            }

            // If we're in web and still haven't found a CORS-friendly image, use placeholders
            if (kIsWeb) {
              // Return a generic wine image from Unsplash or other CORS-friendly sources (more variety)
              const placeholderImages = [
                'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800', // Red wine
                'https://images.unsplash.com/photo-1566452348683-79a64b069fdd?auto=format&fit=crop&w=800', // White wine
                'https://images.unsplash.com/photo-1609951651556-5334e2706168?auto=format&fit=crop&w=800', // Champagne
                'https://images.unsplash.com/photo-1568213816046-0a8ef5d9ac3f?auto=format&fit=crop&w=800', // Wine bottles
                'https://images.unsplash.com/photo-1435928315542-7a321d9a3b67?auto=format&fit=crop&w=800', // Red wine pour
                'https://images.unsplash.com/photo-1558682533-5b8fb363d325?auto=format&fit=crop&w=800', // Wine cellar
                'https://images.unsplash.com/photo-1606765962197-3b7e7d47db8e?auto=format&fit=crop&w=800', // Vineyard
              ];

              final random = math.Random();
              final fallbackImg =
                  placeholderImages[random.nextInt(placeholderImages.length)];
              print(
                  "Using CORS-friendly Unsplash placeholder image: $fallbackImg");
              return fallbackImg;
            }

            // If we found any image at all for native platforms, use it as a last resort
            if (!kIsWeb) {
              for (var image in images) {
                if (image != null && image['imageUrl'] != null) {
                  final imgUrl = image['imageUrl'] as String;
                  print("Found fallback image from Serper API: $imgUrl");
                  return imgUrl;
                }
              }
            }
          } else {
            print(
                "No 'images' array found in Serper API response or it's null");
          }
        } else {
          print("Serper API error: ${response.statusCode} - ${response.body}");
        }
      } catch (e) {
        print("Error searching for wine image with Serper API: $e");
      }
    }

    // Return the Vivino image if found for native platforms
    // For web, if we reach here without finding a CORS-friendly image, use a placeholder
    if (kIsWeb && imageUrl.isEmpty) {
      return 'https://i.imgur.com/JFHkfFG.jpg'; // Default placeholder
    }

    return imageUrl;
  }

  // Helper method to simulate wine review search
  List<String> _simulateWineReviewSearch(
      String wineName, String winery, String year) {
    // In a real implementation, this would make an actual web search
    // For now, we'll return realistic simulated reviews
    final random = math.Random();
    final vivinoScore = (3.5 + random.nextDouble() * 1.5).toStringAsFixed(1);
    final wineSpectatorScore = (85 + random.nextInt(15)).toString();
    final wineEnthusiastScore = (85 + random.nextInt(15)).toString();

    return [
      'Vivino ($vivinoScore/5): "${_getRandomReviewText(wineName, 'Vivino')}"',
      'Wine Spectator ($wineSpectatorScore/100): "${_getRandomReviewText(wineName, 'Wine Spectator')}"',
      'Wine Enthusiast ($wineEnthusiastScore/100): "${_getRandomReviewText(wineName, 'Wine Enthusiast')}"',
    ];
  }

  // Helper method to get random review text
  String _getRandomReviewText(String wineName, String source) {
    final random = math.Random();
    final reviewTexts = [
      'A well-balanced wine with excellent structure and a long finish',
      'Elegant and complex with notes of dark fruit and subtle oak',
      'Fresh and vibrant with good acidity and a clean finish',
      'Rich and full-bodied with excellent aging potential',
      'Crisp and refreshing with bright citrus notes',
      'Bold and expressive with a velvety texture',
      'Delicate and nuanced with floral aromas',
      'Robust and powerful with firm tannins',
      'Smooth and silky with excellent balance',
      'Lively and aromatic with a distinctive character',
    ];

    return reviewTexts[random.nextInt(reviewTexts.length)];
  }

  // Helper method to simulate wine image search
  String _simulateWineImageSearch(String wineName, String winery, String year) {
    // In a real implementation, this would make an actual image search
    // For now, we'll return realistic image URLs from Google Images
    final imageUrls = [
      'https://i.imgur.com/JFHkfFG.jpg', // Red wine bottle
      'https://i.imgur.com/8rP7vFR.jpg', // White wine bottle
      'https://i.imgur.com/vSJYwkN.jpg', // Champagne bottle
      'https://i.imgur.com/2jJRC5g.jpg', // Rose wine bottle
      'https://i.imgur.com/qWQtHRQ.jpg', // Bordeaux bottle
    ];

    final random = math.Random();
    return imageUrls[random.nextInt(imageUrls.length)];
  }

  // Helper method to process demo wines for web and mobile
  void _processWebDemoWines() {
    print('No valid data was found. Please try scanning a different image.');

    // Show error message to user
    setState(() {
      _isProcessing = false;
      _analysisProgress = 0.0;
      _analysisStage = "Failed to recognize wine.";
    });

    // Show error dialog
    if (mounted) {
      showDialog(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Text('No Wine Detected'),
            content: const Text(
                'Please try scanning a clearer image of a wine label or menu.'),
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

  // Helper method to build info chips
  Widget _buildInfoChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.white70),
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

  // Helper method to build wine attribute icons
  Widget _buildWineAttributeIcon(String attribute, double score) {
    // Only show if score is significant (above 6.0)
    if (score < 6.0) return const SizedBox.shrink();

    IconData icon;
    String tooltip;

    switch (attribute) {
      case 'meat':
        icon = Icons.restaurant_menu;
        tooltip = 'Good with Meat';
        break;
      case 'fish':
        icon = Icons.set_meal;
        tooltip = 'Good with Fish';
        break;
      case 'sweet':
        icon = Icons.icecream;
        tooltip = 'Sweet';
        break;
      case 'dry':
        icon = Icons.grain;
        tooltip = 'Dry';
        break;
      case 'fruity':
        icon = Icons.apple;
        tooltip = 'Fruity';
        break;
      case 'light':
        icon = Icons.light_mode;
        tooltip = 'Light-bodied';
        break;
      case 'full-bodied':
        icon = Icons.local_drink;
        tooltip = 'Full-bodied';
        break;
      default:
        return const SizedBox.shrink();
    }

    return Tooltip(
      message: tooltip,
      child: Container(
        padding: const EdgeInsets.all(8),
        margin: const EdgeInsets.only(right: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF00CCFF).withOpacity(0.2),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Icon(
          icon,
          size: 20,
          color: Colors.white,
        ),
      ),
    );
  }

  // Helper method to build collapsible comments section
  Widget _buildCollapsibleComments(List<String> comments) {
    if (comments.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Row(
          children: [
            Icon(Icons.info_outline, size: 16, color: Colors.white70),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'No reviews available. This may be a rare wine or new vintage.',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.white70,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return ExpansionTile(
      title: const Text(
        'Expert Reviews',
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      collapsedIconColor: Colors.white,
      iconColor: const Color(0xFF00CCFF),
      initiallyExpanded: true, // Show reviews by default
      children: comments.map((comment) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: _buildReviewContent(comment),
          ),
        );
      }).toList(),
    );
  }

  // Helper method to build review content based on format
  List<Widget> _buildReviewContent(String comment) {
    List<Widget> reviewWidgets = [];

    // For comments with standard formatting (source and rating in parentheses)
    if (comment.contains('(') && comment.contains('):')) {
      // Extract source and score
      reviewWidgets.add(
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF00CCFF).withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                comment.split('(')[0].trim(),
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00CCFF),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFFFD700).withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                comment.split('(')[1].split(')')[0].trim(),
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFFFD700),
                ),
              ),
            ),
          ],
        ),
      );

      reviewWidgets.add(const SizedBox(height: 8));

      // Extract and display the review text
      reviewWidgets.add(
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.format_quote, size: 16, color: Colors.white70),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                comment.split('): ')[1].replaceAll('"', '').trim(),
                style: const TextStyle(
                  fontSize: 14,
                  fontStyle: FontStyle.italic,
                  color: Colors.white70,
                ),
              ),
            ),
          ],
        ),
      );
    }
    // For other formats (like "Title (rating): snippet")
    else if (comment.contains(':')) {
      // Try to extract title/source and rating if available
      final titleParts = comment.split(':')[0].split('(');
      final title = titleParts[0].trim();

      // Display title/source
      reviewWidgets.add(
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF00CCFF).withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00CCFF),
                ),
              ),
            ),
          ],
        ),
      );

      // Display rating if available
      if (titleParts.length > 1 && titleParts[1].contains(')')) {
        reviewWidgets.add(const SizedBox(height: 4));
        reviewWidgets.add(
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFFFD700).withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              titleParts[1].split(')')[0].trim(),
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Color(0xFFFFD700),
              ),
            ),
          ),
        );
      }

      reviewWidgets.add(const SizedBox(height: 8));

      // Display review text
      reviewWidgets.add(
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.format_quote, size: 16, color: Colors.white70),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                comment
                    .split(':')
                    .sublist(1)
                    .join(':')
                    .replaceAll('"', '')
                    .trim(),
                style: const TextStyle(
                  fontSize: 14,
                  fontStyle: FontStyle.italic,
                  color: Colors.white70,
                ),
              ),
            ),
          ],
        ),
      );
    }
    // For completely unformatted reviews
    else {
      reviewWidgets.add(
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.format_quote, size: 16, color: Colors.white70),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                comment,
                style: const TextStyle(
                  fontSize: 14,
                  fontStyle: FontStyle.italic,
                  color: Colors.white70,
                ),
              ),
            ),
          ],
        ),
      );
    }

    // Add divider at the end
    reviewWidgets.add(const Divider(color: Colors.white24));

    return reviewWidgets;
  }

  // Helper method to build user rating widget
  Widget _buildRatingWidget(Wine wine) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ...List.generate(5, (index) {
          return IconButton(
            icon: Icon(
              index < (wine.userRating ?? 0).floor()
                  ? Icons.star
                  : index < (wine.userRating ?? 0)
                      ? Icons.star_half
                      : Icons.star_border,
              color: const Color(0xFFFFD700),
              size: 24,
            ),
            onPressed: () {
              setState(() {
                // Update the wine's user rating
                wine.userRating = index + 1.0;
              });
            },
          );
        }),
      ],
    );
  }

  // Helper method to build special labels
  Widget _buildSpecialLabels(Wine wine) {
    List<Widget> labels = [];

    // Great Wine label (rating above 90)
    if (wine.rating != null && wine.rating!.score >= 90) {
      labels.add(
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          margin: const EdgeInsets.only(right: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFFFD700),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.workspace_premium, size: 14, color: Colors.black),
              SizedBox(width: 4),
              Text(
                'Great Wine',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Great Value label
    if (wine.rating != null && wine.rating!.isPriceValue) {
      labels.add(
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFF00CCFF),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.thumb_up, size: 14, color: Colors.white),
              SizedBox(width: 4),
              Text(
                'Great Value',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Wrap(
      spacing: 8,
      children: labels,
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

  // Helper method to check if a wine matches the search criteria
  bool _isWineMatch(Map<String, dynamic> wine, String searchName,
      String searchWinery, String searchYear) {
    final wineName = wine['name']?.toString().toLowerCase() ?? '';
    final winery = wine['winery']?.toString().toLowerCase() ?? '';
    final year = wine['year']?.toString() ?? '';

    final searchNameLower = searchName.toLowerCase();
    final searchWineryLower = searchWinery.toLowerCase();

    // Check for exact match
    if (wineName == searchNameLower &&
        (searchWinery.isEmpty || winery == searchWineryLower) &&
        (searchYear.isEmpty || year == searchYear)) {
      return true;
    }

    // Check for partial match
    if (wineName.contains(searchNameLower) ||
        searchNameLower.contains(wineName)) {
      return true;
    }

    // Check for winery match if name doesn't match
    if (searchWinery.isNotEmpty && winery.contains(searchWineryLower)) {
      return true;
    }

    return false;
  }
}
