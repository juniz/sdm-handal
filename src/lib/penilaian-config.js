export function is24hLimitEnabled() {
	const val = process.env.NEXT_PUBLIC_ENABLE_PENILAIAN_24H_LIMIT;
	return val === "true" || val === "1";
}
