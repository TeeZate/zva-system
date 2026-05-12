"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-zva-green text-white hover:bg-zva-green-dark shadow-sm hover:shadow-md focus-visible:ring-zva-green",
        gold: "bg-zva-gold text-black hover:bg-zva-gold-dark shadow-sm hover:shadow-md focus-visible:ring-zva-gold",
        destructive: "bg-zva-red text-white hover:bg-zva-red-dark shadow-sm focus-visible:ring-zva-red",
        outline: "border-2 border-zva-green text-zva-green hover:bg-zva-green hover:text-white focus-visible:ring-zva-green",
        ghost: "text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-zinc-400",
        link: "text-zva-green underline-offset-4 hover:underline p-0 h-auto",
        secondary: "bg-zinc-100 dark:bg-zinc-800 text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-5 py-2.5",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
