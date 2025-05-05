import * as React from "react";

const Badge = React.forwardRef(
	({ variant = "default", className, ...props }, ref) => {
		const variants = {
			default: "bg-primary text-primary-foreground",
			secondary: "bg-secondary text-secondary-foreground",
			success: "bg-green-100 text-green-800",
			warning: "bg-yellow-100 text-yellow-800",
			info: "bg-blue-100 text-blue-800",
			pending: "bg-yellow-100 text-yellow-800",
			inProgress: "bg-blue-100 text-blue-800",
			completed: "bg-green-100 text-green-800",
		};

		return (
			<span
				ref={ref}
				className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}
				{...props}
			/>
		);
	}
);
Badge.displayName = "Badge";

export { Badge };
