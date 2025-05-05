import { Card } from "@/components/ui/card";
import { Check, Stethoscope, Calendar } from "lucide-react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
} from "chart.js";

// Registrasi komponen Chart.js yang diperlukan
ChartJS.register(
	ArcElement,
	Tooltip,
	Legend,
	CategoryScale,
	LinearScale,
	BarElement,
	Title
);

const DayStatus = ({ day, status }) => {
	const getStatusColor = (status) => {
		switch (status) {
			case "hadir":
				return "bg-green-500";
			case "sakit":
				return "bg-orange-400";
			default:
				return "bg-green-500";
		}
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case "hadir":
				return <Check className="w-4 h-4 text-white" />;
			case "sakit":
				return <Stethoscope className="w-4 h-4 text-white" />;
			default:
				return <Check className="w-4 h-4 text-white" />;
		}
	};

	return (
		<div className="flex flex-col items-center gap-1">
			<div
				className={`w-8 h-8 rounded-full ${getStatusColor(
					status
				)} flex items-center justify-center`}
			>
				{getStatusIcon(status)}
			</div>
			<span className="text-xs font-medium text-white">{day}</span>
		</div>
	);
};

const StatItem = ({ icon, percentage, label }) => {
	const IconComponent = icon;
	return (
		<div className="flex flex-col items-center bg-white/80 rounded-lg py-2 px-3">
			<div className="w-8 h-8 flex items-center justify-center">
				<IconComponent className="w-5 h-5" />
			</div>
			<div className="text-lg font-bold">{percentage}%</div>
			<div className="text-gray-500 text-xs">{label}</div>
		</div>
	);
};

export function AttendanceStats({ stats }) {
	const days = [
		{ day: "Sen", status: "hadir" },
		{ day: "Sel", status: "hadir" },
		{ day: "Rab", status: "hadir" },
		{ day: "Kam", status: "sakit" },
		{ day: "Jum", status: "hadir" },
	];

	// Data untuk grafik doughnut
	const doughnutData = {
		labels: ["Hadir", "Tidak Hadir"],
		datasets: [
			{
				data: [80, 20],
				backgroundColor: ["#3b82f6", "#e5e7eb"],
				borderWidth: 0,
				cutout: "75%",
			},
		],
	};

	// Data untuk grafik bar
	const barData = {
		labels: ["Terlambat", "Izin", "Lembur"],
		datasets: [
			{
				data: [2, 1, 3],
				backgroundColor: ["#ef4444", "#3b82f6", "#22c55e"],
				borderRadius: 4,
			},
		],
	};

	// Opsi untuk grafik doughnut
	const doughnutOptions = {
		responsive: true,
		plugins: {
			legend: {
				display: false,
			},
			tooltip: {
				callbacks: {
					label: (context) => `${context.label}: ${context.raw}%`,
				},
			},
		},
	};

	// Opsi untuk grafik bar
	const barOptions = {
		responsive: true,
		scales: {
			y: {
				beginAtZero: true,
				ticks: {
					stepSize: 1,
				},
			},
		},
		plugins: {
			legend: {
				display: false,
			},
			tooltip: {
				callbacks: {
					label: (context) => `${context.raw} hari`,
				},
			},
		},
	};

	return (
		<Card className="p-4 bg-gradient-to-br from-blue-600 to-blue-700">
			<div className="flex items-center gap-2 mb-4">
				<div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
					<svg
						className="w-5 h-5 text-blue-600"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
				</div>
				<h2 className="text-lg font-semibold text-white">Statistik Presensi</h2>
			</div>

			<div className="flex justify-between mb-4">
				{days.map((item, index) => (
					<DayStatus key={index} day={item.day} status={item.status} />
				))}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="bg-white/10 rounded-xl p-4">
					<h3 className="text-sm font-medium text-white mb-2">
						Kehadiran Bulan Ini
					</h3>
					<div className="relative h-40">
						<Doughnut data={doughnutData} options={doughnutOptions} />
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="text-center">
								<span className="text-2xl font-bold text-white">80%</span>
								<p className="text-xs text-white/80">Hadir</p>
							</div>
						</div>
					</div>
				</div>

				<div className="bg-white/10 rounded-xl p-4">
					<h3 className="text-sm font-medium text-white mb-2">
						Statistik Lainnya
					</h3>
					<div className="h-40">
						<Bar data={barData} options={barOptions} />
					</div>
				</div>
			</div>
		</Card>
	);
}
