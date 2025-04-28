import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { UploadState } from '../utils/types';

interface ImageUploaderProps {
  onUpload: (base64Image: string) => Promise<void>;
  uploadState?: UploadState;
}

const ImageUploader = ({ onUpload, uploadState = { isLoading: false, error: null } }: ImageUploaderProps) => {
  const { t } = useTranslation('common');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera by default
      });
      streamRef.current = stream;
      setShowCamera(true);
      setCameraError(null);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Unable to access camera. Please make sure you have granted camera permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  // Capture photo
  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const width = videoRef.current.videoWidth || videoRef.current.clientWidth;
    const height = videoRef.current.videoHeight || videoRef.current.clientHeight;

    if (!width || !height) {
      console.error('Video dimensions not available');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(videoRef.current, 0, 0, width, height);

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas is empty'));
      }, 'image/jpeg', 0.8);
    });

    // Create a File object from the blob
    const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
    
    // Process the file like a regular file upload
    await processFile(file);
    stopCamera();
  };

  useEffect(() => {
    if (showCamera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play();
      };
    }
  }, [showCamera]);

  return (
    <div className="w-full max-w-xl mx-auto">
      {uploadState.isLoading ? (
        <div className="bg-white rounded-2xl p-8 shadow-card text-center">
          <div className="mb-4">
            <div className="w-full bg-background-alt rounded-full h-2 mb-2">
              <div 
                className="progress-bar" 
                style={{ width: `${uploadState.progress || 20}%` }}
              ></div>
            </div>
            <p className="text-text-secondary text-sm">{uploadState.stage || t('upload.processing')}</p>
          </div>
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : showCamera ? (
        <div className="bg-white rounded-2xl p-4 shadow-card overflow-hidden">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onCanPlay={() => { videoRef.current?.play(); }}
              className="w-full rounded-xl"
            />
            <button
              onClick={stopCamera}
              className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-button hover:shadow-button-hover transition-all duration-300"
              aria-label="Close camera"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={capturePhoto}
              className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-primary hover:bg-primary-dark text-white rounded-full p-4 shadow-button hover:shadow-button-hover transition-all duration-300"
              aria-label="Take photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          {cameraError && (
            <div className="mt-3 p-3 bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl">
              <p className="text-sm">{cameraError}</p>
            </div>
          )}
        </div>
      ) : (
        <div 
          className="upload-area"
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
          <div className="space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-xl font-medium text-text-primary mb-1">
                {t('upload.dropzone')}
              </p>
              <p className="text-text-secondary text-sm">
                {t('upload.supportedFormats', 'Supported formats: JPG, PNG, HEIC, WEBP')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={openFileSelector}
                className="btn btn-primary"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
                </svg>
                {t('upload.button')}
              </button>
              <button
                onClick={startCamera}
                className="btn btn-secondary"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('upload.useCamera', 'Use Camera')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 