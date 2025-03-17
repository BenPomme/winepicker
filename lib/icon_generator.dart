import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

// This is a utility class to generate app icons during development
// It creates a wine glass icon with a gradient background
void main() async {
  // Ensure Flutter is initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Create a 1024x1024 icon (common size for app stores)
  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder);
  const size = Size(1024, 1024);
  final iconPainter = WineIconPainter();

  // Paint the icon
  iconPainter.paint(canvas, size);

  // Convert to an image
  final picture = recorder.endRecording();
  final img = await picture.toImage(size.width.toInt(), size.height.toInt());
  final byteData = await img.toByteData(format: ui.ImageByteFormat.png);
  final buffer = byteData!.buffer.asUint8List();

  // Save to disk
  final iconDir = Directory('assets/icons');
  if (!await iconDir.exists()) {
    await iconDir.create(recursive: true);
  }
  final file = File('${iconDir.path}/app_icon.png');
  await file.writeAsBytes(buffer);

  print('Icon saved to ${file.path}');
  exit(0);
}

class WineIconPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Background with gradient
    final Paint bgPaint = Paint()
      ..shader = ui.Gradient.linear(
        const Offset(0, 0),
        Offset(size.width, size.height),
        [
          const Color(0xFF6A3DE8), // Deep purple
          const Color(0xFF8B60E3), // Lighter purple
        ],
      );

    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bgPaint);

    // Wine glass outline
    final paintStroke = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.04;

    // Wine glass fill
    final paintFill = Paint()
      ..color = Colors.red[900]!
      ..style = PaintingStyle.fill;

    // Calculate sizes for drawing
    final centerX = size.width / 2;
    final glassWidth = size.width * 0.5;
    final stemWidth = size.width * 0.08;
    final bowlHeight = size.height * 0.4;
    final stemHeight = size.height * 0.35;
    final baseWidth = size.width * 0.3;

    // Bowl of the glass (top part)
    final bowlPath = Path()
      ..moveTo(centerX - glassWidth / 2, size.height * 0.2)
      ..quadraticBezierTo(centerX, size.height * 0.05, centerX + glassWidth / 2,
          size.height * 0.2)
      ..lineTo(centerX + stemWidth / 2, size.height * 0.2 + bowlHeight)
      ..lineTo(centerX - stemWidth / 2, size.height * 0.2 + bowlHeight)
      ..close();

    // Draw the wine inside the glass
    final winePath = Path()
      ..moveTo(centerX - glassWidth / 2 + size.width * 0.05, size.height * 0.25)
      ..quadraticBezierTo(centerX, size.height * 0.1 + size.width * 0.05,
          centerX + glassWidth / 2 - size.width * 0.05, size.height * 0.25)
      ..lineTo(centerX + stemWidth / 2 - size.width * 0.01,
          size.height * 0.2 + bowlHeight - size.width * 0.05)
      ..lineTo(centerX - stemWidth / 2 + size.width * 0.01,
          size.height * 0.2 + bowlHeight - size.width * 0.05)
      ..close();

    // Stem of the glass
    final stemPath = Path()
      ..moveTo(centerX - stemWidth / 2, size.height * 0.2 + bowlHeight)
      ..lineTo(centerX + stemWidth / 2, size.height * 0.2 + bowlHeight)
      ..lineTo(
          centerX + stemWidth / 2, size.height * 0.2 + bowlHeight + stemHeight)
      ..lineTo(
          centerX - stemWidth / 2, size.height * 0.2 + bowlHeight + stemHeight)
      ..close();

    // Base of the glass
    final basePath = Path()
      ..moveTo(
          centerX - baseWidth / 2, size.height * 0.2 + bowlHeight + stemHeight)
      ..lineTo(
          centerX + baseWidth / 2, size.height * 0.2 + bowlHeight + stemHeight)
      ..lineTo(centerX + baseWidth / 2,
          size.height * 0.2 + bowlHeight + stemHeight + size.height * 0.05)
      ..lineTo(centerX - baseWidth / 2,
          size.height * 0.2 + bowlHeight + stemHeight + size.height * 0.05)
      ..close();

    // Draw wine glass parts
    canvas.drawPath(bowlPath, paintFill);
    canvas.drawPath(winePath, paintFill..color = Colors.red[700]!);
    canvas.drawPath(stemPath, Paint()..color = Colors.white.withOpacity(0.9));
    canvas.drawPath(basePath, Paint()..color = Colors.white.withOpacity(0.9));

    // Draw outlines
    canvas.drawPath(bowlPath, paintStroke);
    canvas.drawPath(stemPath, paintStroke);
    canvas.drawPath(basePath, paintStroke);

    // Draw some shine reflections
    final highlightPaint = Paint()
      ..color = Colors.white.withOpacity(0.4)
      ..style = PaintingStyle.fill;

    final highlight = Path()
      ..moveTo(centerX - glassWidth / 3, size.height * 0.22)
      ..quadraticBezierTo(centerX - glassWidth / 6, size.height * 0.15,
          centerX - glassWidth / 8, size.height * 0.25)
      ..quadraticBezierTo(centerX - glassWidth / 4, size.height * 0.35,
          centerX - glassWidth / 3, size.height * 0.22);

    canvas.drawPath(highlight, highlightPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
