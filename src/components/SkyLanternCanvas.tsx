import React, { useCallback, useRef, useEffect, useState } from 'react';

const getWidth = () => window.innerWidth 
  || document.documentElement.clientWidth 
  || document.body.clientWidth;

const getHeight = () => window.innerHeight 
  || document.documentElement.clientHeight 
  || document.body.clientHeight;

const SkyLanternCanvas = () => {
  const resizedEventAdded = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D | null>(null);

  const canvasEl = canvasRef.current;
  const resizeCanvas = useCallback(() => {
    if (!canvasEl) return;
    canvasEl.width = getWidth();
    canvasEl.height = getHeight();
    /* maybe redraw here */
  }, [canvasEl]);

  useEffect(() => {
    const context2d = canvasEl?.getContext('2d');
    if (context2d && !canvasContext) setCanvasContext(context2d);
  }, [canvasEl, canvasContext])

  useEffect(() => {
    if (!resizedEventAdded.current) {
      // Set resize listener.
      window.addEventListener('resize', resizeCanvas);
      resizedEventAdded.current = true;
    }
    // Clean up function.
    return () => {
      // Remove resize listener.
      window.removeEventListener('resize', resizeCanvas);
    }
  }, [resizeCanvas]);

  const handleOnClick: React.MouseEventHandler<HTMLCanvasElement> = useCallback((evt) => {
    console.log(evt.clientX, evt.clientY);
  }, []);

  return (
    <canvas ref={canvasRef} width={getWidth()} height={getWidth()} onClick={handleOnClick}/>
  );
};

export default SkyLanternCanvas;