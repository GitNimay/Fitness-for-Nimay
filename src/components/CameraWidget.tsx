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
      <div className="flex flex-col items-center justify-center p-6 text-center h-full gap-3">
         <div className="w-14 h-14 rounded-2xl bg-error-red/10 flex items-center justify-center">
           <X className="w-6 h-6 text-error-red" />
         </div>
         <p className="text-sm text-text-secondary">Camera access was denied</p>
         <button onClick={startCamera} className="text-neon-cyan text-sm font-medium hover:underline">
           Try Again
         </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden rounded-xl bg-black/40">
      <canvas ref={canvasRef} className="hidden" />

      {/* Toast messages */}
      {error && (
        <div className="absolute top-3 left-3 right-3 bg-error-red/15 border border-error-red/30 text-error-red px-3 py-2 rounded-xl text-[11px] z-50 backdrop-blur-sm">
          {error}
        </div>
      )}
      {saved && !capturedImage && (
        <div className="absolute top-3 left-3 right-3 bg-neon-green/10 border border-neon-green/20 text-neon-green px-3 py-2 rounded-xl text-[11px] z-50 backdrop-blur-sm font-medium">
          ✅ Selfie saved to your gallery!
        </div>
      )}

      {/* ─── Captured Image Review ─── */}
      {capturedImage ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <img src={capturedImage} alt="Captured Selfie" className="w-full h-full object-cover" />
          
          {/* Frosted bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 glass-strong py-5 flex justify-center gap-8">
             <button onClick={retakePhoto} disabled={isUploading}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50">
                <RefreshCw className="w-5 h-5 text-white" />
             </button>
             <button onClick={uploadPhoto} disabled={isUploading}
                className="w-14 h-14 rounded-2xl bg-neon-green flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 shadow-lg shadow-neon-green/25">
                {isUploading ? (
                   <Loader2 className="w-6 h-6 text-black animate-spin" />
                ) : (
                   <Check className="w-7 h-7 text-black" />
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
                className="absolute inset-0 w-full h-full object-cover" />
              
              {/* Shutter Button */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
                <button onClick={capturePhoto}
                  className="w-[72px] h-[72px] rounded-full border-[3px] border-white/80 flex items-center justify-center active:scale-90 transition-transform">
                   <div className="w-[60px] h-[60px] rounded-full bg-white active:bg-white/80 transition-colors" />
                </button>
              </div>
            </>
          ) : (
             <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
               {/* Subtle gradient background */}
               <div className="absolute inset-0 bg-gradient-to-b from-neon-purple-start/5 via-transparent to-neon-purple-start/10" />
               
              <div className="z-10 text-center flex flex-col items-center gap-3">
                 {alreadyPostedToday ? (
                   <>
                     <div className="w-16 h-16 rounded-2xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center neon-glow-green">
                        <Check className="w-7 h-7 text-neon-green" />
                     </div>
                     <div>
                        <h3 className="text-lg font-bold text-neon-green">Done for Today!</h3>
                        <p className="text-xs text-text-muted mt-1">Come back tomorrow 💪</p>
                     </div>
                   </>
                 ) : (
                   <>
                     <button onClick={startCamera} 
                       className="w-16 h-16 rounded-2xl bg-card-elevated border border-neon-purple-start/30 flex items-center justify-center active:scale-95 transition-transform neon-glow-purple">
                        <Camera className="w-7 h-7 text-neon-purple-start" />
                     </button>
                     <div>
                        <h3 className="text-lg font-bold">Take Today&apos;s Selfie</h3>
                        <p className="text-xs text-text-muted mt-1">Tap to open camera</p>
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
