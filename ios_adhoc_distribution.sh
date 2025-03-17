#!/bin/bash

echo "Pick My Wine - iOS Ad Hoc Distribution Helper"
echo "============================================="
echo ""
echo "This script will help you prepare your app for ad hoc distribution"
echo "to your friend's iPhone without an Apple Developer account."
echo ""

# Step 1: Make sure Xcode is properly set up
echo "Step 1: Opening Xcode project..."
open ios/Runner.xcworkspace

echo ""
echo "Follow these steps in Xcode:"
echo "1. Select the 'Runner' project in the left sidebar"
echo "2. Select the 'Runner' target"
echo "3. Go to the 'Signing & Capabilities' tab"
echo "4. Make sure 'Automatically manage signing' is checked"
echo "5. Select your Personal Team from the dropdown"
echo "6. If you don't have a team, sign in with your Apple ID"
echo ""
echo "Press Enter when you've completed these steps..."
read

# Step 2: Get UDID of friend's device
echo ""
echo "Step 2: Getting your friend's device UDID"
echo ""
echo "You need your friend's device UDID to register it for development."
echo "Have your friend follow these steps:"
echo ""
echo "1. Connect their iPhone to their Mac (or your Mac if they're with you)"
echo "2. Open Finder and select the iPhone from the sidebar"
echo "3. Click on the device name multiple times to reveal the identifier"
echo "4. Copy the identifier and send it to you"
echo ""
echo "Alternatively, they can install a profile from https://udid.tech"
echo "and send you the UDID shown on that website."
echo ""
echo "Enter the UDID here: "
read udid

echo ""
echo "Now you need to:"
echo "1. Add this device to your provisioning profile in Xcode"
echo "2. Go to Window > Devices and Simulators"
echo "3. Click the '+' button to add a new device"
echo "4. Enter a name and the UDID you received"
echo ""
echo "Press Enter when you've completed these steps..."
read

# Step 3: Build the app
echo ""
echo "Step 3: Building the app for your friend's device"
echo ""
echo "Now you need to build the app with your registered device:"
echo "1. Select your friend's device from the device dropdown in Xcode"
echo "   (It will be listed under 'iOS Device' with its name)"
echo "2. Press ⌘+B to build the app"
echo "3. When the build succeeds, press ⌘+R to run it on the simulator"
echo ""
echo "Press Enter when the build is successful..."
read

# Step 4: Export the IPA
echo ""
echo "Step 4: Exporting the IPA file"
echo ""
echo "Now you'll create an IPA file to share with your friend:"
echo "1. In Xcode, select Product > Archive"
echo "2. When archiving completes, click 'Distribute App'"
echo "3. Select 'Development' distribution method"
echo "4. Select the devices you want to install on"
echo "5. Select your development team"
echo "6. Choose a location to save the IPA file"
echo ""
echo "Press Enter when you have the IPA file..."
read

# Step 5: Share the app
echo ""
echo "Step 5: Sharing the app with your friend"
echo ""
echo "Now you need to share the IPA with your friend:"
echo "1. Email the IPA file to your friend"
echo "2. Your friend needs to install Apple's 'Xcode Helper' app on their device"
echo "3. They can then install the app via:"
echo "   - Apple Configurator 2"
echo "   - iMazing app (easier for non-technical users)"
echo "   - AltStore (requires periodic refreshing)"
echo ""
echo "Note: This method will allow your friend to use the app for up to 7 days"
echo "before it needs to be reinstalled. This is a limitation of free Apple accounts."
echo ""
echo "For a more permanent solution, consider:"
echo "1. Getting an Apple Developer account ($99/year)"
echo "2. Using TestFlight for distribution (much easier)"
echo "3. Exploring third-party signing services"
echo ""

echo "Distribution script completed!" 