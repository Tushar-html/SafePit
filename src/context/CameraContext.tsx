import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

interface CameraContextType {
  stream: MediaStream | null;
  cameraActive: boolean;
  hasPermission: boolean | null; // null = unprompted, true = granted, false = denied/error
  gyroPermission: boolean;
  requestCamera: () => Promise<MediaStream | null>;
  requestGyro: () => Promise<boolean>;
  stopCamera: () => void;
}

const CameraContext = createContext<CameraContextType>({
  stream: null,
  cameraActive: false,
  hasPermission: null,
  gyroPermission: false,
  requestCamera: async () => null,
  requestGyro: async () => false,
  stopCamera: () => {},
});

export const CameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [gyroPermission, setGyroPermission] = useState<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);

  const requestCamera = useCallback(async (): Promise<MediaStream | null> => {
    if (streamRef.current && streamRef.current.active) {
      setCameraActive(true);
      setHasPermission(true);
      return streamRef.current;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("Camera API not supported in this browser.");
        setHasPermission(false);
        return null;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraActive(true);
      setHasPermission(true);
      return mediaStream;
    } catch (err) {
      console.warn("Camera access denied or unavailable; falling back to simulated AR background.", err);
      setHasPermission(false);
      setCameraActive(false);
      return null;
    }
  }, []);

  /** Motion/orientation sensors (needed to keep models glued to the floor). */
  const requestGyro = useCallback(async (): Promise<boolean> => {
    try {
      let granted = true;
      const w = window as unknown as {
        DeviceMotionEvent?: { requestPermission?: () => Promise<"granted" | "denied"> };
        DeviceOrientationEvent?: { requestPermission?: () => Promise<"granted" | "denied"> };
      };

      // iOS 13+ style explicit permission gates
      if (w.DeviceMotionEvent?.requestPermission) {
        granted = (await w.DeviceMotionEvent.requestPermission()) === "granted";
      }
      if (granted && w.DeviceOrientationEvent?.requestPermission) {
        granted = (await w.DeviceOrientationEvent.requestPermission()) === "granted";
      }

      if (granted) {
        setGyroPermission(true);
        // Probe: on Android the WebView only powers the sensors up once a
        // listener exists; on desktop no events ever arrive. Wait briefly
        // and mark liveness so the UI can fall back to simulated AR.
        let live = false;
        const probe = () => { live = true; };
        window.addEventListener("deviceorientation", probe, { once: true });
        window.addEventListener("devicemotion", probe, { once: true });
        window.setTimeout(() => {
          window.removeEventListener("deviceorientation", probe);
          window.removeEventListener("devicemotion", probe);
          setGyroPermission(live);
        }, 1200);
      }
      return granted;
    } catch {
      setGyroPermission(false);
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <CameraContext.Provider
      value={{
        stream,
        cameraActive,
        hasPermission,
        gyroPermission,
        requestCamera,
        requestGyro,
        stopCamera,
      }}
    >
      {children}
    </CameraContext.Provider>
  );
};

export const useCamera = () => useContext(CameraContext);
