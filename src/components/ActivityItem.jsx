import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

export function ActivityItem({ activity }) {
	const getStatusVariant = (status) => {
		switch (status.toLowerCase()) {
			case "completed":
				return "completed";
			case "in progress":
				return "inProgress";
			case "pending":
				return "pending";
			default:
				return "default";
		}
	};

	return (
		<Card className="mb-4">
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div>
						<h4 className="font-semibold">{activity.title}</h4>
						<p className="text-sm text-gray-500">{activity.time}</p>
					</div>
					<Badge variant={getStatusVariant(activity.status)}>
						{activity.status}
					</Badge>
				</div>
				{activity.description && (
					<p className="mt-2 text-sm text-gray-600">{activity.description}</p>
				)}
			</CardContent>
		</Card>
	);
}
