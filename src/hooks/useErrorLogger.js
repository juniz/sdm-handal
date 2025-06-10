"use client";

import { useCallback } from "react";

// Fungsi untuk mendapatkan informasi device
function getDeviceInfo() {
	if (typeof window === "undefined") return {};

	return {
		screenWidth: window.screen?.width,
		screenHeight: window.screen?.height,
		windowWidth: window.innerWidth,
		windowHeight: window.innerHeight,
		userAgent: navigator.userAgent,
		language: navigator.language,
		cookieEnabled: navigator.cookieEnabled,
		onLine: navigator.onLine,
		platform: navigator.platform,
		url: window.location.href,
		referrer: document.referrer,
		timestamp: new Date().toISOString(),
	};
}

// Fungsi untuk mendeteksi severity berdasarkan error type
function detectSeverity(errorType, errorMessage) {
	const criticalKeywords = [
		"network",
		"timeout",
		"failed to fetch",
		"500",
		"502",
		"503",
	];
	const highKeywords = ["camera", "location", "permission", "access denied"];
	const mediumKeywords = ["validation", "format", "invalid"];

	const message = (errorType + " " + errorMessage).toLowerCase();

	if (criticalKeywords.some((keyword) => message.includes(keyword))) {
		return "CRITICAL";
	}
	if (highKeywords.some((keyword) => message.includes(keyword))) {
		return "HIGH";
	}
	if (mediumKeywords.some((keyword) => message.includes(keyword))) {
		return "MEDIUM";
	}
	return "LOW";
}

export const useErrorLogger = () => {
	const logError = useCallback(
		async ({
			error,
			errorType,
			componentName,
			actionAttempted,
			severity,
			additionalData = {},
		}) => {
			try {
				// Jika error adalah Error object, extract informasi
				let errorMessage, errorStack;

				if (error instanceof Error) {
					errorMessage = error.message;
					errorStack = error.stack;
					errorType = errorType || error.name;
				} else if (typeof error === "string") {
					errorMessage = error;
					errorStack = null;
				} else {
					errorMessage = JSON.stringify(error);
					errorStack = null;
				}

				// Auto detect severity jika tidak diberikan
				if (!severity) {
					severity = detectSeverity(errorType, errorMessage);
				}

				// Prepare log data
				const logData = {
					error_type: errorType || "UnknownError",
					error_message: errorMessage,
					error_stack: errorStack,
					page_url:
						typeof window !== "undefined" ? window.location.pathname : null,
					severity,
					component_name: componentName,
					action_attempted: actionAttempted,
					additional_data: {
						...additionalData,
						deviceInfo: getDeviceInfo(),
						sessionId: Math.random().toString(36).substring(2, 15),
						errorOccurredAt: new Date().toISOString(),
					},
				};

				// Send to API (non-blocking)
				fetch("/api/error-logs", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(logData),
				}).catch((err) => {
					console.warn("Failed to log error to server:", err);
				});

				// Also log to console for development
				if (process.env.NODE_ENV === "development") {
					console.group(`🚨 Error Logged: ${errorType}`);
					console.error("Message:", errorMessage);
					console.log("Component:", componentName);
					console.log("Action:", actionAttempted);
					console.log("Severity:", severity);
					console.log("Additional Data:", additionalData);
					if (errorStack) console.log("Stack:", errorStack);
					console.groupEnd();
				}
			} catch (loggingError) {
				console.error("Error in error logger:", loggingError);
			}
		},
		[]
	);

	// Wrapper untuk menangkap error dari async functions
	const withErrorLogging = useCallback(
		(
			asyncFunction,
			{
				componentName,
				actionAttempted,
				errorType = "AsyncError",
				severity,
				additionalData = {},
			}
		) => {
			return async (...args) => {
				try {
					return await asyncFunction(...args);
				} catch (error) {
					await logError({
						error,
						errorType,
						componentName,
						actionAttempted,
						severity,
						additionalData,
					});
					throw error; // Re-throw untuk handling normal
				}
			};
		},
		[logError]
	);

	// Wrapper untuk menangkap error dari event handlers
	const withErrorLoggingSync = useCallback(
		(
			syncFunction,
			{
				componentName,
				actionAttempted,
				errorType = "SyncError",
				severity,
				additionalData = {},
			}
		) => {
			return (...args) => {
				try {
					return syncFunction(...args);
				} catch (error) {
					logError({
						error,
						errorType,
						componentName,
						actionAttempted,
						severity,
						additionalData,
					});
					throw error; // Re-throw untuk handling normal
				}
			};
		},
		[logError]
	);

	return {
		logError,
		withErrorLogging,
		withErrorLoggingSync,
	};
};

// Global error handler untuk unhandled errors
export const setupGlobalErrorHandler = () => {
	if (typeof window === "undefined") return;

	const errorLogger = {
		logError: async (logData) => {
			try {
				await fetch("/api/error-logs", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(logData),
				});
			} catch (err) {
				console.warn("Failed to log global error:", err);
			}
		},
	};

	// Handle unhandled JavaScript errors
	window.addEventListener("error", (event) => {
		errorLogger.logError({
			error_type: "UnhandledError",
			error_message: event.message,
			error_stack: event.error?.stack,
			page_url: window.location.pathname,
			severity: "HIGH",
			component_name: "Global",
			action_attempted: "Unknown",
			additional_data: {
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno,
				deviceInfo: getDeviceInfo(),
			},
		});
	});

	// Handle unhandled promise rejections
	window.addEventListener("unhandledrejection", (event) => {
		errorLogger.logError({
			error_type: "UnhandledPromiseRejection",
			error_message: event.reason?.message || String(event.reason),
			error_stack: event.reason?.stack,
			page_url: window.location.pathname,
			severity: "HIGH",
			component_name: "Global",
			action_attempted: "Promise execution",
			additional_data: {
				reason: String(event.reason),
				deviceInfo: getDeviceInfo(),
			},
		});
	});
};

export default useErrorLogger;
