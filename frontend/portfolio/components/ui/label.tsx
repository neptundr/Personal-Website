import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root> & {
  className?: string;
} & VariantProps<typeof labelVariants>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)} // combine CVA styles with optional className
      {...props} // spread all other props like htmlFor, children, etc.
    />
  )
);

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };