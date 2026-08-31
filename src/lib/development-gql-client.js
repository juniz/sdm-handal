import Cookies from "js-cookie";

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

export function normalizeRequest(req) {
	if (!req) return null;
	return {
		...req,
		request_id: req.requestId ?? req.request_id,
		no_request: req.noRequest ?? req.no_request,
		user_id: req.userId ?? req.user_id,
		user_name: req.userName ?? req.user_name,
		department_id: req.departmentId ?? req.department_id ?? req.departement_id,
		departement_id: req.departmentId ?? req.department_id ?? req.departement_id,
		departemen_name: req.departmentName ?? req.departemen_name,
		department_name: req.departmentName ?? req.departemen_name,
		module_type_id: req.moduleTypeId ?? req.module_type_id,
		module_type: req.moduleTypeName ?? req.module_type,
		module_type_name: req.moduleTypeName ?? req.module_type_name,
		priority_id: req.priorityId ?? req.priority_id,
		priority_name: req.priorityName ?? req.priority_name,
		priority_color: req.priorityColor ?? req.priority_color,
		priority_level: req.priorityLevel ?? req.priority_level,
		title: req.title,
		description: req.description,
		current_system_issues: req.currentSystemIssues ?? req.current_system_issues,
		proposed_solution: req.proposedSolution ?? req.proposed_solution,
		expected_completion_date:
			req.expectedCompletionDate ?? req.expected_completion_date,
		current_status_id: req.currentStatusId ?? req.current_status_id,
		current_status: req.currentStatusName ?? req.current_status,
		current_status_name: req.currentStatusName ?? req.current_status_name,
		status_color: req.statusColor ?? req.status_color,
		submission_date: req.submissionDate ?? req.submission_date,
		approved_date: req.approvedDate ?? req.approved_date,
		approved_by: req.approvedBy ?? req.approved_by,
		approved_by_name: req.approvedByName ?? req.approved_by_name,
		development_start_date:
			req.developmentStartDate ?? req.development_start_date,
		deployment_date: req.deploymentDate ?? req.deployment_date,
		completed_date: req.completedDate ?? req.completed_date,
		closed_date: req.closedDate ?? req.closed_date,
		assigned_developer: req.assignedDeveloper ?? req.assigned_developer,
		assigned_developer_name:
			req.assignedDeveloperName ?? req.assigned_developer_name,
		progress_percentage:
			req.progressPercentage ?? req.progress_percentage ?? 0,
		notes_count: req.notesCount ?? req.notes_count ?? 0,
		attachments_count: req.attachmentsCount ?? req.attachments_count ?? 0,
	};
}

export function normalizeStatistics(stats) {
	if (!stats) {
		return {
			total_requests: 0,
			pending_review: 0,
			in_progress: 0,
			completed: 0,
			rejected: 0,
			avg_completion_days: 0,
			totalRequests: 0,
			pendingReview: 0,
			inProgress: 0,
			avgCompletionDays: 0,
		};
	}
	return {
		...stats,
		total_requests: stats.totalRequests ?? stats.total_requests ?? 0,
		pending_review: stats.pendingReview ?? stats.pending_review ?? 0,
		in_progress: stats.inProgress ?? stats.in_progress ?? 0,
		completed: stats.completed ?? 0,
		rejected: stats.rejected ?? 0,
		avg_completion_days:
			stats.avgCompletionDays ?? stats.avg_completion_days ?? 0,
		totalRequests: stats.totalRequests ?? stats.total_requests ?? 0,
		pendingReview: stats.pendingReview ?? stats.pending_review ?? 0,
		inProgress: stats.inProgress ?? stats.in_progress ?? 0,
		avgCompletionDays:
			stats.avgCompletionDays ?? stats.avg_completion_days ?? 0,
	};
}

