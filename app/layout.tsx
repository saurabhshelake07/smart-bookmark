import "bootstrap/dist/css/bootstrap.min.css"; // import globally
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Smart Bookmark App</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
