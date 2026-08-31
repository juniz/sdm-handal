import Cookies from "js-cookie";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Jakarta");

const BACKEND_URL =
	process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const GQL_ENDPOINT = `${BACKEND_URL}/graphql`;

export async function getAuthToken(request = null) {
	let token = null;
	if (request && request.headers) {
		const authHeader =
			request.headers.get("authorization") ||
			request.headers.get("Authorization");
		if (authHeader && authHeader.startsWith("Bearer ")) {
			token = authHeader.substring(7).trim();
		}
	}
	if (!token && typeof window === "undefined") {
		try {
			const { cookies } = await import("next/headers");
			const cookieStore = await cookies();
			token = cookieStore.get("auth_token")?.value;
		} catch {
			// ignore if not in request context
		}
	}
	return token;
}

/**
 * Execute GraphQL query/mutation against NestJS backend.
 * Supports token passed as argument, client-side cookie/localStorage/session restore.
 */
export async function gql(query, variables = {}, customToken = null) {
	const headers = { "Content-Type": "application/json" };
	let token = customToken;

	if (!token && typeof window !== "undefined") {
		token =
			Cookies.get("auth_token") || localStorage.getItem("auth_token_backup");

		// Auto session restore: if client token is empty, fetch from /api/auth/session
		if (!token) {
			try {
				const sessionRes = await fetch("/api/auth/session");
				if (sessionRes.ok) {
					const sessionData = await sessionRes.json();
					if (sessionData.token) {
						token = sessionData.token;
						Cookies.set("auth_token", token, {
							expires: 7,
							secure: process.env.NODE_ENV === "production",
							sameSite: "lax",
							path: "/",
						});
						localStorage.setItem("auth_token_backup", token);
						localStorage.setItem("auth_token_timestamp", Date.now().toString());
					}
				}
			} catch (err) {
				console.error("Failed to auto-restore session:", err);
			}
		}
	}

	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	const res = await fetch(GQL_ENDPOINT, {
		method: "POST",
		headers,
		credentials: "include",
		body: JSON.stringify({ query, variables }),
	});

	const json = await res.json();
	if (json.errors && json.errors.length > 0) {
		const msg = json.errors[0]?.message ?? "GraphQL error";
		throw new Error(msg);
	}
	return json.data;
}

// ─── Normalizers for Backward Compatibility ─────────────────────────────────

const formatDate = (dateStr) => {
	if (!dateStr) return null;
	const m = moment(dateStr);
	return m.isValid() ? m.format("DD MMMM YYYY HH:mm") : dateStr;
};

