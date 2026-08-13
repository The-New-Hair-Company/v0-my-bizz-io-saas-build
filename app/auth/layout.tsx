import { ApplicationClerkProvider } from '@/components/auth/DomainClerkProvider'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <ApplicationClerkProvider>{children}</ApplicationClerkProvider>
}
