import { ReactNode } from "react";
import { Viewport } from "next";
import localFont from "next/font/local";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import config from "@/config";
import "./globals.css";

// Font configurations
const inter = localFont({
	src: [
		{
			path: "../public/fonts/inter/Inter-Variable.woff2",
			weight: "400 700",
			style: "normal",
		},
	],
	variable: "--font-inter",
	display: "swap",
	preload: true,
	fallback: [
		"-apple-system",
		"BlinkMacSystemFont",
		"Segoe UI",
		"Helvetica Neue",
		"Arial",
		"sans-serif",
	],
});

const jetbrainsMono = localFont({
	src: [
		{
			path: "../public/fonts/jetbrains-mono/JetBrainsMono-Regular.woff2",
			weight: "400",
			style: "normal",
		},
	],
	variable: "--font-jetbrains-mono",
	display: "swap",
	preload: true,
	fallback: ["Consolas", "Monaco", "monospace"],
});

const sourceSerif = localFont({
	src: [
		{
			path: "../public/fonts/source-serif-4/SourceSerif4-Variable.woff2",
			weight: "400 700",
			style: "normal",
		},
	],
	variable: "--font-source-serif",
	display: "swap",
	preload: true,
	fallback: ["Georgia", "serif"],
});

export const viewport: Viewport = {
	// Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
	themeColor: config.colors.main,
	width: "device-width",
	initialScale: 1,
};

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSOTags() function.
export const metadata = getSEOTags();

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${inter.className} ${inter.variable} ${jetbrainsMono.variable} ${sourceSerif.variable}`}>
				{/* ClientLayout contains all the client wrappers (Crisp chat support, toast messages, tooltips, etc.) */}
				<ClientLayout>{children}</ClientLayout>
			</body>
		</html>
	);
}
