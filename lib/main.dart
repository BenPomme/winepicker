import 'package:flutter/material.dart';
import 'dart:io';
import 'dart:convert';
import 'package:image_picker/image_picker.dart';
import 'package:google_ml_kit/google_ml_kit.dart';
import 'package:path_provider/path_provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:share_plus/share_plus.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

// OpenAI API key should be provided via environment variables or secure storage
// For development, replace this with your own API key
// TO DO: Implement proper environment variable loading using flutter_dotenv package:
// 1. Add flutter_dotenv to pubspec.yaml
// 2. Load environment variables in main() with: await dotenv.load(fileName: ".env");
// 3. Access API key with: dotenv.env['OPENAI_API_KEY'] ?? '';
const String openAIApiKey = 'YOUR_OPENAI_API_KEY_HERE';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // TO DO: Load environment variables here
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

class WineApp extends StatelessWidget {
  const WineApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const WineMenuScannerPage();
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
  bool _showOnlyBestValue = false;
  bool _hasAppliedPriceFilter = false;
  RangeValues _priceRange = const RangeValues(10, 200);
  String _sortOption = 'default'; // default, rating, price-asc, price-desc

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

              // Image display container
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
            ],
          ),
        ),
      ),
    );
  }

  // Method to handle image picking
  Future<void> _pickMenuImage() async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1800,
        maxHeight: 1800,
      );

      if (pickedFile != null) {
        setState(() {
          _imageFile = pickedFile;
          _isProcessing = true;
        });

        // Simulate processing for this example - in a real app, you'd analyze the image
        await Future.delayed(const Duration(seconds: 2));

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
              review:
                  'Exquisite balance of fruit and tannins with a long finish.',
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
              padding: const EdgeInsets.all(24),
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
}
