export function getPenilaianInputLimitDays() {
	const daysEnv = process.env.NEXT_PUBLIC_PENILAIAN_INPUT_LIMIT_DAYS;
	if (daysEnv !== undefined && daysEnv !== null && daysEnv.trim() !== "") {
		const parsed = parseInt(daysEnv, 10);
		if (!isNaN(parsed) && parsed > 0) {
			return parsed;
		}
		if (parsed === 0) {
			return 0;
		}
	}

	const legacyVal = process.env.NEXT_PUBLIC_ENABLE_PENILAIAN_24H_LIMIT;
	if (legacyVal === "true" || legacyVal === "1") {
		return 1;
	}

	return 0;
}

export function isPenilaianLimitEnabled() {
	return getPenilaianInputLimitDays() > 0;
}

export function is24hLimitEnabled() {
	return isPenilaianLimitEnabled();
}
