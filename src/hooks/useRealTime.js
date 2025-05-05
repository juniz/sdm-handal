import { useState, useEffect } from "react";
import moment from "moment";
import "moment/locale/id";

// Set locale ke Indonesia
moment.locale("id");

export function useRealTime() {
	const [time, setTime] = useState(moment());

	useEffect(() => {
		// Update setiap detik
		const timer = setInterval(() => {
			setTime(moment());
		}, 1000);

		// Cleanup interval ketika komponen unmount
		return () => clearInterval(timer);
	}, []);

	return {
		time: time.toDate(),
		formattedTime: time.format("HH:mm:ss"),
		formattedDate: time.format("dddd, DD MMMM YYYY"),
		momentInstance: time,
	};
}
