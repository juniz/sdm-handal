import { useState, useEffect } from "react";

const useTicketAssignment = () => {
	const [tickets, setTickets] = useState([]);
	const [itEmployees, setItEmployees] = useState([]);
	const [currentUser, setCurrentUser] = useState(null);
	const [masterData, setMasterData] = useState({
		categories: [],
		priorities: [],
		statuses: [],
	});
	const [loading, setLoading] = useState(true);
	const [filters, setFilters] = useState({
		status: "",
		priority: "",
		category: "",
		assigned_to: "",
		search: "",
	});
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 12,
		total: 0,
		totalPages: 0,
	});

	// Fetch current user info
	const fetchCurrentUser = async () => {
		try {
			const response = await fetch("/api/auth/profile");
			const data = await response.json();

			if (data.status === "success") {
				setCurrentUser(data.data);
			} else {
				console.error("Failed to fetch user profile:", data.error);
			}
		} catch (error) {
			console.error("Error fetching current user:", error);
		}
	};

	// Fetch master data
	const fetchMasterData = async () => {
		try {
			const response = await fetch("/api/ticket/master");
			const data = await response.json();

			if (data.status === "success") {
				setMasterData(data.data);
			} else {
				throw new Error(data.error || "Gagal mengambil data master");
			}
		} catch (error) {
			console.error("Error fetching master data:", error);
			throw error;
		}
	};

	// Fetch IT employees
	const fetchItEmployees = async () => {
		try {
			const response = await fetch("/api/it-employees");
			const data = await response.json();

			if (data.status === "success") {
				setItEmployees(data.data);
			} else {
				throw new Error(data.error || "Gagal mengambil data pegawai IT");
			}
		} catch (error) {
			console.error("Error fetching IT employees:", error);
			throw error;
		}
	};

	// Fetch tickets for assignment
	const fetchTickets = async (page = 1) => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: pagination.limit.toString(),
			});

			// Add filters
			if (filters.status) params.append("status", filters.status);
			if (filters.priority) params.append("priority", filters.priority);
			if (filters.category) params.append("category", filters.category);
			if (filters.assigned_to)
				params.append("assigned_to", filters.assigned_to);
			if (filters.search) params.append("search", filters.search);

			const response = await fetch(`/api/ticket-assignment?${params}`);
			const data = await response.json();

			if (data.status === "success") {
				setTickets(data.data);
				setPagination(data.pagination);
			} else {
				throw new Error(data.error || "Gagal mengambil data ticket");
			}
		} catch (error) {
			console.error("Error fetching tickets:", error);
			throw error;
		} finally {
			setLoading(false);
		}
	};

	// Assign ticket to IT employee
	const assignTicket = async (ticketId, assignedTo) => {
		try {
			const response = await fetch("/api/ticket-assignment", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					ticket_id: ticketId,
					assigned_to: assignedTo,
				}),
			});

			const data = await response.json();

			if (data.status === "success") {
				await fetchTickets(pagination.page);
				await fetchItEmployees(); // Refresh employee data
				return { success: true, message: "Ticket berhasil ditugaskan" };
			} else {
				throw new Error(data.error || "Gagal menugaskan ticket");
			}
		} catch (error) {
			console.error("Error assigning ticket:", error);
			throw error;
		}
	};

	// Release assignment
	const releaseAssignment = async (ticketId) => {
		try {
			const response = await fetch("/api/ticket-assignment", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					ticket_id: ticketId,
				}),
			});

			const data = await response.json();

			if (data.status === "success") {
				await fetchTickets(pagination.page);
				await fetchItEmployees(); // Refresh employee data
				return { success: true, message: "Assignment berhasil dilepas" };
			} else {
				throw new Error(data.error || "Gagal melepas assignment");
			}
		} catch (error) {
			console.error("Error releasing assignment:", error);
			throw error;
		}
	};

	// Update ticket status (IT employee only)
	const updateTicketStatus = async (ticketId, status, notes) => {
		try {
			const response = await fetch("/api/ticket-assignment", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					ticket_id: ticketId,
					status: status,
					notes: notes,
				}),
			});

			const data = await response.json();

			if (data.status === "success") {
				await fetchTickets(pagination.page);
				return { success: true, message: data.message };
			} else {
				throw new Error(data.error || "Gagal mengupdate status ticket");
			}
		} catch (error) {
			console.error("Error updating ticket status:", error);
			throw error;
		}
	};

	// Effect untuk fetch data awal
	useEffect(() => {
		fetchCurrentUser();
		fetchMasterData();
		fetchItEmployees();
		fetchTickets();
	}, []);

	// Effect untuk fetch data saat filter berubah
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			fetchTickets(1);
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [filters]);

	return {
		tickets,
		itEmployees,
		currentUser,
		masterData,
		loading,
		filters,
		setFilters,
		pagination,
		fetchTickets,
		assignTicket,
		releaseAssignment,
		updateTicketStatus,
		fetchItEmployees,
	};
};

export default useTicketAssignment;
