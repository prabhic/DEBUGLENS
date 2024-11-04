import React, { useState, useCallback } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  direction?: 'vertical' | 'horizontal';
  onResize: (delta: number) => void;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  direction = 'vertical',
  onResize,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPosition(direction === 'vertical' ? e.clientX : e.clientY);
    document.body.classList.add('select-none');
  }, [direction]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const currentPosition = direction === 'vertical' ? e.clientX : e.clientY;
    const delta = currentPosition - startPosition;
    onResize(delta);
    setStartPosition(currentPosition);
  }, [isDragging, startPosition, direction, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.classList.remove('select-none');
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('select-none');
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const resizeHandleClasses = direction === 'vertical'
    ? 'absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500/50'
    : 'absolute top-0 left-0 h-2 w-full cursor-row-resize hover:bg-blue-500/50';

  return (
    <div className={`relative ${direction === 'horizontal' ? 'w-full' : 'h-full'} flex-shrink-0`}>
      {direction === 'horizontal' && (
        <div
          className={`${resizeHandleClasses} z-10`}
          onMouseDown={handleMouseDown}
          style={{ touchAction: 'none' }}
        />
      )}
      {children}
      {direction === 'vertical' && (
        <div
          className={`${resizeHandleClasses} z-10`}
          onMouseDown={handleMouseDown}
          style={{ 
            touchAction: 'none',
            transform: 'translateX(50%)'
          }}
        />
      )}
    </div>
  );
}; 