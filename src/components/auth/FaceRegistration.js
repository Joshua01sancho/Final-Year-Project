import React, { useState, useRef, useCallback } from 'react';
import { Camera, RotateCcw, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const FaceRegistration = ({ onRegistrationComplete, isSubmitting }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [registrationStep, setRegistrationStep] = useState('initial'); // initial, capturing, captured, processing
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setRegistrationStep('capturing');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions and try again.');
    }
  }, []);

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
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        setRegistrationStep('captured');
        stopCamera();
      }
    }
  }, [stopCamera]);

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
              className="w-full h-64 bg-gray-900 rounded-lg object-cover"
            />
            <div className="absolute inset-0 border-2 border-primary-500 rounded-lg pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-primary-500 rounded-full"></div>
            </div>
          </div>
          
          <button
            onClick={captureImage}
            className="w-full btn-success"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Capture Photo
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
    </div>
  );
};

export default FaceRegistration; 