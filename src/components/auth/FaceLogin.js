import React, { useState, useRef, useCallback } from 'react';
import { Camera, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../contexts/AuthProvider';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const FaceLogin = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const { login } = useAuth();
  const router = useRouter();

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
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
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
        setIsCapturing(false);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    startCamera();
    setIsCapturing(true);
  }, [startCamera]);

  const handleLogin = useCallback(async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await apiClient.loginWithFace(capturedImage);
      
      if (response.success && response.data) {
        login(response.data.user, response.data.token);
        toast.success('Login successful!');
        router.push('/user/dashboard');
      } else {
        setError(response.error || 'Face verification failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, login, router]);

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
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Camera className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Face Login</h2>
          <p className="text-gray-600">
            Look directly at the camera and ensure good lighting for accurate recognition.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-error-500" />
            <span className="text-error-700 text-sm">{error}</span>
          </div>
        )}

        {!isCapturing && !capturedImage && (
          <button
            onClick={handleStartCapture}
            className="w-full btn-primary"
            disabled={isProcessing}
          >
            <Camera className="h-5 w-5 mr-2" />
            Start Camera
          </button>
        )}

        {isCapturing && (
          <div className="space-y-4">
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

        {capturedImage && (
          <div className="space-y-4">
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
                disabled={isProcessing}
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Retake
              </button>
              <button
                onClick={handleLogin}
                className="flex-1 btn-primary"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Login
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Having trouble? Try{' '}
            <button
              onClick={() => router.push('/auth/login')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              traditional login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaceLogin; 