export function normalizeMasterData(md) {
	if (!md) {
		return {
			moduleTypes: [],
			priorities: [],
			statuses: [],
			departments: [],
			developers: [],
		};
	}
	return {
		moduleTypes: (md.moduleTypes || []).map((m) => ({
			...m,
			type_id: m.typeId ?? m.type_id,
			type_name: m.typeName ?? m.type_name,
			is_active: m.isActive ?? m.is_active,
		})),
		priorities: (md.priorities || []).map((p) => ({
			...p,
			priority_id: p.priorityId ?? p.priority_id,
			priority_name: p.priorityName ?? p.priority_name,
			priority_color: p.priorityColor ?? p.priority_color,
			priority_level: p.priorityLevel ?? p.priority_level,
			is_active: p.isActive ?? p.is_active,
		})),
		statuses: (md.statuses || []).map((s) => ({
			...s,
			status_id: s.statusId ?? s.status_id,
			status_name: s.statusName ?? s.status_name,
			status_color: s.statusColor ?? s.status_color,
			display_order: s.displayOrder ?? s.display_order,
			is_active: s.isActive ?? s.is_active,
		})),
		departments: (md.departments || []).map((d) => ({
			...d,
			dep_id: d.depId ?? d.dep_id,
			nama: d.nama,
		})),
		developers: (md.developers || []).map((dev) => ({
			...dev,
			nik: dev.nik,
			nama: dev.nama,
			jabatan: dev.jabatan,
			departemen_name: dev.departemenName ?? dev.departemen_name,
		})),
	};
}

export function normalizeNote(n) {
	if (!n) return null;
	return {
		...n,
		note_id: n.noteId ?? n.note_id,
		request_id: n.requestId ?? n.request_id,
		note: n.note,
		note_type: n.noteType ?? n.note_type,
		created_by: n.createdBy ?? n.created_by,
		created_by_name: n.createdByName ?? n.created_by_name,
		created_date: n.createdDate ?? n.created_date,
	};
}

export function normalizeAttachment(a) {
	if (!a) return null;
	return {
		...a,
		attachment_id: a.attachmentId ?? a.attachment_id,
		request_id: a.requestId ?? a.request_id,
		file_name: a.fileName ?? a.file_name,
		file_path: a.filePath ?? a.file_path,
		file_size: a.fileSize ?? a.file_size,
		file_type: a.fileType ?? a.file_type,
		uploaded_by: a.uploadedBy ?? a.uploaded_by,
		uploaded_by_name: a.uploadedByName ?? a.uploaded_by_name,
		upload_date: a.uploadDate ?? a.upload_date,
	};
}

export function normalizeStatusHistory(h) {
	if (!h) return null;
	return {
		...h,
		history_id: h.historyId ?? h.history_id,
		request_id: h.requestId ?? h.request_id,
		old_status:
			h.oldStatusName ??
			(h.oldStatus !== undefined && h.oldStatus !== null
				? String(h.oldStatus)
				: null),
		old_status_id: h.oldStatus ?? h.old_status_id,
		new_status:
			h.newStatusName ??
			(h.newStatus !== undefined && h.newStatus !== null
				? String(h.newStatus)
				: null),
		new_status_id: h.newStatus ?? h.new_status_id,
		changed_by: h.changedBy ?? h.changed_by,
		changed_by_name: h.changedByName ?? h.changed_by_name,
		change_date: h.changeDate ?? h.change_date,
		change_reason: h.changeReason ?? h.change_reason,
	};
}

export function normalizeAssignment(ass) {
	if (!ass) return null;
	return {
		...ass,
		assignment_id: ass.assignmentId ?? ass.assignment_id,
		request_id: ass.requestId ?? ass.request_id,
		assigned_to: ass.assignedTo ?? ass.assigned_to,
		assigned_to_name: ass.assignedToName ?? ass.assigned_to_name,
		assigned_by: ass.assignedBy ?? ass.assigned_by,
		assigned_by_name: ass.assignedByName ?? ass.assigned_by_name,
		assignment_date: ass.assignmentDate ?? ass.assignment_date,
		target_completion_date:
			ass.targetCompletionDate ?? ass.target_completion_date,
		estimated_completion_date:
			ass.targetCompletionDate ?? ass.target_completion_date,
		assignment_notes: ass.notes ?? ass.assignment_notes,
		is_active: ass.isActive ?? ass.is_active,
	};
}

export function normalizeProgressUpdate(p) {
	if (!p) return null;
	return {
		...p,
		progress_id: p.progressId ?? p.progress_id,
		request_id: p.requestId ?? p.request_id,
		updated_by: p.updatedBy ?? p.updated_by,
		updated_by_name: p.updatedByName ?? p.updated_by_name,
		progress_percentage:
			p.progressPercentage ?? p.progress_percentage ?? 0,
		status_id: p.statusId ?? p.status_id,
		status_name: p.statusName ?? p.status_name,
		progress_description: p.notes ?? p.progress_description ?? "",
		notes: p.notes ?? p.progress_description ?? "",
		update_date: p.updateDate ?? p.update_date,
	};
}

