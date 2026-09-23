import { useRef, useState, useCallback } from "react";

/* ============================================================
   Shared AR interaction hook.
   - Drag horizontally to rotate the placed model.
   - Pinch (touch) or wheel to zoom, clamped.
   - Two-finger vertical drag to raise/lower placement height.
   - Recenter resets rotation/zoom/height to defaults.
   Returns handlers to spread onto the AR box div + refs the
   Three.js render loop reads each frame.
   ============================================================ */

export interface ARGestureState {
  targetRotation: number;
  zoomScale: number;
  heightOffset: number;
}

export function useARGestures(opts?: { minZoom?: number; maxZoom?: number }) {
  const minZoom = opts?.minZoom ?? 0.6;
  const maxZoom = opts?.maxZoom ?? 2.2;

  const isDraggingRef = useRef(false);
  const prevXRef = useRef(0);
  const rotationVelocityRef = useRef(0);
  const targetRotationRef = useRef(0);

  const pinchStartDistRef = useRef(0);
  const pinchStartZoomRef = useRef(1);
  const twoFingerStartYRef = useRef(0);
  const heightStartRef = useRef(0);
  const twoFingerActiveRef = useRef(false);

  const [zoomScale, setZoomScaleState] = useState(1.0);
  const [heightOffset, setHeightOffsetState] = useState(0.0);
  const heightOffsetRef = useRef(0.0);

  const setZoomClamped = useCallback((v: number) => {
    const clamped = Math.min(maxZoom, Math.max(minZoom, v));
    setZoomScaleState(clamped);
    return clamped;
  }, [minZoom, maxZoom]);

  const setHeightClamped = useCallback((v: number) => {
    const clamped = Math.min(0.6, Math.max(-0.2, v));
    heightOffsetRef.current = clamped;
    setHeightOffsetState(clamped);
    return clamped;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (twoFingerActiveRef.current) return;
    isDraggingRef.current = true;
    prevXRef.current = e.clientX;
    rotationVelocityRef.current = 0;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || twoFingerActiveRef.current) return;
    const deltaX = e.clientX - prevXRef.current;
    prevXRef.current = e.clientX;
    targetRotationRef.current += deltaX * 0.01;
    rotationVelocityRef.current = deltaX * 0.005;
  }, []);

  const onPointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const zoomRef = useRef(1.0);
  zoomRef.current = zoomScale;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      twoFingerActiveRef.current = true;
      isDraggingRef.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistRef.current = Math.hypot(dx, dy);
      pinchStartZoomRef.current = zoomRef.current;
      twoFingerStartYRef.current = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      heightStartRef.current = heightOffsetRef.current;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && twoFingerActiveRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (pinchStartDistRef.current > 0) {
        const factor = dist / pinchStartDistRef.current;
        zoomRef.current = setZoomClamped(pinchStartZoomRef.current * factor);
      }
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      setHeightClamped(heightStartRef.current - (midY - twoFingerStartYRef.current) * 0.0016);
    }
  }, [setZoomClamped, setHeightClamped]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      twoFingerActiveRef.current = false;
      pinchStartDistRef.current = 0;
    }
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    zoomRef.current = setZoomClamped(zoomRef.current - e.deltaY * 0.0012);
  }, [setZoomClamped]);

  const zoomBy = useCallback((amount: number) => {
    zoomRef.current = setZoomClamped(zoomRef.current + amount);
  }, [setZoomClamped]);

  const recenter = useCallback(() => {
    targetRotationRef.current = 0;
    rotationVelocityRef.current = 0;
    zoomRef.current = setZoomClamped(1.0);
    setHeightClamped(0);
  }, [setZoomClamped, setHeightClamped]);

  return {
    // spread onto AR box div
    handlers: {
      onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp,
      onTouchStart, onTouchMove, onTouchEnd, onWheel
    },
    // read by render loop
    refs: {
      isDraggingRef, rotationVelocityRef, targetRotationRef, zoomRef,
      heightOffsetRef
    },
    // react state for UI display / model scale effect
    zoomScale,
    heightOffset,
    zoomBy,
    recenter
  };
}
