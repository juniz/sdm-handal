const LoadingSkeleton = () => (
	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{[1, 2, 3, 4, 5, 6].map((i) => (
			<div
				key={i}
				className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm animate-pulse space-y-4"
			>
				<div className="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
				<div className="space-y-2.5">
					<div className="flex items-center space-x-2">
						<div className="w-4 h-4 bg-slate-200 rounded shrink-0"></div>
						<div className="h-4 bg-slate-200 rounded w-1/2"></div>
					</div>
					<div className="flex items-center space-x-2">
						<div className="w-4 h-4 bg-slate-200 rounded shrink-0"></div>
						<div className="h-4 bg-slate-200 rounded w-2/3"></div>
					</div>
					<div className="flex items-center space-x-2">
						<div className="w-4 h-4 bg-slate-200 rounded shrink-0"></div>
						<div className="h-4 bg-slate-200 rounded w-1/3"></div>
					</div>
				</div>
				<div className="pt-3 border-t border-slate-100 flex justify-between items-center">
					<div className="w-16 h-5 bg-slate-200 rounded"></div>
					<div className="w-16 h-5 bg-slate-200 rounded"></div>
				</div>
			</div>
		))}
	</div>
);

export default LoadingSkeleton;