export function normalizeTicket(t) {
	if (!t) return null;

	const rawSubmissionDate = t.submissionDate ?? t.submission_date ?? null;
	const rawAssignedDate = t.assignedDate ?? t.assigned_date ?? null;
	const rawResolvedDate = t.resolvedDate ?? t.resolved_date ?? null;
	const rawClosedDate = t.closedDate ?? t.closed_date ?? null;
	const rawReleasedDate = t.releasedDate ?? t.released_date ?? null;

	const formattedSubmission = formatDate(rawSubmissionDate);
	const formattedAssigned = formatDate(rawAssignedDate);
	const formattedResolved = formatDate(rawResolvedDate);
	const formattedClosed = formatDate(rawClosedDate);

	const notesCount = parseInt(t.notesCount ?? t.notes_count ?? 0, 10) || 0;
	const priorityLevel =
		t.priorityLevel !== undefined && t.priorityLevel !== null
			? parseInt(t.priorityLevel, 10)
			: t.priority_level !== undefined && t.priority_level !== null
				? parseInt(t.priority_level, 10)
				: null;

	return {
		...t,
		ticket_id: t.ticketId ?? t.ticket_id,
		ticketId: t.ticketId ?? t.ticket_id,
		no_ticket: t.noTicket ?? t.no_ticket,
		noTicket: t.noTicket ?? t.no_ticket,
		user_id: t.userId ?? t.user_id,
		userId: t.userId ?? t.user_id,
		user_name: t.userName ?? t.user_name,
		userName: t.userName ?? t.user_name,
		category_id: t.categoryId ?? t.category_id,
		categoryId: t.categoryId ?? t.category_id,
		category_name: t.categoryName ?? t.category_name,
		categoryName: t.categoryName ?? t.category_name,
		priority_id: t.priorityId ?? t.priority_id,
		priorityId: t.priorityId ?? t.priority_id,
		priority_name: t.priorityName ?? t.priority_name,
		priorityName: t.priorityName ?? t.priority_name,
		priority_level: priorityLevel,
		priorityLevel: priorityLevel,
		departement_id:
			t.departementId ??
			t.departement_id ??
			t.departmentId ??
			t.department_id,
		departementId:
			t.departementId ??
			t.departement_id ??
			t.departmentId ??
			t.department_id,
		department_id:
			t.departementId ??
			t.departement_id ??
			t.departmentId ??
			t.department_id,
		departmentId:
			t.departementId ??
			t.departement_id ??
			t.departmentId ??
			t.department_id,
		departemen_name:
			t.departemenName ??
			t.departemen_name ??
			t.departmentName ??
			t.department_name,
		departemenName:
			t.departemenName ??
			t.departemen_name ??
			t.departmentName ??
			t.department_name,
		department_name:
			t.departemenName ??
			t.departemen_name ??
			t.departmentName ??
			t.department_name,
		departmentName:
			t.departemenName ??
			t.departemen_name ??
			t.departmentName ??
			t.department_name,
		title: t.title,
		description: t.description,
		current_status_id: t.currentStatusId ?? t.current_status_id,
		currentStatusId: t.currentStatusId ?? t.current_status_id,
		current_status:
			t.currentStatus ??
			t.current_status ??
			t.currentStatusName ??
			t.current_status_name,
		currentStatus:
			t.currentStatus ??
			t.current_status ??
			t.currentStatusName ??
			t.current_status_name,
		assigned_to: t.assignedTo ?? t.assigned_to,
		assignedTo: t.assignedTo ?? t.assigned_to,
		assigned_to_name: t.assignedToName ?? t.assigned_to_name,
		assignedToName: t.assignedToName ?? t.assigned_to_name,
		assigned_by: t.assignedBy ?? t.assigned_by,
		assignedBy: t.assignedBy ?? t.assigned_by,
		assigned_by_name: t.assignedByName ?? t.assigned_by_name,
		assignedByName: t.assignedByName ?? t.assigned_by_name,
		submission_date_raw: rawSubmissionDate,
		submissionDateRaw: rawSubmissionDate,
		assigned_date_raw: rawAssignedDate,
		assignedDateRaw: rawAssignedDate,
		resolved_date_raw: rawResolvedDate,
		resolvedDateRaw: rawResolvedDate,
		closed_date_raw: rawClosedDate,
		closedDateRaw: rawClosedDate,
		released_date_raw: rawReleasedDate,
		releasedDateRaw: rawReleasedDate,
		submission_date: formattedSubmission,
		submissionDate: formattedSubmission,
		assigned_date: formattedAssigned,
		assignedDate: formattedAssigned,
		resolved_date: formattedResolved,
		resolvedDate: formattedResolved,
		closed_date: formattedClosed,
		closedDate: formattedClosed,
		released_date: rawReleasedDate,
		releasedDate: rawReleasedDate,
		notes_count: notesCount,
		notesCount: notesCount,
		resolution_note: t.resolutionNote ?? t.resolution_note ?? null,
		resolutionNote: t.resolutionNote ?? t.resolution_note ?? null,
	};
}

