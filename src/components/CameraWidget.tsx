'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CameraWidgetProps {
  onPhotoSaved?: () => void;
}

export default function CameraWidget({ onPhotoSaved }: CameraWidgetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [alreadyPostedToday, setAlreadyPostedToday] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const checkTodayPost = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data, error: checkError } = await supabase
        .from('daily_selfies')
        .select('id')
        .gte('created_at', todayStart.toISOString())
        .limit(1);
      if (!checkError && data && data.length > 0) {
        setAlreadyPostedToday(true);
      }
    };
    checkTodayPost();
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setSaved(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false,
      });
      setStream(mediaStream);
      setHasPermission(true);
    } catch (err: unknown) {
      console.error("Error accessing camera:", err);
      setHasPermission(false);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Camera error: ${errorMessage}`);
    }
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.85));
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setSaved(false);
    startCamera();
  };

  const uploadPhoto = async () => {
    if (!capturedImage) return;
    setIsUploading(true);
    setError(null);
    try {
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const fileName = `selfies/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('selfies')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('selfies')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('daily_selfies')
        .insert({ image_url: publicUrlData.publicUrl });
      if (dbError) throw dbError;

      setCapturedImage(null);
      setAlreadyPostedToday(true);
      setSaved(true);
      onPhotoSaved?.();
    } catch (err: unknown) {
      console.error("Upload failed", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Permission denied state ───
  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-full gap-3 bg-black">
        <div className="w-16 h-16 border border-white/20 flex items-center justify-center mix-blend-difference mb-2">
          <X className="w-6 h-6 text-white" />
        </div>
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-text-muted">Camera Intercepted</p>
        <button onClick={startCamera} className="text-white text-[10px] font-black tracking-widest uppercase border-b border-white hover:border-transparent transition-colors mt-2 pb-1">
          Override Access
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-black">
      <canvas ref={canvasRef} className="hidden" />

      {/* Toast messages */}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-black border border-error-red text-white px-4 py-3 text-[10px] uppercase tracking-widest font-bold z-50">
          <span className="text-error-red mr-2">SYS_ERR:</span> {error}
        </div>
      )}
      {saved && !capturedImage && (
        <div className="absolute top-4 left-4 right-4 bg-white border border-white text-black px-4 py-3 text-[10px] uppercase tracking-widest font-black z-50">
          ✓ RECORD ARCHIVED
        </div>
      )}

      {/* ─── Captured Image Review ─── */}
      {capturedImage ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <img src={capturedImage} alt="Captured Selfie" className="w-full h-full object-cover grayscale" />

          {/* Brutalist bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/20 p-5 flex justify-center gap-6">
            <button onClick={retakePhoto} disabled={isUploading}
              className="w-14 h-14 border border-white/20 bg-transparent flex items-center justify-center text-white hover:border-white transition-all disabled:opacity-50 group">
              <RefreshCw className="w-5 h-5 group-hover:-rotate-90 transition-transform duration-500" />
            </button>
            <button onClick={uploadPhoto} disabled={isUploading}
              className="w-14 h-14 bg-white border border-white flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 group glow-white">
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-black animate-spin" />
              ) : (
                <Check className="w-7 h-7 text-black group-hover:scale-125 transition-transform" />
              )}
            </button>
          </div>
        </div>
      ) : (
        /* ─── Live Viewfinder / Prompt ─── */
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          {stream ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted
                className="absolute inset-0 w-full h-full object-cover grayscale" />

              {/* Architectural Frame Overlay */}
              <div className="absolute inset-6 border border-white/20 pointer-events-none z-10 flex flex-col justify-between p-2">
                <div className="flex justify-between w-full">
                  <div className="w-2 h-2 border-t border-l border-white" />
                  <div className="w-2 h-2 border-t border-r border-white" />
                </div>
                <div className="flex justify-between w-full">
                  <div className="w-2 h-2 border-b border-l border-white" />
                  <div className="w-2 h-2 border-b border-r border-white" />
                </div>
              </div>

              {/* Shutter Button */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
                <button onClick={capturePhoto}
                  className="w-20 h-20 border border-white flex items-center justify-center group active:scale-95 transition-all duration-300">
                  <div className="w-16 h-16 bg-white group-hover:scale-90 transition-transform duration-300" />
                </button>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black z-0">
              {/* Monochromatic background texture could go here, for now solid black */}

              <div className="z-10 text-center flex flex-col items-center gap-6 p-6 border border-white/10 hover:border-white/30 transition-colors w-4/5 max-w-sm">
                {alreadyPostedToday ? (
                  <>
                    <div className="w-16 h-16 border border-white flex items-center justify-center bg-white">
                      <Check className="w-8 h-8 text-black" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter text-white relative z-10 w-fit mix-blend-difference">Capture Complete</h3>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted mt-2 mix-blend-difference z-10">Awaiting next cycle</p>
                    </div>
                  </>
                ) : (
                  <>
                    <button onClick={startCamera}
                      className="w-16 h-16 border border-white/30 flex items-center justify-center hover:border-white hover:bg-white hover:text-black transition-all group duration-300 text-white">
                      <Camera className="w-7 h-7" />
                    </button>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter text-white">Initialize Optics</h3>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted mt-2">Sys_Access required</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
