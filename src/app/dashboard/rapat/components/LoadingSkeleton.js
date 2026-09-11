"use client";

const LoadingSkeleton = () => (
	<div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs animate-pulse">
		{/* Header skeleton */}
		<div className="bg-slate-50 px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between">
			<div className="flex items-center gap-2">
				<div className="h-4 bg-slate-200 rounded w-36" />
				<div className="h-4 bg-slate-200 rounded-full w-16" />
			</div>
			<div className="h-7 w-24 bg-slate-200 rounded-lg" />
		</div>

		{/* Desktop Table skeleton */}
		<div className="hidden md:block p-4 space-y-3">
			<div className="h-8 bg-slate-100 rounded-md w-full" />
			{[1, 2, 3, 4].map((rowIdx) => (
				<div
					key={rowIdx}
					className="flex items-center justify-between py-2.5 border-b border-slate-100 gap-4"
				>
					<div className="h-4 bg-slate-200 rounded w-8" />
					<div className="h-4 bg-slate-200 rounded w-1/4" />
					<div className="h-4 bg-slate-200 rounded w-1/4" />
					<div className="h-4 bg-slate-200 rounded w-1/5" />
					<div className="h-6 bg-slate-200 rounded w-20" />
					<div className="h-6 bg-slate-200 rounded w-16" />
				</div>
			))}
		</div>

		{/* Mobile Card skeleton */}
		<div className="block md:hidden divide-y divide-slate-100 p-2">
			{[1, 2, 3].map((cardIdx) => (
				<div key={cardIdx} className="p-3 space-y-2.5">
					<div className="flex items-center justify-between">
						<div className="h-4 bg-slate-200 rounded w-10" />
						<div className="h-7 bg-slate-200 rounded w-16" />
					</div>
					<div className="h-4 bg-slate-200 rounded w-1/2" />
					<div className="h-3 bg-slate-200 rounded w-1/3" />
					<div className="flex items-center justify-between pt-1">
						<div className="h-3 bg-slate-200 rounded w-1/3" />
						<div className="h-6 bg-slate-200 rounded w-20" />
					</div>
				</div>
			))}
		</div>
	</div>
);

export default LoadingSkeleton;