export function normalizeTicketMasterData(md) {
	if (!md) {
		return {
			categories: [],
			priorities: [],
			statuses: [],
			departments: [],
		};
	}
	return {
		categories: (md.categories || []).map((c) => ({
			...c,
			category_id: c.categoryId ?? c.category_id,
			categoryId: c.categoryId ?? c.category_id,
			category_name: c.categoryName ?? c.category_name,
			categoryName: c.categoryName ?? c.category_name,
			description: c.description ?? null,
			is_active: c.isActive ?? c.is_active ?? true,
			isActive: c.isActive ?? c.is_active ?? true,
		})),
		priorities: (md.priorities || []).map((p) => ({
			...p,
			priority_id: p.priorityId ?? p.priority_id,
			priorityId: p.priorityId ?? p.priority_id,
			priority_name: p.priorityName ?? p.priority_name,
			priorityName: p.priorityName ?? p.priority_name,
			priority_level: p.priorityLevel ?? p.priority_level,
			priorityLevel: p.priorityLevel ?? p.priority_level,
			color_code: p.colorCode ?? p.color_code ?? null,
			colorCode: p.colorCode ?? p.color_code ?? null,
		})),
		statuses: (md.statuses || []).map((s) => ({
			...s,
			status_id: s.statusId ?? s.status_id,
			statusId: s.statusId ?? s.status_id,
			status_name: s.statusName ?? s.status_name,
			statusName: s.statusName ?? s.status_name,
			status_order: s.statusOrder ?? s.status_order ?? null,
			statusOrder: s.statusOrder ?? s.status_order ?? null,
			description: s.description ?? null,
		})),
		departments: (md.departments || []).map((d) => ({
			...d,
			dep_id: d.depId ?? d.dep_id,
			depId: d.depId ?? d.dep_id,
			nama: d.nama,
		})),
	};
}

export function normalizeItTechnician(tech) {
	if (!tech) return null;
	const activeCount =
		tech.activeTicketsCount ??
		tech.active_tickets_count ??
		tech.active_tickets ??
		0;

	return {
		...tech,
		nik: tech.nik,
		nama: tech.nama,
		jabatan: tech.jabatan ?? null,
		departemen: tech.departemen ?? tech.departemen_name ?? "IT",
		departemen_name:
			tech.departemenName ?? tech.departemen_name ?? tech.departemen ?? "IT",
		departemenName:
			tech.departemenName ?? tech.departemen_name ?? tech.departemen ?? "IT",
		active_tickets: activeCount,
		activeTicketsCount: activeCount,
		active_tickets_count: activeCount,
	};
}

export function normalizeTicketNote(n) {
	if (!n) return null;
	const rawDate = n.createdDate ?? n.created_date;
	const relativeDate =
		n.createdDateRelative ??
		n.created_date_relative ??
		(rawDate ? moment(rawDate).fromNow() : null);

	return {
		...n,
		note_id: n.noteId ?? n.note_id,
		noteId: n.noteId ?? n.note_id,
		ticket_id: n.ticketId ?? n.ticket_id,
		ticketId: n.ticketId ?? n.ticket_id,
		note: n.note,
		created_by: n.createdBy ?? n.created_by,
		createdBy: n.createdBy ?? n.created_by,
		created_by_name: n.createdByName ?? n.created_by_name ?? null,
		createdByName: n.createdByName ?? n.created_by_name ?? null,
		created_date: rawDate,
		createdDate: rawDate,
		created_date_relative: relativeDate,
		createdDateRelative: relativeDate,
		note_type: n.noteType ?? n.note_type ?? "general",
		noteType: n.noteType ?? n.note_type ?? "general",
	};
}

export function normalizeStatusHistory(h) {
	if (!h) return null;
	const rawDate = h.changeDate ?? h.change_date;
	const relativeDate =
		h.changeDateRelative ??
		h.change_date_relative ??
		(rawDate ? moment(rawDate).fromNow() : null);

	const oldStatusName = h.oldStatusName ?? h.old_status_name ?? null;
	const newStatusName = h.newStatusName ?? h.new_status_name ?? null;

	return {
		...h,
		status_history_id:
			h.historyId ?? h.history_id ?? h.status_history_id ?? null,
		history_id: h.historyId ?? h.history_id ?? h.status_history_id ?? null,
		historyId: h.historyId ?? h.history_id ?? h.status_history_id ?? null,
		ticket_id: h.ticketId ?? h.ticket_id,
		ticketId: h.ticketId ?? h.ticket_id,
		old_status: h.oldStatus ?? h.old_status ?? null,
		oldStatus: h.oldStatus ?? h.old_status ?? null,
		old_status_id: h.oldStatus ?? h.old_status ?? null,
		oldStatusId: h.oldStatus ?? h.old_status ?? null,
		old_status_name: oldStatusName,
		oldStatusName: oldStatusName,
		old_status_display: oldStatusName || "-",
		new_status: h.newStatus ?? h.new_status,
		newStatus: h.newStatus ?? h.new_status,
		new_status_id: h.newStatus ?? h.new_status,
		newStatusId: h.newStatus ?? h.new_status,
		new_status_name: newStatusName,
		newStatusName: newStatusName,
		new_status_display: newStatusName || "-",
		status_change: oldStatusName
			? `${oldStatusName} → ${newStatusName}`
			: `Status awal: ${newStatusName}`,
		changed_by: h.changedBy ?? h.changed_by,
		changedBy: h.changedBy ?? h.changed_by,
		changed_by_name: h.changedByName ?? h.changed_by_name ?? h.changedBy ?? "",
		changedByName: h.changedByName ?? h.changed_by_name ?? h.changedBy ?? "",
		changed_by_department:
			h.changedByDepartment ?? h.changed_by_department ?? "IT",
		change_date: formatDate(rawDate) || rawDate,
		changeDate: formatDate(rawDate) || rawDate,
		change_date_raw: rawDate,
		changeDateRaw: rawDate,
		change_date_relative: relativeDate,
		changeDateRelative: relativeDate,
	};
}

// ─── Core Queries & Mutations ───────────────────────────────────────────────

export async function fetchTicketAssignments(
	filter = {},
	limit = 10,
	offset = 0,
	token = null
) {
	const query = `
		query GetTicketAssignments(
			$filter: TicketFilterInput
			$limit: Int
			$offset: Int
		) {
			ticketAssignments(
				filter: $filter
				limit: $limit
				offset: $offset
			) {
				total
				items {
					ticketId
					noTicket
					userId
					userName
					categoryId
					categoryName
					priorityId
					priorityName
					priorityLevel
					departementId
					departemenName
					title
					description
					currentStatusId
					currentStatus
					submissionDate
					resolvedDate
					closedDate
					assignedTo
					assignedToName
					assignedDate
					releasedDate
					notesCount
					resolutionNote
				}
			}
		}
	`;

	const formattedFilter = {};
	if (filter.status && filter.status !== "ALL")
		formattedFilter.status = filter.status;
	if (filter.priority && filter.priority !== "ALL")
		formattedFilter.priority = filter.priority;
	if (filter.category && filter.category !== "ALL")
		formattedFilter.category = filter.category;
	if (filter.categoryId || filter.category_id) {
		formattedFilter.categoryId = parseInt(
			filter.categoryId ?? filter.category_id,
			10
		);
	}
	if (filter.assignedTo || filter.assigned_to) {
		formattedFilter.assignedTo = String(
			filter.assignedTo ?? filter.assigned_to
		);
	}
	if (
		(filter.departmentId || filter.department_id) &&
		(filter.departmentId !== "ALL" && filter.department_id !== "ALL")
	) {
		formattedFilter.departmentId = String(
			filter.departmentId ?? filter.department_id
		);
	}
	if (filter.startDate || filter.start_date) {
		formattedFilter.startDate = String(filter.startDate ?? filter.start_date);
	}
	if (filter.endDate || filter.end_date) {
		formattedFilter.endDate = String(filter.endDate ?? filter.end_date);
	}
	if (filter.search && filter.search.trim()) {
		formattedFilter.search = filter.search.trim();
	}

	const data = await gql(
		query,
		{
			filter:
				Object.keys(formattedFilter).length > 0 ? formattedFilter : null,
			limit: Number(limit) || 10,
			offset: Number(offset) || 0,
		},
		token
	);

	const res = data?.ticketAssignments;
	return {
		total: res?.total || 0,
		items: (res?.items || []).map(normalizeTicket),
	};
}

