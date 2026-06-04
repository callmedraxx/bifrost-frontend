import "./globals.css";

export const metadata = {
  title: "Bifrost Frontend",
  description: "Console for the Bifrost never-refuse bridge",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
