import React, { useState, useCallback } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
}

export function ResizablePanel({ children, direction = 'horizontal', onResize }: ResizablePanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPosition({ x: e.clientX, y: e.clientY });

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const delta = direction === 'horizontal' 
        ? e.clientX - startPosition.x 
        : e.clientY - startPosition.y;

      onResize(delta);
      setStartPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [direction, isDragging, onResize, startPosition]);

  return (
    <div className="relative flex flex-col h-full">
      {direction === 'vertical' && (
        <div
          className="absolute top-0 left-0 right-0 h-2 cursor-row-resize z-50 -translate-y-1/2"
          onMouseDown={handleMouseDown}
          style={{
            backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.5)' : 'rgba(75, 85, 99, 0.3)',
            transition: 'background-color 150ms ease',
          }}
        >
          <div 
            className="h-[2px] w-full my-auto bg-gray-600 hover:bg-blue-400"
            style={{
              backgroundColor: isDragging ? 'rgb(96, 165, 250)' : undefined
            }}
          />
        </div>
      )}
      
      {direction === 'horizontal' && (
        <div
          className="absolute right-0 top-0 w-2 h-full cursor-col-resize z-50 -mr-1 hover:mr-0"
          onMouseDown={handleMouseDown}
          style={{
            backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.5)' : 'rgba(75, 85, 99, 0.3)',
            transition: 'background-color 150ms ease',
          }}
        >
          <div 
            className="w-[2px] h-full mx-auto bg-gray-600 hover:bg-blue-400"
            style={{
              backgroundColor: isDragging ? 'rgb(96, 165, 250)' : undefined
            }}
          />
        </div>
      )}
      
      {children}
    </div>
  );
} 