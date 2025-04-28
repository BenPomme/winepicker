import React, { useEffect, useState } from 'react';

interface ResourceWarningProps {
  resourceType: 'icon';
}

const ResourceWarning: React.FC<ResourceWarningProps> = ({ resourceType }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV === 'development') {
      // Simple check for icon existence
      const img = new Image();
      img.onload = () => setVisible(false);
      img.onerror = () => setVisible(true);
      img.src = '/icons/app-icon-192.png';
    }
  }, [resourceType]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-amber-50 border-l-4 border-amber-400 shadow-lg rounded-lg max-w-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">
            Icon Resource Missing
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              App icons are missing or invalid. Run <code className="bg-amber-100 px-1 rounded">node scripts/generate-icons.js</code> to generate placeholder icons.
            </p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              className="text-sm text-amber-800 hover:text-amber-600 font-medium"
              onClick={() => setVisible(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceWarning;