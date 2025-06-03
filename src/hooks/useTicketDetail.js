import { useState } from "react";

const useTicketDetail = () => {
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [selectedTicket, setSelectedTicket] = useState(null);

	const handleViewDetails = (ticket) => {
		setSelectedTicket(ticket);
		setShowDetailModal(true);
	};

	const handleCloseDetail = () => {
		setSelectedTicket(null);
		setShowDetailModal(false);
	};

	return {
		showDetailModal,
		selectedTicket,
		handleViewDetails,
		handleCloseDetail,
	};
};

export default useTicketDetail;
