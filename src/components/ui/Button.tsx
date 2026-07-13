import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'lg';
}

const base = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-100 select-none';
const variants: Record<Variant, string> = {
  primary: 'btn-duolingo-primary text-white',
  secondary: 'btn-duolingo-secondary',
  ghost: 'bg-transparent text-gray-700',
};
const sizes = {
  md: 'px-4 py-3 text-sm min-h-[48px]',
  lg: 'px-4 py-3.5 text-base min-h-[56px]',
};

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: Props) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
