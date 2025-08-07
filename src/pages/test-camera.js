import React, { useState, useRef } from 'react';
import Head from 'next/head';

function TestCameraPage() {
  const [error, setError] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      setError(null);
      setIsCameraReady(false);
      
      console.log('=== Camera Test Debug Info ===');
      console.log('Current URL:', window.location.href);
      console.log('Is HTTPS:', window.location.protocol === 'https:');
      console.log('Is localhost:', window.location.hostname === 'localhost');
      console.log('MediaDevices supported:', !!navigator.mediaDevices);
      console.log('getUserMedia supported:', !!navigator.mediaDevices?.getUserMedia);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported in this browser.');
        return;
      }
      
      // Check available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices);
      
      if (videoDevices.length === 0) {
        setError('No camera found. Please connect a camera and try again.');
        return;
      }
      
      // Try to get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      console.log('Camera stream obtained successfully!');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          videoRef.current.play().catch(e => {
            console.error('Error playing video:', e);
            setError('Unable to start video playback.');
          });
        };
        
        videoRef.current.oncanplay = () => {
          console.log('Video can play - camera is ready');
          setIsCameraReady(true);
        };
        
        videoRef.current.onerror = (e) => {
          console.error('Video error:', e);
          setError('Video playback error.');
        };
      } else {
        setError('Video element not available.');
      }
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is in use by another application.');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera access not supported. Please use HTTPS or localhost.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  };

  return (
    <>
      <Head>
        <title>Camera Test | E-Vote</title>
      </Head>

      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Camera Test</h1>
            <p className="text-gray-600">Testing camera access for face registration</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {isCameraReady && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700 text-sm">✅ Camera is working!</p>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={startCamera}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Start Camera Test
              </button>

              {isCameraReady && (
                <button
                  onClick={stopCamera}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Stop Camera
                </button>
              )}
            </div>

            {isCameraReady && (
              <div className="mt-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                />
              </div>
            )}

            <div className="mt-6 text-sm text-gray-600">
              <h3 className="font-medium mb-2">Debug Information:</h3>
              <ul className="space-y-1">
                <li>• URL: {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</li>
                <li>• Protocol: {typeof window !== 'undefined' ? window.location.protocol : 'Loading...'}</li>
                <li>• Hostname: {typeof window !== 'undefined' ? window.location.hostname : 'Loading...'}</li>
                <li>• MediaDevices: {typeof navigator !== 'undefined' && navigator.mediaDevices ? 'Supported' : 'Not Supported'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default TestCameraPage; 