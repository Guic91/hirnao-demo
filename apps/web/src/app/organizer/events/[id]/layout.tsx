const DEMO_EVENT_ID = "10000000-0000-0000-0000-000000000001";

export function generateStaticParams() {
  return [{ id: DEMO_EVENT_ID }];
}

export default function OrganizerEventLayout({ children }: { children: React.ReactNode }) {
  return children;
}
