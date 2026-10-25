'use client';

import React from 'react';

/**
 * Button
 * Editorial pill controls:
 * - primary: ink-filled pill with paper text
 * - secondary: 1px hairline pill with ink text
 * - ghost: minimal quiet button
 * - icon: 44px touch target icon button
 * Max weight 500 (font-medium), 160-220ms ease-out motion.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled = false,
  className = '',
  children,
  type = 'button',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-sans font-medium whitespace-nowrap transition-all duration-200 ease-out select-none focus:outline-none disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]';

  // Size styling (ensures mobile touch target >= 44px)
  const sizeClasses = {
    sm: 'text-[13px] px-3.5 py-1.5 min-h-[44px] sm:min-h-[34px] min-w-[44px] rounded-full gap-1.5',
    md: 'text-[14px] px-5 py-2.5 min-h-[44px] min-w-[44px] rounded-full gap-2',
    lg: 'text-[15px] px-6 py-3 min-h-[48px] min-w-[48px] rounded-full gap-2.5',
  }[size] || 'text-[14px] px-5 py-2.5 min-h-[44px] min-w-[44px] rounded-full gap-2';

  // Variant styling
  const variantClasses = {
    primary:
      'bg-ink text-background hover:opacity-90 shadow-none border border-transparent',
    secondary:
      'bg-transparent text-ink border border-hairline hover:bg-hairline/20',
    ghost:
      'bg-transparent text-muted hover:text-ink hover:bg-hairline/15 border border-transparent',
    icon:
      'min-w-[44px] min-h-[44px] p-2.5 rounded-full bg-transparent text-muted hover:text-ink hover:bg-hairline/20 border border-transparent',
  }[variant] || 'bg-ink text-background hover:opacity-90';

  const renderIcon = (ic) => {
    if (!ic) return null;
    if (typeof ic === 'string') {
      return (
        <span
          className="material-symbols-outlined text-[19px] shrink-0 text-inherit"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
          aria-hidden="true"
        >
          {ic}
        </span>
      );
    }
    return ic;
  };

  if (variant === 'icon') {
    return (
      <button
        type={type}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {renderIcon(icon || children)}
      </button>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {renderIcon(icon)}
      {children}
      {renderIcon(iconRight)}
    </button>
  );
}

export default Button;
