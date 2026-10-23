import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export { default as Button } from "./Button.vue";

// Buttons follow the in-game AEUI style: outlined text that lights up on hover
export const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border font-hud text-sm transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-hl focus-visible:text-hl aria-invalid:border-destructive",
	{
		variants: {
			variant: {
				default:
					"border-primary bg-primary text-primary-foreground hover:border-hl hover:bg-hl hover:text-hl-foreground",
				destructive: "border-destructive text-destructive-foreground hover:bg-destructive hover:text-white",
				outline: "border-foreground/30 bg-transparent text-foreground hover:border-hl hover:text-hl",
				secondary: "border-transparent bg-secondary text-secondary-foreground hover:text-hl",
				ghost: "border-transparent text-foreground hover:text-hl",
				link: "border-transparent text-hl underline-offset-4 hover:underline",
			},
			size: {
				default: "h-9 px-4 py-2 has-[>svg]:px-3",
				xs: "h-6 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
				lg: "h-11 px-6 text-base has-[>svg]:px-4",
				icon: "size-9",
				"icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
				"icon-sm": "size-8",
				"icon-lg": "size-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);
export type ButtonVariants = VariantProps<typeof buttonVariants>;
