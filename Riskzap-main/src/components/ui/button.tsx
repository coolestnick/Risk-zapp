import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
  // Riskzap specific variants (variant key 'payfi' retained for compatibility)
  // toned-down active variant: single primary color + subtle shadow
  payfi: "bg-primary text-primary-foreground font-bold hover:scale-105 hover:shadow-button-hover",
        hero: "bg-gradient-to-r from-primary via-warning to-success text-background font-bold hover:scale-110 hover:shadow-elevated",
        success: "bg-success text-success-foreground hover:bg-success/90 hover:scale-105",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 hover:scale-105",
        floating: "bg-card/80 backdrop-blur-sm border border-primary/30 text-foreground hover:bg-card hover:border-primary/60",
        vine: "vine-progress text-foreground hover:scale-105 border border-success/50",
        
        // New category-specific button variants
        device: "bg-accent-device text-accent-device-foreground font-semibold hover:scale-105 hover:shadow-device-glow transition-all duration-300",
        event: "bg-accent-event text-accent-event-foreground font-semibold hover:scale-105 hover:shadow-event-glow transition-all duration-300", 
        travel: "bg-accent-travel text-accent-travel-foreground font-semibold hover:scale-105 hover:shadow-travel-glow transition-all duration-300",
        equipment: "bg-accent-equipment text-accent-equipment-foreground font-semibold hover:scale-105 hover:shadow-equipment-glow transition-all duration-300",
        
        // Secondary action buttons
        claim: "bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 hover:border-accent/50 transition-all duration-300",
        details: "bg-muted/10 text-muted-foreground border border-muted/20 hover:bg-muted/20 hover:text-foreground transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
