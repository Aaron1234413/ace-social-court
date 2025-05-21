
import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const InteractiveCard = ({ children, className, ...props }: InteractiveCardProps) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation based on mouse position
    // Limit the rotation to a small angle for subtlety
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    
    setRotation({ x: rotateX, y: rotateY });
  };
  
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  // For touch devices, add a simple animation on tap
  const handleTouchStart = () => {
    setIsHovered(true);
    
    // Reset the hover state after animation completes
    setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  return (
    <div 
      className={cn(
        "perspective-1000 transition-transform duration-300 w-full", 
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      ref={cardRef}
      {...props}
    >
      <Card
        className={cn(
          "transition-all duration-200 ease-out backface-hidden w-full",
          isHovered ? "shadow-lg" : "shadow-sm",
          className
        )}
        style={{
          transform: isHovered 
            ? `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(1.02)` 
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
        }}
      >
        {children}
      </Card>
    </div>
  );
};

export default InteractiveCard;
