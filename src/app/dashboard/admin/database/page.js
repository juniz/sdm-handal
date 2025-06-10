"use client";

import { Database, Server, HardDrive, Activity } from "lucide-react";

export default function DatabasePage() {
	return (
		<div className="max-w-6xl mx-auto p-6">
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-gray-900 mb-2">
					Database Management
				</h1>
				<p className="text-gray-600">Monitor dan kelola database sistem</p>
			</div>

			<div className="bg-white rounded-lg shadow-sm border">
				<div className="p-6">
					<div className="text-center py-12">
						<Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
						<h4 className="text-lg font-medium text-gray-500 mb-2">
							Coming Soon
						</h4>
						<p className="text-gray-400">
							Fitur database management sedang dalam pengembangan.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
