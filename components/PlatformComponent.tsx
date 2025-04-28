import React from 'react';
import { platformSelect, isPlatformWeb, isPlatformIOS } from '../utils/platform';

/**
 * A simple component that demonstrates platform-specific rendering
 */
const PlatformComponent: React.FC = () => {
  // Using the platformSelect helper for conditional rendering
  const content = platformSelect({
    web: <WebContent />,
    ios: <IOSContent />,
    default: <DefaultContent />,
  });

  return (
    <div className="platform-component">
      {content}
    </div>
  );
};

const WebContent: React.FC = () => (
  <div className="web-specific">
    <h3>Web Platform</h3>
    <p>This content is specifically rendered for web browsers.</p>
  </div>
);

const IOSContent: React.FC = () => {
  // In a real component, this would use React Native components
  if (isPlatformWeb()) {
    return (
      <div className="ios-simulation">
        <h3>iOS Platform (Simulated)</h3>
        <p>This simulates iOS-specific content when viewed in a web browser.</p>
        <p>On a real iOS device, this would use native components.</p>
      </div>
    );
  }

  // On real iOS devices, this would return React Native components
  // For now, we're just returning web content for demonstration
  return (
    <div className="ios-native">
      <h3>iOS Native</h3>
      <p>Native iOS content would be shown here.</p>
    </div>
  );
};

const DefaultContent: React.FC = () => (
  <div className="default-content">
    <h3>Default Platform</h3>
    <p>This content is shown when no platform-specific version is available.</p>
  </div>
);

export default PlatformComponent;