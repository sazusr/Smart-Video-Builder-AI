import React, { useState, useEffect, useCallback } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export const RippleContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const addRipple = useCallback((e: MouseEvent | TouchEvent) => {
    let x, y;
    if (e instanceof MouseEvent) {
      x = e.clientX;
      y = e.clientY;
    } else {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }

    const id = Date.now();
    const size = 100;

    setRipples((prev) => [...prev, { id, x, y, size }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 850);
  }, []);

  useEffect(() => {
    window.addEventListener('mousedown', addRipple);
    window.addEventListener('touchstart', addRipple);
    return () => {
      window.removeEventListener('mousedown', addRipple);
      window.removeEventListener('touchstart', addRipple);
    };
  }, [addRipple]);

  return (
    <>
      {children}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </>
  );
};
