"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

class ErrorBoundaryClass extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error) {
		// Update state so the next render will show the fallback UI
		return { hasError: true };
	}

	componentDidCatch(error, errorInfo) {
		// Log error to console in development
		if (process.env.NODE_ENV === "development") {
			console.error("ErrorBoundary caught an error:", error, errorInfo);
		}

		// Log error to server
		this.logErrorToServer(error, errorInfo);

		// Update state with error details
		this.setState({
			error: error,
			errorInfo: errorInfo,
		});
	}

	logErrorToServer = async (error, errorInfo) => {
		try {
			const errorData = {
				error_type: error.name || "ReactErrorBoundary",
				error_message: error.message || String(error),
				error_stack: error.stack,
				page_url:
					typeof window !== "undefined" ? window.location.pathname : null,
				severity: "HIGH",
				component_name: this.props.componentName || "ErrorBoundary",
				action_attempted: this.props.actionAttempted || "Component render",
				additional_data: {
					componentStack: errorInfo.componentStack,
					userAgent:
						typeof navigator !== "undefined" ? navigator.userAgent : null,
					url: typeof window !== "undefined" ? window.location.href : null,
					timestamp: new Date().toISOString(),
				},
			};

			// Send to error logging API (non-blocking)
			if (typeof fetch !== "undefined") {
				fetch("/api/error-logs", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(errorData),
				}).catch((err) => {
					console.warn("Failed to log error to server:", err);
				});
			}
		} catch (loggingError) {
			console.warn("Error logging failed:", loggingError);
		}
	};

	handleReset = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});

		// Call custom reset handler if provided
		if (this.props.onReset) {
			this.props.onReset();
		}
	};

	render() {
		if (this.state.hasError) {
			// Custom fallback UI
			if (this.props.fallback) {
				return this.props.fallback(this.state.error, this.handleReset);
			}

			// Default fallback UI
			return (
				<ErrorFallbackUI
					error={this.state.error}
					errorInfo={this.state.errorInfo}
					onReset={this.handleReset}
					showDetails={this.props.showDetails !== false}
					componentName={this.props.componentName}
				/>
			);
		}

		return this.props.children;
	}
}

// Fallback UI Component
const ErrorFallbackUI = ({
	error,
	errorInfo,
	onReset,
	showDetails = true,
	componentName,
}) => {
	const handleGoHome = () => {
		if (typeof window !== "undefined") {
			window.location.href = "/dashboard";
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-gray-50">
			<Card className="w-full max-w-2xl">
				<CardHeader className="text-center pb-4">
					<div className="flex justify-center mb-4">
						<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
							<AlertTriangle className="w-8 h-8 text-red-600" />
						</div>
					</div>
					<CardTitle className="text-2xl font-bold text-gray-900">
						Terjadi Kesalahan
					</CardTitle>
					<p className="text-gray-600 mt-2">
						Maaf, terjadi kesalahan saat memuat{" "}
						{componentName || "komponen ini"}. Silakan coba lagi atau kembali
						ke halaman utama.
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					{showDetails && error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<p className="text-sm font-medium text-red-900 mb-2">
								Detail Error:
							</p>
							<p className="text-sm text-red-800 font-mono break-words">
								{error.message || String(error)}
							</p>
							{process.env.NODE_ENV === "development" && errorInfo && (
								<details className="mt-3">
									<summary className="text-xs text-red-700 cursor-pointer hover:text-red-900">
										Stack Trace (Development Only)
									</summary>
									<pre className="text-xs text-red-700 mt-2 overflow-auto max-h-48 bg-red-100 p-2 rounded">
										{errorInfo.componentStack}
									</pre>
								</details>
							)}
						</div>
					)}

					<div className="flex flex-col sm:flex-row gap-3 pt-4">
						<Button
							onClick={onReset}
							className="flex-1 sm:flex-none flex items-center justify-center gap-2"
							variant="default"
						>
							<RefreshCw className="w-4 h-4" />
							Coba Lagi
						</Button>
						<Button
							onClick={handleGoHome}
							className="flex-1 sm:flex-none flex items-center justify-center gap-2"
							variant="outline"
						>
							<Home className="w-4 h-4" />
							Kembali ke Dashboard
						</Button>
					</div>

					{process.env.NODE_ENV === "development" && (
						<div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
							<p className="text-xs text-yellow-800">
								<strong>Development Mode:</strong> Error details are shown
								above. In production, users will only see a friendly error
								message.
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

// Wrapper component untuk menggunakan ErrorBoundary dengan hooks
const ErrorBoundary = ({ children, ...props }) => {
	return <ErrorBoundaryClass {...props}>{children}</ErrorBoundaryClass>;
};

export default ErrorBoundary;

