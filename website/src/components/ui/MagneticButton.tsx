import React, { useRef } from 'react';
import { sound } from '../../services/sound';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  cursorTag?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  variant = 'primary',
  cursorTag,
  onClick,
  className = '',
  ...props
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate3d(${x * 0.2}px, ${y * 0.25}px, 0)`;
  };

  const handleMouseLeave = () => {
    const btn = btnRef.current;
    if (!btn) return;
    btn.style.transform = `translate3d(0, 0, 0)`;
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    sound.playClick();
    if (onClick) onClick(e);
  };

  const variantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'secondary'
      ? 'btn-secondary'
      : 'btn-ghost';

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      data-cursor={cursorTag}
      className={`${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
