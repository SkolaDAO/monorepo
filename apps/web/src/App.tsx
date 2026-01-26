import { Button, Card, CardContent, Badge, Container, ThemeToggle } from "@skola/ui";

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Comparison />
      <CTA />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Skola" className="h-8 w-8" />
            <span className="text-xl font-bold">Skola</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </a>
            <a href="https://docs.skola.academy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Docs
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <a href="https://app.skola.academy">
              <Button variant="outline" size="sm">
                Launch App
              </Button>
            </a>
          </div>
        </div>
      </Container>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      </div>
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-6">First Course Free • No Credit Card</Badge>
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
            Teach Web3.
            <br />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Keep 92%.
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            The decentralized course marketplace built on Base. Create your first course free, get paid instantly, keep almost everything.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="https://app.skola.academy">
              <Button size="lg" className="w-full sm:w-auto">
                Start Creating — Free
              </Button>
            </a>
            <a href="https://app.skola.academy">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Browse Courses
              </Button>
            </a>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            5 free courses available now • Learn blockchain, DeFi, smart contracts & more
          </p>
        </div>
      </Container>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: "🆓",
      title: "First Course Free",
      description: "Create and publish your first course completely free. No payment required to start.",
    },
    {
      icon: "💰",
      title: "92-95% Revenue",
      description: "Keep what you earn. Just 5% platform fee. Traditional platforms take 50-63%.",
    },
    {
      icon: "⚡",
      title: "Instant Payments",
      description: "Get paid in ETH or USDC the moment someone buys. No 30-60 day wait periods.",
    },
    {
      icon: "🎬",
      title: "Protected Video Hosting",
      description: "Upload videos with signed URLs. No downloading, no link sharing.",
    },
    {
      icon: "💬",
      title: "Built-in Chat",
      description: "Community chat per course + direct messages with your students.",
    },
    {
      icon: "🎁",
      title: "3% Referral Program",
      description: "Share courses and earn 3% on every sale from your referral link.",
    },
    {
      icon: "👀",
      title: "Course Previews",
      description: "Let learners try content free before purchasing. You control what's preview.",
    },
    {
      icon: "🔔",
      title: "Real-time Notifications",
      description: "Know instantly when you make a sale or receive a message.",
    },
    {
      icon: "🌐",
      title: "Built on Base",
      description: "Low gas fees (~$0.01), fast transactions, Ethereum security.",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-32">
      <Container>
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Everything Included</h2>
          <p className="text-lg text-muted-foreground">
            Video hosting, chat, notifications, referrals — all built in. No extra tools needed.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="group cursor-default">
              <CardContent className="pt-6">
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Connect Wallet",
      description: "Connect MetaMask, Rainbow, or any Web3 wallet. Takes 10 seconds.",
    },
    {
      step: "02",
      title: "Create Your Course",
      description: "Upload videos, write lessons, set your price. First course is completely free.",
    },
    {
      step: "03",
      title: "Publish & Share",
      description: "Go live instantly. Share with your community, engage in course chat.",
    },
    {
      step: "04",
      title: "Get Paid Instantly",
      description: "92% of every sale hits your wallet immediately. No minimums, no delays.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-muted/50 py-20 md:py-32">
      <Container>
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">How It Works</h2>
          <p className="text-lg text-muted-foreground">Four steps from idea to income.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <div key={item.step} className="relative">
              <div className="mb-4 text-6xl font-bold text-primary/20">{item.step}</div>
              <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-32">
      <Container>
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Simple Pricing</h2>
          <p className="text-lg text-muted-foreground">No subscriptions. No hidden fees. Just simple, fair pricing.</p>
        </div>
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          <Card className="relative overflow-hidden border-2 border-primary">
            <div className="absolute top-0 right-0 bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              Start Here
            </div>
            <CardContent className="pt-8">
              <h3 className="mb-2 text-2xl font-bold">First Course</h3>
              <div className="mb-4">
                <span className="text-5xl font-bold">Free</span>
              </div>
              <p className="mb-6 text-muted-foreground">
                Test the platform, build your audience, no commitment.
              </p>
              <ul className="mb-8 space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 1 published course
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Unlimited lessons & videos
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Course chat & DMs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 92% revenue share
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Instant payments
                </li>
              </ul>
              <a href="https://app.skola.academy">
                <Button className="w-full">Get Started Free</Button>
              </a>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-8">
              <h3 className="mb-2 text-2xl font-bold">Unlimited Courses</h3>
              <div className="mb-4">
                <span className="text-5xl font-bold">$20</span>
                <span className="text-muted-foreground ml-2">one-time</span>
              </div>
              <p className="mb-6 text-muted-foreground">
                For serious creators ready to build a catalog.
              </p>
              <ul className="mb-8 space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Unlimited courses
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Everything in Free
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Pay once, publish forever
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Pay with ETH or USDC
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> No recurring fees ever
                </li>
              </ul>
              <a href="https://app.skola.academy">
                <Button variant="outline" className="w-full">Upgrade Anytime</Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  );
}

