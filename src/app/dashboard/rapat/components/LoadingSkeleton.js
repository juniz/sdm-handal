"use client";

const LoadingSkeleton = () => (
	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{[1, 2, 3, 4, 5, 6].map((i) => (
			<div key={i} className="bg-white rounded-lg p-6 shadow-md animate-pulse">
				<div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
				<div className="space-y-3">
					<div className="flex items-center space-x-2">
						<div className="w-8 h-8 bg-gray-200 rounded"></div>
						<div className="h-4 bg-gray-200 rounded w-1/2"></div>
					</div>
					<div className="flex items-center space-x-2">
						<div className="w-8 h-8 bg-gray-200 rounded"></div>
						<div className="h-4 bg-gray-200 rounded w-2/3"></div>
					</div>
					<div className="flex items-center space-x-2">
						<div className="w-8 h-8 bg-gray-200 rounded"></div>
						<div className="h-4 bg-gray-200 rounded w-1/3"></div>
					</div>
				</div>
				<div className="mt-4 flex justify-end space-x-2">
					<div className="w-8 h-8 bg-gray-200 rounded"></div>
					<div className="w-8 h-8 bg-gray-200 rounded"></div>
				</div>
			</div>
		))}
	</div>
);

export default LoadingSkeleton;
