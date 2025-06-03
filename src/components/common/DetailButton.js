import { Eye } from "lucide-react";

const DetailButton = ({
	onClick,
	variant = "icon",
	size = "sm",
	className = "",
}) => {
	const baseClasses = "flex items-center gap-1 transition-colors";

	const variants = {
		icon: "p-1 text-gray-500 hover:text-blue-500",
		button:
			"px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-sm font-medium",
		outline:
			"px-3 py-1.5 border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium",
	};

	const sizes = {
		xs: "text-xs",
		sm: "",
		md: "text-base",
		lg: "text-lg",
	};

	const iconSizes = {
		xs: "w-3 h-3",
		sm: "w-4 h-4",
		md: "w-5 h-5",
		lg: "w-6 h-6",
	};

	return (
		<button
			onClick={onClick}
			className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
			title="Lihat Detail"
		>
			<Eye className={iconSizes[size]} />
			{variant !== "icon" && <span>Detail</span>}
		</button>
	);
};

export default DetailButton;