// ─── Core Queries & Mutations ───────────────────────────────────────────────

export async function fetchDevelopmentRequests(
	filter = {},
	limit = 20,
	offset = 0,
	sortBy = "submission_date",
	sortOrder = "DESC",
	token = null
) {
	const query = `
		query GetDevelopmentRequests(
			$filter: DevelopmentFilterInput
			$limit: Int
			$offset: Int
			$sortBy: String
			$sortOrder: String
		) {
			developmentRequests(
				filter: $filter
				limit: $limit
				offset: $offset
				sortBy: $sortBy
				sortOrder: $sortOrder
			) {
				total
				items {
					requestId
					noRequest
					userId
					userName
					departmentId
					departmentName
					moduleTypeId
					moduleTypeName
					priorityId
					priorityName
					priorityColor
					priorityLevel
					title
					description
					currentSystemIssues
					proposedSolution
					expectedCompletionDate
					currentStatusId
					currentStatusName
					statusColor
					submissionDate
					approvedDate
					approvedBy
					approvedByName
					developmentStartDate
					deploymentDate
					completedDate
					closedDate
					assignedDeveloper
					assignedDeveloperName
					progressPercentage
				}
				statistics {
					totalRequests
					pendingReview
					inProgress
					completed
					rejected
					avgCompletionDays
				}
				masterData {
					moduleTypes {
						typeId
						typeName
						description
						isActive
					}
					priorities {
						priorityId
						priorityName
						priorityColor
						priorityLevel
						isActive
					}
					statuses {
						statusId
						statusName
						statusColor
						displayOrder
						isActive
					}
					departments {
						depId
						nama
					}
					developers {
						nik
						nama
						jabatan
						departemenName
					}
				}
			}
		}
	`;

	const data = await gql(
		query,
		{
			filter: filter && Object.keys(filter).length > 0 ? filter : null,
			limit: Number(limit) || 20,
			offset: Number(offset) || 0,
			sortBy: sortBy || "submission_date",
			sortOrder: (sortOrder || "DESC").toUpperCase(),
		},
		token
	);

	const res = data?.developmentRequests;
	return {
		total: res?.total || 0,
		items: (res?.items || []).map(normalizeRequest),
		statistics: normalizeStatistics(res?.statistics),
		masterData: normalizeMasterData(res?.masterData),
	};
}

export async function fetchDevelopmentRequestDetail(id, token = null) {
	const query = `
		query GetDevelopmentRequestDetail($id: Int!) {
			developmentRequestDetail(id: $id) {
				request {
					requestId
					noRequest
					userId
					userName
					departmentId
					departmentName
					moduleTypeId
					moduleTypeName
					priorityId
					priorityName
					priorityColor
					priorityLevel
					title
					description
					currentSystemIssues
					proposedSolution
					expectedCompletionDate
					currentStatusId
					currentStatusName
					statusColor
					submissionDate
					approvedDate
					approvedBy
					approvedByName
					developmentStartDate
					deploymentDate
					completedDate
					closedDate
					assignedDeveloper
					assignedDeveloperName
					progressPercentage
				}
				notes {
					noteId
					requestId
					note
					noteType
					createdBy
					createdByName
					createdDate
				}
				attachments {
					attachmentId
					requestId
					fileName
					filePath
					fileSize
					fileType
					uploadedBy
					uploadedByName
					uploadDate
				}
				statusHistory {
					historyId
					requestId
					oldStatus
					oldStatusName
					newStatus
					newStatusName
					changedBy
					changedByName
					changeDate
					changeReason
				}
				assignments {
					assignmentId
					requestId
					assignedTo
					assignedToName
					assignedBy
					assignedByName
					assignmentDate
					targetCompletionDate
					notes
					isActive
				}
				progressUpdates {
					progressId
					requestId
					updatedBy
					updatedByName
					progressPercentage
					statusId
					statusName
					notes
					updateDate
				}
			}
		}
	`;

	const data = await gql(query, { id: parseInt(id, 10) }, token);
	const detail = data?.developmentRequestDetail;
	if (!detail || !detail.request) return null;

	return {
		request: normalizeRequest(detail.request),
		notes: (detail.notes || []).map(normalizeNote),
		attachments: (detail.attachments || []).map(normalizeAttachment),
		statusHistory: (detail.statusHistory || []).map(normalizeStatusHistory),
		assignments: (detail.assignments || []).map(normalizeAssignment),
		progressUpdates: (detail.progressUpdates || []).map(normalizeProgressUpdate),
	};
}

