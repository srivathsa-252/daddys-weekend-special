import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-blue-50 text-blue-600 border border-blue-100",
        secondary: "bg-gray-100 text-gray-500 border border-gray-200",
        destructive: "bg-red-50 text-red-600 border border-red-100",
        success: "bg-emerald-50 text-emerald-600 border border-emerald-100",
        warning: "bg-amber-50 text-amber-600 border border-amber-100",
        outline: "border border-gray-200 text-gray-600",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
