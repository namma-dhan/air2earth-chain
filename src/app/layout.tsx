import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "AeroEarth — Earth Intelligence Platform",
	description:
		"Experience the future of environmental monitoring with high-fidelity autonomous climate tracking. Monitor air quality, harness solar potential, and track urban ecosystem vitality.",
	keywords: [
		"AQI",
		"Solar",
		"Water Harvesting",
		"Environmental Monitoring",
		"CesiumJS",
		"3D Globe",
	],
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body suppressHydrationWarning>{children}</body>
		</html>
	);
}