export async function fetchDevelopmentMasterData(token = null) {
	const query = `
		query GetDevelopmentMasterData {
			developmentMasterData {
				moduleTypes {
					typeId
					typeName
					description
					isActive
				}
				priorities {
					priorityId
					priorityName
					priorityColor
					priorityLevel
					isActive
				}
				statuses {
					statusId
					statusName
					statusColor
					displayOrder
					isActive
				}
				departments {
					depId
					nama
				}
				developers {
					nik
					nama
					jabatan
					departemenName
				}
			}
		}
	`;

	const data = await gql(query, {}, token);
	return normalizeMasterData(data?.developmentMasterData);
}

export async function createDevelopmentRequest(input, token = null) {
	const mutation = `
		mutation CreateDevelopmentRequest($input: CreateDevelopmentRequestInput!) {
			createDevelopmentRequest(input: $input) {
				requestId
				noRequest
				userId
				userName
				departmentId
				departmentName
				moduleTypeId
				moduleTypeName
				priorityId
				priorityName
				priorityColor
				priorityLevel
				title
				description
				currentSystemIssues
				proposedSolution
				expectedCompletionDate
				currentStatusId
				currentStatusName
				statusColor
				submissionDate
				progressPercentage
			}
		}
	`;

	const formattedInput = {
		title: input.title,
		description: input.description,
		moduleTypeId: parseInt(input.moduleTypeId ?? input.module_type_id, 10),
		priorityId: parseInt(input.priorityId ?? input.priority_id, 10),
		departmentId: String(
			input.departmentId ??
				input.department_id ??
				input.departement_id ??
				"IT"
		),
		currentSystemIssues:
			input.currentSystemIssues ?? input.current_system_issues ?? null,
		proposedSolution: input.proposedSolution ?? input.proposed_solution ?? null,
		expectedCompletionDate:
			input.expectedCompletionDate ?? input.expected_completion_date ?? null,
	};

	const data = await gql(mutation, { input: formattedInput }, token);
	return normalizeRequest(data?.createDevelopmentRequest);
}

export async function updateDevelopmentRequest(id, input, token = null) {
	const mutation = `
		mutation UpdateDevelopmentRequest($id: Int!, $input: UpdateDevelopmentRequestInput!) {
			updateDevelopmentRequest(id: $id, input: $input) {
				requestId
				noRequest
				userId
				userName
				departmentId
				departmentName
				moduleTypeId
				moduleTypeName
				priorityId
				priorityName
				priorityColor
				priorityLevel
				title
				description
				currentSystemIssues
				proposedSolution
				expectedCompletionDate
				currentStatusId
				currentStatusName
				statusColor
				progressPercentage
			}
		}
	`;

	const formattedInput = {};
	if (input.title !== undefined) formattedInput.title = input.title;
	if (input.description !== undefined)
		formattedInput.description = input.description;
	if (input.moduleTypeId !== undefined || input.module_type_id !== undefined) {
		formattedInput.moduleTypeId = parseInt(
			input.moduleTypeId ?? input.module_type_id,
			10
		);
	}
	if (input.priorityId !== undefined || input.priority_id !== undefined) {
		formattedInput.priorityId = parseInt(
			input.priorityId ?? input.priority_id,
			10
		);
	}
	if (
		input.departmentId !== undefined ||
		input.department_id !== undefined ||
		input.departement_id !== undefined
	) {
		formattedInput.departmentId = String(
			input.departmentId ?? input.department_id ?? input.departement_id
		);
	}
	if (
		input.currentSystemIssues !== undefined ||
		input.current_system_issues !== undefined
	) {
		formattedInput.currentSystemIssues =
			input.currentSystemIssues ?? input.current_system_issues ?? null;
	}
	if (
		input.proposedSolution !== undefined ||
		input.proposed_solution !== undefined
	) {
		formattedInput.proposedSolution =
			input.proposedSolution ?? input.proposed_solution ?? null;
	}
	if (
		input.expectedCompletionDate !== undefined ||
		input.expected_completion_date !== undefined
	) {
		formattedInput.expectedCompletionDate =
			input.expectedCompletionDate ?? input.expected_completion_date ?? null;
	}

	const data = await gql(
		mutation,
		{ id: parseInt(id, 10), input: formattedInput },
		token
	);
	return normalizeRequest(data?.updateDevelopmentRequest);
}

