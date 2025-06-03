import { useState, useEffect } from "react";

const useTicket = () => {
	const [tickets, setTickets] = useState([]);
	const [masterData, setMasterData] = useState({
		categories: [],
		priorities: [],
		statuses: [],
		departments: [],
	});
	const [loading, setLoading] = useState(true);
	const [filters, setFilters] = useState({
		status: "",
		priority: "",
		category: "",
		search: "",
		myTickets: true,
	});
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 12,
		total: 0,
		totalPages: 0,
	});

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

	// Fetch tickets
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
			if (filters.search) params.append("search", filters.search);
			if (filters.myTickets) params.append("my_tickets", "true");

			const response = await fetch(`/api/ticket?${params}`);
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

	// Create ticket
	const createTicket = async (formData) => {
		try {
			const response = await fetch("/api/ticket", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (data.status === "success") {
				await fetchTickets(pagination.page);
				return { success: true, message: "Pelaporan berhasil dibuat" };
			} else {
				throw new Error(data.error || "Gagal menyimpan ticket");
			}
		} catch (error) {
			console.error("Error creating ticket:", error);
			throw error;
		}
	};

	// Update ticket
	const updateTicket = async (formData, ticketId) => {
		try {
			const response = await fetch("/api/ticket", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ ...formData, ticket_id: ticketId }),
			});

			const data = await response.json();

			if (data.status === "success") {
				await fetchTickets(pagination.page);
				return { success: true, message: "Pelaporan berhasil diperbarui" };
			} else {
				throw new Error(data.error || "Gagal memperbarui ticket");
			}
		} catch (error) {
			console.error("Error updating ticket:", error);
			throw error;
		}
	};

	// Delete ticket
	const deleteTicket = async (ticketId) => {
		try {
			const response = await fetch("/api/ticket", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ ticket_id: ticketId }),
			});

			const data = await response.json();

			if (data.status === "success") {
				await fetchTickets(pagination.page);
				return { success: true, message: "Ticket berhasil dihapus" };
			} else {
				throw new Error(data.error || "Gagal menghapus ticket");
			}
		} catch (error) {
			console.error("Error deleting ticket:", error);
			throw error;
		}
	};

	// Close ticket (user confirmation)
	const closeTicket = async (ticketId, feedback) => {
		try {
			const response = await fetch("/api/ticket", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					ticket_id: ticketId,
					feedback: feedback,
				}),
			});

			const data = await response.json();

			if (data.status === "success") {
				await fetchTickets(pagination.page);
				return { success: true, message: data.message };
			} else {
				throw new Error(data.error || "Gagal menutup ticket");
			}
		} catch (error) {
			console.error("Error closing ticket:", error);
			throw error;
		}
	};

	// Effect untuk fetch data awal
	useEffect(() => {
		fetchMasterData();
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
		masterData,
		loading,
		filters,
		setFilters,
		pagination,
		fetchTickets,
		createTicket,
		updateTicket,
		deleteTicket,
		closeTicket,
	};
};

export default useTicket;
