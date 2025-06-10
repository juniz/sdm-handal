"use client";

import { Users, UserCheck, UserPlus, Shield } from "lucide-react";

export default function UserManagementPage() {
	return (
		<div className="max-w-6xl mx-auto p-6">
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-gray-900 mb-2">
					User Management
				</h1>
				<p className="text-gray-600">
					Kelola pengguna dan akses kontrol sistem
				</p>
			</div>

			<div className="bg-white rounded-lg shadow-sm border">
				<div className="p-6">
					<div className="text-center py-12">
						<Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
						<h4 className="text-lg font-medium text-gray-500 mb-2">
							Coming Soon
						</h4>
						<p className="text-gray-400">
							Fitur user management sedang dalam pengembangan.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
