import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workflows - Merlin AI',
  description: 'Agentic multi-step workflows',
};

export default function WorkflowsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
