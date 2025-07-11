import { useState, useEffect, useCallback } from "react";
import { getClientToken } from "@/lib/client-auth";

export const useDevelopmentRequest = (initialFilters = {}) => {
	const [requests, setRequests] = useState([]);
	const [statistics, setStatistics] = useState({});
	const [masterData, setMasterData] = useState({
		moduleTypes: [],
		priorities: [],
		statuses: [],
		departments: [],
	});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	const [filters, setFilters] = useState({
		status: "ALL",
		priority: "ALL",
		module_type: "ALL",
		department: "ALL",
		search: "",
		...initialFilters,
	});

	// Debounced search term
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(
		filters.search
	);

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(filters.search);
		}, 500);

		return () => clearTimeout(timer);
	}, [filters.search]);

	const fetchData = useCallback(
		async (reset = false) => {
			if (reset) {
				setIsLoading(true);
				setCurrentPage(1);
			} else {
				setIsLoadingMore(true);
			}

			try {
				const offset = reset ? 0 : (currentPage - 1) * 20;
				const params = new URLSearchParams({
					limit: "20",
					offset: offset.toString(),
					status: filters.status,
					priority: filters.priority,
					module_type: filters.module_type,
					department: filters.department,
					search: debouncedSearchTerm,
				});

				// Get authentication token
				const token = getClientToken();

				const headers = {};
				if (token) {
					headers["Authorization"] = `Bearer ${token}`;
				}

				const response = await fetch(`/api/development?${params}`, {
					headers,
				});
				const result = await response.json();

				if (!response.ok) {
					throw new Error(result.error || "Gagal mengambil data");
				}

				if (reset) {
					setRequests(result.data.requests);
				} else {
					setRequests((prev) => [...prev, ...result.data.requests]);
				}

				setStatistics(result.data.statistics);
				setMasterData(result.data.masterData);
				setHasMore(result.data.pagination.hasMore);
				setError(null);
			} catch (err) {
				console.error("Error fetching development requests:", err);
				setError(err.message);
			} finally {
				setIsLoading(false);
				setIsLoadingMore(false);
			}
		},
		[filters, debouncedSearchTerm, currentPage]
	);

	// Refresh data when filters change
	useEffect(() => {
		setCurrentPage(1);
		fetchData(true);
	}, [
		filters.status,
		filters.priority,
		filters.module_type,
		filters.department,
		debouncedSearchTerm,
	]);

	const handleLoadMore = useCallback(() => {
		if (!isLoadingMore && hasMore) {
			setCurrentPage((prev) => prev + 1);
			fetchData(false);
		}
	}, [isLoadingMore, hasMore, fetchData]);

	const handleFilterChange = useCallback((key, value) => {
		setFilters((prev) => ({
			...prev,
			[key]: value,
		}));
	}, []);

	const handleRefresh = useCallback(() => {
		fetchData(true);
	}, [fetchData]);

	const createRequest = useCallback(
		async (formData) => {
			try {
				// Get authentication token
				const token = getClientToken();

				const headers = {
					"Content-Type": "application/json",
				};

				if (token) {
					headers["Authorization"] = `Bearer ${token}`;
				}

				const response = await fetch("/api/development", {
					method: "POST",
					headers,
					body: JSON.stringify(formData),
				});

				const result = await response.json();

				if (!response.ok) {
					throw new Error(result.error || "Gagal membuat pengajuan");
				}

				// Refresh data after successful creation
				fetchData(true);
				return result;
			} catch (error) {
				console.error("Error creating request:", error);
				throw error;
			}
		},
		[fetchData]
	);

	const updateRequest = useCallback(
		async (requestId, formData) => {
			try {
				// Get authentication token
				const token = getClientToken();

				const headers = {
					"Content-Type": "application/json",
				};

				if (token) {
					headers["Authorization"] = `Bearer ${token}`;
				}

				const response = await fetch(`/api/development/${requestId}`, {
					method: "PUT",
					headers,
					body: JSON.stringify(formData),
				});

				const result = await response.json();

				if (!response.ok) {
					throw new Error(result.error || "Gagal memperbarui pengajuan");
				}

				// Refresh data after successful update
				fetchData(true);
				return result;
			} catch (error) {
				console.error("Error updating request:", error);
				throw error;
			}
		},
		[fetchData]
	);

	const deleteRequest = useCallback(
		async (requestId) => {
			try {
				// Get authentication token
				const token = getClientToken();

				const headers = {};
				if (token) {
					headers["Authorization"] = `Bearer ${token}`;
				}

				const response = await fetch(`/api/development/${requestId}`, {
					method: "DELETE",
					headers,
				});

				const result = await response.json();

				if (!response.ok) {
					throw new Error(result.error || "Gagal menghapus pengajuan");
				}

				// Refresh data after successful deletion
				fetchData(true);
				return result;
			} catch (error) {
				console.error("Error deleting request:", error);
				throw error;
			}
		},
		[fetchData]
	);

	return {
		// Data
		requests,
		statistics,
		masterData,

		// Loading states
		isLoading,
		isLoadingMore,
		error,

		// Pagination
		hasMore,
		currentPage,

		// Filters
		filters,
		debouncedSearchTerm,

		// Actions
		fetchData,
		handleLoadMore,
		handleFilterChange,
		handleRefresh,
		createRequest,
		updateRequest,
		deleteRequest,

		// Setters for direct control
		setFilters,
		setRequests,
		setError,
	};
};

// Hook untuk single request detail
export const useDevelopmentRequestDetail = (requestId) => {
	const [request, setRequest] = useState(null);
	const [notes, setNotes] = useState([]);
	const [attachments, setAttachments] = useState([]);
	const [statusHistory, setStatusHistory] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchRequestDetail = useCallback(async () => {
		if (!requestId) return;

		setIsLoading(true);
		try {
			// Get authentication token
			const token = getClientToken();

			const headers = {};
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const response = await fetch(`/api/development/${requestId}`, {
				headers,
			});
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Gagal mengambil detail pengajuan");
			}

			setRequest(result.data);
			setNotes(result.data.notes || []);
			setAttachments(result.data.attachments || []);
			setStatusHistory(result.data.statusHistory || []);
			setError(null);
		} catch (err) {
			console.error("Error fetching request detail:", err);
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	}, [requestId]);

	const addNote = useCallback(
		async (noteData) => {
			try {
				// Get authentication token
				const token = getClientToken();

				const headers = {
					"Content-Type": "application/json",
				};

				if (token) {
					headers["Authorization"] = `Bearer ${token}`;
				}

				const response = await fetch(`/api/development/${requestId}/notes`, {
					method: "POST",
					headers,
					body: JSON.stringify(noteData),
				});

				const result = await response.json();

				if (!response.ok) {
					throw new Error(result.error || "Gagal menambahkan komentar");
				}

				// Add new note to the beginning of the list
				setNotes((prev) => [result.data, ...prev]);
				return result;
			} catch (error) {
				console.error("Error adding note:", error);
				throw error;
			}
		},
		[requestId]
	);

	useEffect(() => {
		fetchRequestDetail();
	}, [fetchRequestDetail]);

	return {
		request,
		notes,
		attachments,
		statusHistory,
		isLoading,
		error,
		fetchRequestDetail,
		addNote,
		setNotes,
		setRequest,
	};
};
