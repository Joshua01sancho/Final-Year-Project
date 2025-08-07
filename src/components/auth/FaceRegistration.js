import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RotateCcw, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

function FaceRegistration({ onRegistrationComplete, isSubmitting = false }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [registrationStep, setRegistrationStep] = useState('initial'); // initial, capturing, captured, processing
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const testCameraAccess = async () => {
    try {
      console.log('Testing camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('Camera test successful!');
      stream.getTracks().forEach(track => track.stop());
      toast.success('Camera is working! Please try the registration again.');
      setError(null);
    } catch (err) {
      console.error('Camera test failed:', err);
      toast.error(`Camera test failed: ${err.message}`);
    }
  };

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsCameraReady(false);
      console.log('Starting camera...');
      console.log('Current URL:', window.location.href);
      console.log('Is HTTPS:', window.location.protocol === 'https:');
      console.log('Is localhost:', window.location.hostname === 'localhost');
      console.log('MediaDevices supported:', !!navigator.mediaDevices);
      console.log('getUserMedia supported:', !!navigator.mediaDevices?.getUserMedia);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported in this browser. Please use a modern browser.');
        return;
      }
      
      // Check if camera is available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices);
      
      if (videoDevices.length === 0) {
        setError('No camera found. Please connect a camera and try again.');
        return;
      }
      
      // Try different camera configurations
      let stream = null;
      const constraints = [
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        },
        {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        },
        {
          video: {
            facingMode: 'user'
          }
        },
        {
          video: true
        }
      ];
      
      for (const constraint of constraints) {
        try {
          console.log('Trying camera constraint:', constraint);
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          console.log('Camera stream obtained with constraint:', constraint);
          break;
        } catch (err) {
          console.log('Failed with constraint:', constraint, err);
          if (constraint === constraints[constraints.length - 1]) {
            throw err; // Re-throw if this was the last attempt
          }
        }
      }
      
      if (!stream) {
        throw new Error('Failed to access camera with any configuration');
      }
      
      // Function to initialize video with retry
      const initializeVideo = (retryCount = 0) => {
        if (videoRef.current) {
          console.log('Video ref available, initializing...');
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          
          // Ensure video loads and plays
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            videoRef.current.play().catch(e => {
              console.error('Error playing video:', e);
              setError('Unable to start video playback. Please try again.');
            });
          };
          
          videoRef.current.oncanplay = () => {
            console.log('Video can play - camera is ready');
            setIsCameraReady(true);
          };
          
          videoRef.current.onerror = (e) => {
            console.error('Video error:', e);
            setError('Video playback error. Please try again.');
          };
        } else if (retryCount < 5) {
          console.log(`Video ref not available, retrying... (${retryCount + 1}/5)`);
          setTimeout(() => initializeVideo(retryCount + 1), 200);
        } else {
          console.error('Video ref not available after retries');
          setError('Camera initialization failed. Please refresh and try again.');
        }
      };
      
      // Set registration step to capturing first, then initialize video
      setRegistrationStep('capturing');
      
      // Start initialization after a short delay to ensure the video element is rendered
      setTimeout(() => {
        initializeVideo();
      }, 100);
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions and try again. Click the camera icon in your browser\'s address bar to allow access.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is in use by another application. Please close other camera apps and try again.');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera access not supported. Please use HTTPS or localhost.');
      } else {
        setError(`Camera error: ${err.message}. Please check permissions and try again.`);
      }
    }
  }, [isCameraReady]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const captureImage = useCallback(() => {
    console.log('Capture button clicked');
    console.log('videoRef.current:', videoRef.current);
    console.log('canvasRef.current:', canvasRef.current);
    console.log('isCameraReady:', isCameraReady);
    
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      setError('Camera not initialized. Please refresh and try again.');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    console.log('Canvas context:', context);
    
    if (!context) {
      console.error('Canvas context not available');
      setError('Failed to initialize canvas. Please try again.');
      return;
    }
    
    // Use default dimensions if video dimensions are not available
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    
    console.log('Using dimensions:', width, 'x', height);
    
    try {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Image captured successfully, length:', imageData.length);
      setCapturedImage(imageData);
      setRegistrationStep('captured');
      stopCamera();
    } catch (error) {
      console.error('Error capturing image:', error);
      setError('Failed to capture image. Please try again.');
    }
  }, [stopCamera, isCameraReady]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    setRegistrationStep('initial');
  }, []);

  const handleRegistration = useCallback(async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    setRegistrationStep('processing');
    setError(null);

    try {
      // Call the parent component's registration function
      await onRegistrationComplete(capturedImage);
      
      // If successful, the parent will handle the redirect
      toast.success('Face registered successfully!');
    } catch (err) {
      console.error('Registration error:', err);
      setError('Face registration failed. Please try again.');
      setRegistrationStep('captured');
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, onRegistrationComplete]);

  const handleStartCapture = useCallback(() => {
    setIsCapturing(true);
    startCamera();
  }, [startCamera]);

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-error-50 border border-error-200 rounded-md flex items-center space-x-2">
          <XCircle className="h-5 w-5 text-error-500" />
          <span className="text-error-700 text-sm">{error}</span>
        </div>
      )}

      {/* Initial State */}
      {registrationStep === 'initial' && (
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Camera className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Register Your Face
          </h3>
          <p className="text-gray-600 mb-6">
            This will be used for secure biometric authentication when you login.
          </p>
          <button
            onClick={handleStartCapture}
            className="w-full btn-primary"
            disabled={isSubmitting}
          >
            <Camera className="h-5 w-5 mr-2" />
            Start Camera
          </button>
          {error && (
            <button
              onClick={handleStartCapture}
              className="w-full mt-3 btn-secondary"
              disabled={isSubmitting}
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Retry Camera
            </button>
          )}
        </div>
      )}

      {/* Capturing State */}
      {registrationStep === 'capturing' && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Position Your Face
            </h3>
            <p className="text-gray-600">
              Look directly at the camera and ensure good lighting
            </p>
          </div>
          
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 bg-gray-900 rounded-lg object-cover border-2 border-gray-300"
              style={{ minHeight: '256px' }}
            />
            {/* Fallback if video doesn't load */}
            {videoRef.current && videoRef.current.readyState < 3 && (
              <div className="absolute inset-0 bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Loading camera...</p>
                </div>
              </div>
            )}
            <div className="absolute inset-0 border-2 border-primary-500 rounded-lg pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-primary-500 rounded-full"></div>
            </div>
            {/* Camera status indicator */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs p-1 rounded">
              Camera Status: {isCameraReady ? 'Ready' : 'Loading...'}
            </div>
          </div>
          
          <button
            onClick={captureImage}
            className="w-full btn-success"
            disabled={!isCameraReady}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            {isCameraReady ? 'Capture Photo' : 'Camera Loading...'}
          </button>
        </div>
      )}

      {/* Captured State */}
      {registrationStep === 'captured' && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Review Your Photo
            </h3>
            <p className="text-gray-600">
              Make sure your face is clearly visible and well-lit
            </p>
          </div>
          
          <div className="relative">
            <img
              src={capturedImage}
              alt="Captured face"
              className="w-full h-64 bg-gray-900 rounded-lg object-cover"
            />
            <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={retakePhoto}
              className="flex-1 btn-secondary"
              disabled={isProcessing || isSubmitting}
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Retake
            </button>
            <button
              onClick={handleRegistration}
              className="flex-1 btn-primary"
              disabled={isProcessing || isSubmitting}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Register Face
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {registrationStep === 'processing' && (
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Processing Registration
          </h3>
          <p className="text-gray-600">
            Please wait while we register your face and create your account...
          </p>
        </div>
      )}

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for Best Results:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure good lighting on your face</li>
          <li>• Remove glasses or hats if possible</li>
          <li>• Look directly at the camera</li>
          <li>• Keep your face centered in the frame</li>
        </ul>
      </div>

      {/* Camera Troubleshooting */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">Camera Troubleshooting:</h4>
          <ul className="text-sm text-yellow-800 space-y-1 mb-3">
            <li>• Make sure your camera is not being used by another application</li>
            <li>• Check that your browser has permission to access the camera</li>
            <li>• Try refreshing the page and allowing camera access when prompted</li>
            <li>• If using Chrome, click the camera icon in the address bar to allow access</li>
            <li>• Make sure you're using HTTPS or localhost (camera access requires secure context)</li>
          </ul>
          <button
            onClick={testCameraAccess}
            className="btn-secondary text-sm"
          >
            Test Camera Access
          </button>
        </div>
      )}
    </div>
  );
};

export default FaceRegistration; 