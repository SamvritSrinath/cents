import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Smartphone, BarChart3, Wallet } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-lg">Cents</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/50 text-sm mb-6">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span className="text-muted-foreground">100% Privacy-First • Open Source</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Track expenses with
            <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              {' '}complete privacy
            </span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your financial data stays yours. No third-party tracking, no data selling, 
            no compromises. Free forever for personal use.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/signup">
                Start Tracking Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="https://github.com/yourusername/cents" target="_blank">
                View on GitHub
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground">
              Powerful features to help you manage your finances
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Wallet className="h-6 w-6" />}
              title="Expense Tracking"
              description="Quickly log expenses with categories, merchants, and notes"
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Visual Insights"
              description="Beautiful charts and graphs to understand your spending"
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Budget Alerts"
              description="Set budgets and get notified when you're close to limits"
            />
            <FeatureCard
              icon={<Smartphone className="h-6 w-6" />}
              title="Works Everywhere"
              description="Access from any device with our responsive web app"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border/50">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to take control of your finances?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of users who trust Cents for their expense tracking.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">
              Get Started for Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <span className="text-sm text-muted-foreground">
                © 2025 Cents. Open source under MIT license.
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="https://github.com/yourusername/cents" className="hover:text-foreground">GitHub</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
