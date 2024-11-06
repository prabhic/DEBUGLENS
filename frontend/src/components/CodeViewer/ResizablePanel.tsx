import React, { useState, useCallback, FC } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  className?: string;
}

export const ResizablePanel: FC<ResizablePanelProps> = ({
  children,
  direction,
  onResize,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - startX;
    setStartX(e.clientX);
    onResize(delta);
  }, [isDragging, startX, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className={`relative flex ${className}`}>
      <div
        className={`absolute ${
          direction === 'horizontal'
            ? 'left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500/30 group'
            : 'top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500/30 group'
        } ${isDragging ? 'bg-blue-500/50' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className={`absolute ${
          direction === 'horizontal'
            ? 'w-1 h-8 top-1/2 -translate-y-1/2 bg-gray-500 group-hover:bg-blue-400'
            : 'h-1 w-8 left-1/2 -translate-x-1/2 bg-gray-500 group-hover:bg-blue-400'
        } ${isDragging ? '!bg-blue-400' : ''}`} />
      </div>
      {children}
    </div>
  );
}; 