export async function deleteDevelopmentRequest(id, token = null) {
	const mutation = `
		mutation DeleteDevelopmentRequest($id: Int!) {
			deleteDevelopmentRequest(id: $id)
		}
	`;

	const data = await gql(mutation, { id: parseInt(id, 10) }, token);
	return Boolean(data?.deleteDevelopmentRequest);
}

export async function approveDevelopmentRequest(id, input, token = null) {
	const mutation = `
		mutation ApproveDevelopmentRequest($id: Int!, $input: ApproveDevelopmentInput!) {
			approveDevelopmentRequest(id: $id, input: $input) {
				requestId
				noRequest
				currentStatusId
				currentStatusName
				statusColor
				approvedDate
				approvedBy
				approvedByName
			}
		}
	`;

	const formattedInput = {
		action: String(input.action).toUpperCase(),
		reason: input.reason || null,
		estimatedDays: input.estimatedDays
			? parseInt(input.estimatedDays, 10)
			: null,
		assignedTo: input.assignedTo || null,
	};

	const data = await gql(
		mutation,
		{ id: parseInt(id, 10), input: formattedInput },
		token
	);
	return normalizeRequest(data?.approveDevelopmentRequest);
}

export async function assignDevelopmentRequest(id, input, token = null) {
	const mutation = `
		mutation AssignDevelopmentRequest($id: Int!, $input: AssignDevelopmentInput!) {
			assignDevelopmentRequest(id: $id, input: $input) {
				requestId
				noRequest
				assignedDeveloper
				assignedDeveloperName
				currentStatusId
				currentStatusName
				statusColor
			}
		}
	`;

	const formattedInput = {
		assignedTo: String(input.assignedTo ?? input.assigned_to),
		targetCompletionDate:
			input.targetCompletionDate ??
			input.estimated_completion_date ??
			input.target_completion_date ??
			null,
		notes: input.notes ?? input.assignment_notes ?? null,
	};

	const data = await gql(
		mutation,
		{ id: parseInt(id, 10), input: formattedInput },
		token
	);
	return normalizeRequest(data?.assignDevelopmentRequest);
}

export async function updateDevelopmentProgress(id, input, token = null) {
	const mutation = `
		mutation UpdateDevelopmentProgress($id: Int!, $input: UpdateDevelopmentProgressInput!) {
			updateDevelopmentProgress(id: $id, input: $input) {
				requestId
				noRequest
				progressPercentage
				currentStatusId
				currentStatusName
				statusColor
				completedDate
			}
		}
	`;

	const formattedInput = {
		progressPercentage: parseInt(
			input.progressPercentage ?? input.progress_percentage,
			10
		),
		statusId: input.statusId ? parseInt(input.statusId, 10) : undefined,
		notes:
			input.notes ??
			input.progressDescription ??
			input.progress_description ??
			null,
	};

	const data = await gql(
		mutation,
		{ id: parseInt(id, 10), input: formattedInput },
		token
	);
	return normalizeRequest(data?.updateDevelopmentProgress);
}

export async function addDevelopmentNote(id, input, token = null) {
	const mutation = `
		mutation AddDevelopmentNote($id: Int!, $input: AddDevelopmentNoteInput!) {
			addDevelopmentNote(id: $id, input: $input) {
				noteId
				requestId
				note
				noteType
				createdBy
				createdByName
				createdDate
			}
		}
	`;

	const formattedInput = {
		note: String(input.note),
		noteType: input.noteType ?? input.note_type ?? "comment",
	};

	const data = await gql(
		mutation,
		{ id: parseInt(id, 10), input: formattedInput },
		token
	);
	return normalizeNote(data?.addDevelopmentNote);
}
