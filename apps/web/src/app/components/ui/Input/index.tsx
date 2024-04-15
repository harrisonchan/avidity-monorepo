import * as React from 'react';
import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '@shared/utils';

const inputVariants = cva(
  'flex h-9 w-full rounded-md bg-transparent px-3 py-1 transition-colors file:bg-transparent file:body placeholder:text-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        outline: 'border border-input shadow-sm file:border-0 focus-visible:ring-1 focus-visible:ring-ring ',
      },
      size: {
        default: 'body',
        lg: 'h4',
        sm: 'tertiary',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & VariantProps<typeof inputVariants>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, variant, size, type, ...props }, ref) => {
  return <input type={type} className={cn(inputVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Input.displayName = 'Input';

export { Input };
