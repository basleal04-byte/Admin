import * as React from "react";
import { Separator as SeparatorPrimitive } from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentPropsWithoutRef<typeof SeparatorPrimitive>) {
  return (
    <SeparatorPrimitive
      orientation={orientation}
      className={cn(
        "shrink-0 bg-stone-200",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  );
}
