import { ApplicationClerkProvider } from '@/components/auth/DomainClerkProvider'

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <ApplicationClerkProvider>{children}</ApplicationClerkProvider>
}
