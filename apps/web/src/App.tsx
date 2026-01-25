import { Button, Card, CardContent, Badge, Container, ThemeToggle } from "@skola/ui";

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
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
            <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              How It Works
            </a>
            <a href="/docs" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Docs
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" size="sm">
              Launch App
            </Button>
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
          <Badge className="mb-6">Now in Early Access</Badge>
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
            Sell Courses.
            <br />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Keep 92%.
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            The decentralized course marketplace. Pay once, publish forever. Early supporters get airdrop.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto">
              Start Creating
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Browse Courses
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: "💰",
      title: "92% Revenue",
      description: "Keep what you earn. Traditional platforms take 50-63%. We take 5%.",
    },
    {
      icon: "🎬",
      title: "Protected Video Hosting",
      description: "Upload videos with signed URLs. No downloading, no sharing links.",
    },
    {
      icon: "💬",
      title: "Built-in Chat",
      description: "Community chat per course + direct messages with creators.",
    },
    {
      icon: "🔔",
      title: "Real-time Notifications",
      description: "Know instantly when you make a sale or receive a message.",
    },
    {
      icon: "🎁",
      title: "Referral Program",
      description: "Earn 3% on every sale from your referral link.",
    },
    {
      icon: "🔒",
      title: "Pay Once, Publish Forever",
      description: "$10 one-time fee. No subscriptions, no recurring charges.",
    },
    {
      icon: "👀",
      title: "Course Previews",
      description: "Let learners try 5% of content free before purchasing.",
    },
    {
      icon: "⚡",
      title: "Instant Payments",
      description: "Get paid immediately. No 30-60 day wait periods.",
    },
    {
      icon: "🎁",
      title: "Early Supporter Airdrop",
      description: "Pay with ETH/USDC now, receive tokens when we launch.",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-32">
      <Container>
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Everything You Need</h2>
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
      title: "Connect & Pay Once",
      description: "Connect your wallet and pay $10-$200 to become a creator forever.",
    },
    {
      step: "02",
      title: "Build Your Course",
      description: "Upload videos, write lessons, set preview content. All tools included.",
    },
    {
      step: "03",
      title: "Publish & Engage",
      description: "Go live, chat with your community, get notifications on every sale.",
    },
    {
      step: "04",
      title: "Earn & Grow",
      description: "92% of every sale + 3% referral commissions + token airdrop.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-muted/50 py-20 md:py-32">
      <Container>
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">How It Works</h2>
          <p className="text-lg text-muted-foreground">Four steps to start earning.</p>
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

function Comparison() {
  const platforms = [
    { name: "Udemy", revenue: "37%", take: "63%", video: "Included", chat: "No", referral: "No" },
    { name: "Skillshare", revenue: "~30%", take: "~70%", video: "Included", chat: "No", referral: "Yes" },
    { name: "Teachable", revenue: "90%", take: "10% + fees", video: "Extra cost", chat: "Extra cost", referral: "Yes" },
    { name: "Skola", revenue: "92%", take: "5%", video: "Included", chat: "Included", referral: "3%", highlight: true },
  ];

  return (
    <section className="py-20 md:py-32">
      <Container>
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Compare Platforms</h2>
          <p className="text-lg text-muted-foreground">See why creators choose Skola.</p>
        </div>
        <div className="mx-auto max-w-4xl overflow-x-auto">
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-4 text-left font-medium">Platform</th>
                  <th className="px-4 py-4 text-left font-medium">You Keep</th>
                  <th className="px-4 py-4 text-left font-medium">Video</th>
                  <th className="px-4 py-4 text-left font-medium">Chat</th>
                  <th className="px-4 py-4 text-left font-medium">Referral</th>
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
                    <td className="px-4 py-4 text-muted-foreground">{platform.video}</td>
                    <td className="px-4 py-4 text-muted-foreground">{platform.chat}</td>
                    <td className="px-4 py-4 text-muted-foreground">{platform.referral}</td>
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
            <h2 className="mb-4 text-3xl font-bold md:text-5xl">Ready to Keep What You Earn?</h2>
            <p className="mx-auto mb-8 max-w-xl text-lg opacity-90">
              Join the next generation of course creators. No VC backing, no token yet — just a platform built for you.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Get Early Access
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Read the Docs
              </Button>
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
            <a href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
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
          <p className="text-sm text-muted-foreground">© 2025 Skola. Built for creators.</p>
        </div>
      </Container>
    </footer>
  );
}

export default App;
