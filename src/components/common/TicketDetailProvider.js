import { TicketDetailModal } from "@/components/ticket-assignment";
import useTicketDetail from "@/hooks/useTicketDetail";
import DetailButton from "./DetailButton";

const TicketDetailProvider = ({
	children,
	ticket,
	variant = "icon",
	size = "sm",
	className = "",
}) => {
	const {
		showDetailModal,
		selectedTicket,
		handleViewDetails,
		handleCloseDetail,
	} = useTicketDetail();

	const handleDetailClick = () => {
		handleViewDetails(ticket);
	};

	return (
		<>
			{children ? (
				// Jika ada children, render sebagai wrapper
				<div onClick={handleDetailClick} className="cursor-pointer">
					{children}
				</div>
			) : (
				// Jika tidak ada children, render tombol detail
				<DetailButton
					onClick={handleDetailClick}
					variant={variant}
					size={size}
					className={className}
				/>
			)}

			{/* Modal Detail */}
			<TicketDetailModal
				isOpen={showDetailModal}
				onClose={handleCloseDetail}
				ticket={selectedTicket}
			/>
		</>
	);
};

export default TicketDetailProvider;
