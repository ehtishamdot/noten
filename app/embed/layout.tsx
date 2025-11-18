export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Planwise - The PT/OT Brainstorming Partner</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
