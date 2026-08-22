export function generateStaticParams() {
  return [
    { id: "p-001", proposalId: "demo" },
    { id: "p-002", proposalId: "demo" },
    { id: "p-003", proposalId: "demo" },
  ];
}

export default function ConfirmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
