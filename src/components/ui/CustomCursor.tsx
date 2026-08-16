import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if device supports fine hover pointer
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let targetScale = 1;
    let currentScale = 1;
    let isVisible = false;
    let isHovering = false;
    let isMouseDown = false;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        ringX = mouseX;
        ringY = mouseY;
      }

      const target = e.target as HTMLElement | null;
      if (target) {
        isHovering = !!target.closest('button, a, input, textarea, select, [role="button"], .cursor-pointer, [data-cursor="pointer"]');
      }
    };

    const onMouseDown = () => {
      isMouseDown = true;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onMouseLeave = () => {
      isVisible = false;
    };

    const onMouseEnter = () => {
      isVisible = true;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    const render = () => {
      // Faster, responsive follow so the dot and ring never drift apart
      const ease = isMouseDown ? 0.5 : isHovering ? 0.35 : 0.25;
      ringX += (mouseX - ringX) * ease;
      ringY += (mouseY - ringY) * ease;

      // Target scale calculation for smooth morphing
      if (isMouseDown) {
        targetScale = 0.75;
      } else if (isHovering) {
        targetScale = 1.45;
      } else {
        targetScale = 1.0;
      }

      currentScale += (targetScale - currentScale) * 0.25;

      // Update inner dot (exact coordinates)
      if (dotRef.current) {
        dotRef.current.style.opacity = isVisible ? '1' : '0';
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(${isMouseDown ? 0.6 : isHovering ? 0.75 : 1})`;
      }

      // Update outer ring (interpolated position and scale)
      if (ringRef.current) {
        ringRef.current.style.opacity = isVisible ? '1' : '0';
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${currentScale})`;
        
        if (isHovering) {
          ringRef.current.style.backgroundColor = 'rgba(147, 51, 234, 0.15)';
          ringRef.current.style.borderColor = 'rgba(147, 51, 234, 0.9)';
        } else {
          ringRef.current.style.backgroundColor = 'transparent';
          ringRef.current.style.borderColor = 'rgba(147, 51, 234, 0.5)';
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Precision Center Dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#9333ea',
          pointerEvents: 'none',
          zIndex: 99999,
          willChange: 'transform, opacity',
          opacity: 0,
        }}
      />

      {/* Synchronized Outer Ring */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '1.5px solid rgba(147, 51, 234, 0.5)',
          backgroundColor: 'transparent',
          pointerEvents: 'none',
          zIndex: 99998,
          willChange: 'transform, opacity, background-color, border-color',
          opacity: 0,
        }}
      />
    </>
  );
}
