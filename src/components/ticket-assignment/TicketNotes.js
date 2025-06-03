import { useState, useEffect } from "react";
import {
	MessageSquare,
	User,
	Clock,
	Settings,
	Star,
	FileText,
	UserCheck,
	CheckCircle,
} from "lucide-react";

const getTypeIcon = (type) => {
	switch (type) {
		case "status_update":
			return Settings;
		case "feedback":
			return Star;
		case "assignment":
			return UserCheck;
		case "resolution":
			return CheckCircle;
		default:
			return MessageSquare;
	}
};

const getTypeColor = (type) => {
	switch (type) {
		case "status_update":
			return "bg-blue-50 border-blue-200 text-blue-800";
		case "feedback":
			return "bg-green-50 border-green-200 text-green-800";
		case "assignment":
			return "bg-yellow-50 border-yellow-200 text-yellow-800";
		case "resolution":
			return "bg-purple-50 border-purple-200 text-purple-800";
		default:
			return "bg-gray-50 border-gray-200 text-gray-800";
	}
};

const getTypeLabel = (type) => {
	switch (type) {
		case "status_update":
			return "Update Status";
		case "feedback":
			return "Feedback User";
		case "assignment":
			return "Assignment";
		case "resolution":
			return "Resolusi";
		default:
			return "Catatan Umum";
	}
};

const TicketNotes = ({ ticketId }) => {
	const [notes, setNotes] = useState([]);
	const [groupedNotes, setGroupedNotes] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [accessLevel, setAccessLevel] = useState("no_access");

	useEffect(() => {
		if (ticketId) {
			fetchNotes();
		}
	}, [ticketId]);

	const fetchNotes = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/ticket/notes?ticket_id=${ticketId}`);
			const data = await response.json();

			if (data.status === "success") {
				setNotes(data.data.notes);
				setGroupedNotes(data.data.grouped_notes);
				setAccessLevel(data.data.access_level);
			} else {
				setError(data.error || "Gagal mengambil notes");
			}
		} catch (err) {
			setError("Terjadi kesalahan saat mengambil notes");
			console.error("Error fetching notes:", err);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center py-8">
				<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
				<span className="ml-2 text-gray-600">Memuat notes...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-lg p-4">
				<div className="flex items-center">
					<div className="text-red-600">
						<FileText className="w-5 h-5" />
					</div>
					<div className="ml-3">
						<p className="text-sm text-red-700">{error}</p>
					</div>
				</div>
			</div>
		);
	}

	if (notes.length === 0) {
		return (
			<div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
				<MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
				<p className="text-gray-600 text-sm">
					Belum ada catatan untuk ticket ini
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Notes Header */}
			<div className="flex items-center justify-between">
				<h4 className="font-semibold text-gray-900 flex items-center gap-2">
					<MessageSquare className="w-4 h-4" />
					Catatan ({notes.length})
				</h4>
				{accessLevel === "owner" && (
					<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
						Pemilik Ticket
					</span>
				)}
				{accessLevel === "it_staff" && (
					<span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
						Staff IT
					</span>
				)}
			</div>

			{/* Notes List */}
			<div className="space-y-3 max-h-96 overflow-y-auto">
				{notes.map((note) => {
					const TypeIcon = getTypeIcon(note.note_type);
					const typeColor = getTypeColor(note.note_type);
					const typeLabel = getTypeLabel(note.note_type);

					return (
						<div
							key={note.note_id}
							className={`border rounded-lg p-4 ${typeColor}`}
						>
							{/* Note Header */}
							<div className="flex items-start justify-between mb-2">
								<div className="flex items-center gap-2">
									<TypeIcon className="w-4 h-4 flex-shrink-0" />
									<div>
										{/* <span className="text-sm font-medium">{typeLabel}</span> */}
										<div className="flex items-center gap-2 text-xs opacity-75">
											<User className="w-3 h-3" />
											<span>{note.created_by_name || note.created_by}</span>
										</div>
									</div>
								</div>
								<div className="text-xs opacity-75 text-right">
									{/* <div className="flex items-center gap-1">
										<Clock className="w-3 h-3" />
										<span>{note.created_date}</span>
									</div> */}
									<div className="mt-1">
										<span>{note.created_date_relative}</span>
									</div>
								</div>
							</div>

							{/* Note Content */}
							<div className="text-sm leading-relaxed">
								<p className="whitespace-pre-wrap">{note.note}</p>
							</div>
						</div>
					);
				})}
			</div>

			{/* Summary by Type */}
			{Object.keys(groupedNotes).some(
				(key) => groupedNotes[key].length > 0
			) && (
				<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
					<h5 className="font-medium text-gray-900 mb-3 text-sm">
						Ringkasan Catatan:
					</h5>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
						{Object.entries(groupedNotes).map(([type, typeNotes]) => {
							if (typeNotes.length === 0) return null;

							const TypeIcon = getTypeIcon(type);
							const typeLabel = getTypeLabel(type);

							return (
								<div key={type} className="flex items-center gap-1">
									<TypeIcon className="w-3 h-3 text-gray-500" />
									<span className="text-gray-600">
										{typeLabel}: {typeNotes.length}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};

export default TicketNotes;
