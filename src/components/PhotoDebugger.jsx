"use client";

import { useState, useEffect } from "react";

const PhotoDebugger = ({ photoUrl, visible = false }) => {
	const [debugInfo, setDebugInfo] = useState({});
	const [isChecking, setIsChecking] = useState(false);

	const checkPhotoUrl = async (url) => {
		setIsChecking(true);
		const info = {
			originalUrl: url,
			timestamp: new Date().toISOString(),
			checks: [],
		};

		try {
			// Test 1: Basic URL format
			info.checks.push({
				name: "URL Format",
				status: url ? "PASS" : "FAIL",
				details: url || "No URL provided",
			});

			if (!url) {
				setDebugInfo(info);
				setIsChecking(false);
				return;
			}

			// Test 2: URL accessibility
			try {
				const response = await fetch(url, {
					method: "HEAD",
					cache: "no-store",
				});

				info.checks.push({
					name: "URL Accessibility",
					status: response.ok ? "PASS" : "FAIL",
					details: `Status: ${response.status} ${response.statusText}`,
				});

				// Test 3: Response headers
				const headers = {};
				response.headers.forEach((value, key) => {
					headers[key] = value;
				});

				info.checks.push({
					name: "Response Headers",
					status: "INFO",
					details: JSON.stringify(headers, null, 2),
				});
			} catch (fetchError) {
				info.checks.push({
					name: "URL Accessibility",
					status: "FAIL",
					details: fetchError.message,
				});
			}

			// Test 4: Cache busting
			const hasCacheBusting = url.includes("t=") || url.includes("timestamp=");
			info.checks.push({
				name: "Cache Busting",
				status: hasCacheBusting ? "PASS" : "WARN",
				details: hasCacheBusting
					? "Cache busting parameter found"
					: "No cache busting parameter",
			});

			// Test 5: Image load test
			try {
				await new Promise((resolve, reject) => {
					const img = new Image();
					img.onload = resolve;
					img.onerror = reject;
					img.src = url;

					// Timeout after 10 seconds
					setTimeout(() => reject(new Error("Timeout")), 10000);
				});

				info.checks.push({
					name: "Image Load Test",
					status: "PASS",
					details: "Image loaded successfully",
				});
			} catch (loadError) {
				info.checks.push({
					name: "Image Load Test",
					status: "FAIL",
					details: loadError.message,
				});
			}
		} catch (error) {
			info.checks.push({
				name: "General Error",
				status: "FAIL",
				details: error.message,
			});
		}

		setDebugInfo(info);
		setIsChecking(false);
	};

	useEffect(() => {
		if (visible && photoUrl) {
			checkPhotoUrl(photoUrl);
		}
	}, [photoUrl, visible]);

	if (!visible) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
				<div className="p-6">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold">Photo Debug Info</h3>
						<button
							onClick={() => checkPhotoUrl(photoUrl)}
							disabled={isChecking}
							className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
						>
							{isChecking ? "Checking..." : "Recheck"}
						</button>
					</div>

					{debugInfo.originalUrl && (
						<div className="mb-4">
							<h4 className="font-medium mb-2">URL:</h4>
							<div className="bg-gray-100 p-2 rounded text-sm break-all">
								{debugInfo.originalUrl}
							</div>
						</div>
					)}

					{debugInfo.checks && debugInfo.checks.length > 0 && (
						<div>
							<h4 className="font-medium mb-2">Diagnostic Results:</h4>
							<div className="space-y-2">
								{debugInfo.checks.map((check, index) => (
									<div key={index} className="border rounded p-3">
										<div className="flex items-center gap-2 mb-1">
											<span className="font-medium">{check.name}</span>
											<span
												className={`px-2 py-1 rounded text-xs ${
													check.status === "PASS"
														? "bg-green-100 text-green-800"
														: check.status === "FAIL"
														? "bg-red-100 text-red-800"
														: check.status === "WARN"
														? "bg-yellow-100 text-yellow-800"
														: "bg-blue-100 text-blue-800"
												}`}
											>
												{check.status}
											</span>
										</div>
										<div className="text-sm text-gray-600">
											<pre className="whitespace-pre-wrap">{check.details}</pre>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{debugInfo.timestamp && (
						<div className="mt-4 text-xs text-gray-500">
							Last checked: {new Date(debugInfo.timestamp).toLocaleString()}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default PhotoDebugger;
