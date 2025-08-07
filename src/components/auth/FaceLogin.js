import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../contexts/AuthProvider';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
// Temporarily disable face-api.js to fix the fs module issue
// import * as faceapi from 'face-api.js';

function FaceLogin() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(true); // Set to true for now
  const [isLoadingModels, setIsLoadingModels] = useState(false); // Set to false for now
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const { login } = useAuth();
  const router = useRouter();

  // Temporarily disable model loading to fix the fs module issue
  // const loadModels = useCallback(async () => {
  //   try {
  //     console.log('Loading face-api models...');
  //     setError(null);
  //     setIsLoadingModels(true);
  //     
  //     // Load models one by one with better error handling
  //     console.log('Loading tiny face detector...');
  //     await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  //     
  //     console.log('Loading face landmark model...');
  //     await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
  //     
  //     console.log('Loading face recognition model...');
  //     await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
  //     
  //     console.log('Loading face expression model...');
  //     await faceapi.nets.faceExpressionNet.loadFromUri('/models');
  //     
  //     console.log('Face-api models loaded successfully');
  //     setIsModelLoaded(true);
  //   } catch (error) {
  //     console.error('Error loading face-api models:', error);
  //     setError(`Failed to load face recognition models: ${error.message}. Please check your internet connection and try again.`);
  //   } finally {
  //     setIsLoadingModels(false);
  //   }
  // }, []);

  // useEffect(() => {
  //   loadModels();
  // }, [loadModels]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      console.log('Starting camera...');
      
      // Check if camera is available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices);
      
      if (videoDevices.length === 0) {
        setError('No camera found. Please connect a camera and try again.');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      console.log('Camera stream obtained:', stream);
      
      if (videoRef.current) {
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
        
        // Add timeout in case camera doesn't load
        setTimeout(() => {
          if (!isCameraReady) {
            console.log('Camera timeout - forcing ready state');
            setIsCameraReady(true);
          }
        }, 5000); // 5 second timeout
        
        setIsCapturing(true);
      } else {
        console.error('Video ref not available');
        setError('Camera initialization failed. Please try again.');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is in use by another application. Please close other camera apps and try again.');
      } else {
        setError(`Camera error: ${err.message}. Please check permissions and try again.`);
      }
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
      setIsCapturing(false);
      stopCamera();
    } catch (error) {
      console.error('Error capturing image:', error);
      setError('Failed to capture image. Please try again.');
    }
  }, [stopCamera, isCameraReady]);

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
      // Use face-api.js for local face recognition if available, otherwise use basic method
      const response = await apiClient.loginWithFaceLocal(capturedImage);
      
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
    setIsCameraReady(false); // Reset camera ready state
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
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Using simplified face detection. Face recognition is processed on the server.
            </p>
          </div>
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

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

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