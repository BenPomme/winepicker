import { useState, useRef } from 'react';
import { UploadState } from '../utils/types';

interface ImageUploaderProps {
  onUpload: (base64Image: string) => Promise<void>;
  uploadState: UploadState;
}

const ImageUploader = ({ onUpload, uploadState }: ImageUploaderProps) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  // Handle file drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>, active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(active);
  };

  // Process the selected file
  const processFile = async (file: File) => {
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }

    // Convert the file to Base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        // Extract the Base64 data part (remove the prefix)
        const base64String = event.target.result.toString();
        const base64Data = base64String.split(',')[1];
        
        // Call the upload handler
        await onUpload(base64Data);
      }
    };
    reader.readAsDataURL(file);
  };

  // Click the hidden file input
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {uploadState.isLoading ? (
        <div className="bg-white rounded-lg p-4 shadow-apple text-center">
          <div className="mb-2">
            <div className="w-full bg-background rounded-full h-2 mb-1">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${uploadState.progress * 100}%` }}
              ></div>
            </div>
            <p className="text-secondary text-xs">{uploadState.stage}</p>
          </div>
          <div className="flex justify-center">
            <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      ) : (
        <div 
          className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
            dragActive ? 'border-primary bg-primary bg-opacity-5' : 'border-border hover:border-primary hover:bg-primary hover:bg-opacity-5'
          }`}
          onDragOver={(e) => handleDrag(e, true)}
          onDragEnter={(e) => handleDrag(e, true)}
          onDragLeave={(e) => handleDrag(e, false)}
          onDrop={handleDrop}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-background-dark mb-1">Scan a Wine Label or Menu</h3>
            <p className="text-secondary text-xs mb-3">
              Drag &amp; drop an image here, or click to select
            </p>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the parent div's onClick
                openFileSelector();
              }}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-1.5 rounded text-sm transition-colors"
            >
              Select Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 