function Comparison() {
  const platforms = [
    { name: "Udemy", revenue: "37%", fees: "None", video: "Included", chat: "No", payout: "30-60 days" },
    { name: "Teachable", revenue: "90%", fees: "$39-119/mo", video: "Extra cost", chat: "Extra cost", payout: "30 days" },
    { name: "Kajabi", revenue: "100%", fees: "$149-399/mo", video: "Included", chat: "Included", payout: "Weekly" },
    { name: "Skola", revenue: "92%", fees: "$20 once", video: "Included", chat: "Included", payout: "Instant", highlight: true },
  ];

  return (
    <section className="py-20 md:py-32 bg-muted/50">
      <Container>
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Compare Platforms</h2>
          <p className="text-lg text-muted-foreground">See why creators choose Skola.</p>
        </div>
        <div className="mx-auto max-w-5xl overflow-x-auto">
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-4 text-left font-medium">Platform</th>
                  <th className="px-4 py-4 text-left font-medium">You Keep</th>
                  <th className="px-4 py-4 text-left font-medium">Fees</th>
                  <th className="px-4 py-4 text-left font-medium">Video</th>
                  <th className="px-4 py-4 text-left font-medium">Chat</th>
                  <th className="px-4 py-4 text-left font-medium">Payout</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((platform) => (
                  <tr
                    key={platform.name}
                    className={`border-b border-border last:border-0 ${platform.highlight ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-4">
                      <span className={platform.highlight ? "font-semibold text-primary" : ""}>{platform.name}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={platform.highlight ? "font-semibold text-primary" : ""}>{platform.revenue}</span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{platform.fees}</td>
                    <td className="px-4 py-4 text-muted-foreground">{platform.video}</td>
                    <td className="px-4 py-4 text-muted-foreground">{platform.chat}</td>
                    <td className="px-4 py-4">
                      <span className={platform.highlight ? "font-semibold text-primary" : "text-muted-foreground"}>{platform.payout}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 md:py-32">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-blue-600 p-12 text-center text-white md:p-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold md:text-5xl">Ready to Start Teaching?</h2>
            <p className="mx-auto mb-8 max-w-xl text-lg opacity-90">
              Your first course is free. No credit card, no commitment. Just connect your wallet and start creating.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a href="https://app.skola.academy">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  Create Your First Course
                </Button>
              </a>
              <a href="https://docs.skola.academy">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Read the Docs
                </Button>
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <Container>
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Skola" className="h-6 w-6" />
            <span className="font-semibold">Skola</span>
          </div>
          <div className="flex gap-6">
            <a href="https://docs.skola.academy" className="text-sm text-muted-foreground hover:text-foreground">
              Docs
            </a>
            <a href="https://x.com/skoladao" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
              Twitter
            </a>
            <a href="https://github.com/SkolaDAO" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
              GitHub
            </a>
            <a href="https://discord.gg/5qec9N8xmY" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
              Discord
            </a>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Skola. Built on Base.</p>
        </div>
      </Container>
    </footer>
  );
}

export default App;
