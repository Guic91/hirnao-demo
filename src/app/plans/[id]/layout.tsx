export function generateStaticParams() {
  return [{ id: "p-001" }, { id: "p-002" }, { id: "p-003" }];
}

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