export async function fetchTicketDetail(id, token = null) {
	const query = `
		query GetTicketDetail($id: Int!) {
			ticketDetail(id: $id) {
				ticket {
					ticketId
					noTicket
					userId
					userName
					categoryId
					categoryName
					priorityId
					priorityName
					priorityLevel
					departementId
					departemenName
					title
					description
					currentStatusId
					currentStatus
					submissionDate
					resolvedDate
					closedDate
					assignedTo
					assignedToName
					assignedDate
					releasedDate
					notesCount
					resolutionNote
				}
				notes {
					noteId
					ticketId
					note
					createdBy
					createdByName
					createdDate
					createdDateRelative
					noteType
				}
				statusHistory {
					historyId
					ticketId
					oldStatus
					oldStatusName
					newStatus
					newStatusName
					changedBy
					changedByName
					changeDate
					changeDateRelative
				}
			}
		}
	`;

	const data = await gql(query, { id: parseInt(id, 10) }, token);
	const detail = data?.ticketDetail;
	if (!detail || !detail.ticket) return null;

	return {
		ticket: normalizeTicket(detail.ticket),
		notes: (detail.notes || []).map(normalizeTicketNote),
		statusHistory: (detail.statusHistory || []).map(normalizeStatusHistory),
	};
}

export async function fetchTicketMasterData(token = null) {
	const query = `
		query GetTicketMasterData {
			ticketMasterData {
				categories {
					categoryId
					categoryName
					description
					isActive
				}
				priorities {
					priorityId
					priorityName
					priorityLevel
					colorCode
				}
				statuses {
					statusId
					statusName
					statusOrder
					description
				}
				departments {
					depId
					nama
				}
			}
		}
	`;

	const data = await gql(query, {}, token);
	return normalizeTicketMasterData(data?.ticketMasterData);
}

export async function fetchItTechnicians(token = null) {
	const query = `
		query GetItTechnicians {
			itTechnicians {
				nik
				nama
				jabatan
				departemen
				activeTicketsCount
			}
		}
	`;

	const data = await gql(query, {}, token);
	return (data?.itTechnicians || []).map(normalizeItTechnician);
}

export async function fetchTicketStatusHistory(ticketId, token = null) {
	const query = `
		query GetTicketStatusHistory($ticketId: Int!) {
			ticketStatusHistory(ticketId: $ticketId) {
				historyId
				ticketId
				oldStatus
				oldStatusName
				newStatus
				newStatusName
				changedBy
				changedByName
				changeDate
				changeDateRelative
			}
		}
	`;

	const data = await gql(query, { ticketId: parseInt(ticketId, 10) }, token);
	return (data?.ticketStatusHistory || []).map(normalizeStatusHistory);
}

export async function fetchTicketNotes(ticketId, token = null) {
	const query = `
		query GetTicketNotes($ticketId: Int!) {
			ticketNotes(ticketId: $ticketId) {
				noteId
				ticketId
				note
				createdBy
				createdByName
				createdDate
				createdDateRelative
				noteType
			}
		}
	`;

	const data = await gql(query, { ticketId: parseInt(ticketId, 10) }, token);
	return (data?.ticketNotes || []).map(normalizeTicketNote);
}

