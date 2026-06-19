import "./globals.css";

export const metadata = {
  title: "EPION",
  description: "Accelerate your prep for SGPGI, AIIMS NORCET, ESIC, DSSSB, and RRB Nursing Officer exams with high-yield MCQs, mock tests, and AI diagnostics by EPION.",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["EPION", "Nursing Officer", "AIIMS NORCET", "Nursing MCQ", "Mock Tests", "SGPGI Prep"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EPION",
  },
};

export const viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}