export async function assignTicketGql(inputOrTicketId, assignedTo = null, token = null) {
	const mutation = `
		mutation AssignTicket($input: AssignTicketInput!) {
			assignTicket(input: $input) {
				ticketId
				noTicket
				currentStatusId
				currentStatus
				assignedTo
				assignedToName
				assignedDate
			}
		}
	`;

	let formattedInput;
	let authToken = token;

	if (typeof inputOrTicketId === "object" && inputOrTicketId !== null) {
		formattedInput = {
			ticketId: parseInt(
				inputOrTicketId.ticketId ?? inputOrTicketId.ticket_id,
				10
			),
			assignedTo: String(
				inputOrTicketId.assignedTo ?? inputOrTicketId.assigned_to
			),
		};
		if (assignedTo && typeof assignedTo === "string" && !token) {
			authToken = assignedTo;
		}
	} else {
		formattedInput = {
			ticketId: parseInt(inputOrTicketId, 10),
			assignedTo: String(assignedTo),
		};
	}

	const data = await gql(mutation, { input: formattedInput }, authToken);
	return normalizeTicket(data?.assignTicket);
}

export async function releaseTicketAssignmentGql(ticketId, token = null) {
	const mutation = `
		mutation ReleaseTicketAssignment($ticketId: Int!) {
			releaseTicketAssignment(ticketId: $ticketId)
		}
	`;

	const data = await gql(
		mutation,
		{ ticketId: parseInt(ticketId, 10) },
		token
	);
	return Boolean(data?.releaseTicketAssignment);
}

export async function updateTicketStatusGql(
	inputOrTicketId,
	status = null,
	notes = null,
	token = null
) {
	const mutation = `
		mutation UpdateTicketAssignmentStatus($input: UpdateTicketStatusInput!) {
			updateTicketAssignmentStatus(input: $input) {
				ticketId
				noTicket
				currentStatusId
				currentStatus
				resolvedDate
				closedDate
			}
		}
	`;

	let formattedInput;
	let authToken = token;

	if (typeof inputOrTicketId === "object" && inputOrTicketId !== null) {
		formattedInput = {
			ticketId: parseInt(
				inputOrTicketId.ticketId ?? inputOrTicketId.ticket_id,
				10
			),
			status: String(inputOrTicketId.status),
			notes: inputOrTicketId.notes ? String(inputOrTicketId.notes) : undefined,
		};
		if (status && typeof status === "string" && !token && !notes) {
			authToken = status;
		}
	} else {
		formattedInput = {
			ticketId: parseInt(inputOrTicketId, 10),
			status: String(status),
			notes: notes ? String(notes) : undefined,
		};
	}

	const data = await gql(mutation, { input: formattedInput }, authToken);
	return normalizeTicket(data?.updateTicketAssignmentStatus);
}

export async function addTicketNoteGql(
	inputOrTicketId,
	note = null,
	noteType = null,
	token = null
) {
	const mutation = `
		mutation AddTicketNote($input: AddTicketNoteInput!) {
			addTicketNote(input: $input) {
				noteId
				ticketId
				note
				createdBy
				createdByName
				createdDate
				noteType
			}
		}
	`;

	let formattedInput;
	let authToken = token;

	if (typeof inputOrTicketId === "object" && inputOrTicketId !== null) {
		formattedInput = {
			ticketId: parseInt(
				inputOrTicketId.ticketId ?? inputOrTicketId.ticket_id,
				10
			),
			note: String(inputOrTicketId.note),
			noteType: inputOrTicketId.noteType ?? inputOrTicketId.note_type ?? undefined,
		};
		if (note && typeof note === "string" && !token && !noteType) {
			authToken = note;
		}
	} else {
		formattedInput = {
			ticketId: parseInt(inputOrTicketId, 10),
			note: String(note),
			noteType: noteType || undefined,
		};
	}

	const data = await gql(mutation, { input: formattedInput }, authToken);
	return normalizeTicketNote(data?.addTicketNote);
}
