import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button, Badge, Container, ThemeToggle, cn } from "@skola/ui";
import { FaXTwitter, FaDiscord, FaGithub } from "react-icons/fa6";

const API_URL = import.meta.env.VITE_API_URL || "https://api.skola.academy";

function App() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <Hero />
      <Stats />
      <FeaturedCourses />
      <Features />
      <HowItWorks />
      <Pricing />
      <Comparison />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

// Animated counter hook
function useCounter(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!startOnView || inView) {
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [end, duration, inView, startOnView]);

  return { count, ref };
}

// Fade up animation variant
const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "fixed top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/5"
            : "bg-transparent"
        )}
      >
        <Container>
          <div className="flex h-16 md:h-20 items-center justify-between">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <img src="/logo.png" alt="Skola" className="relative h-9 w-9" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Skola
              </span>
            </motion.div>

            <nav className="hidden items-center gap-8 lg:flex">
              {[
                { href: "#features", label: "Features" },
                { href: "#how-it-works", label: "How It Works" },
                { href: "#pricing", label: "Pricing" },
                { href: "https://github.com/SkolaDAO/monorepo#readme", label: "Docs", external: true },
              ].map((link) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground relative group"
                  whileHover={{ y: -2 }}
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                </motion.a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <a href="https://app.skola.academy" className="hidden sm:block">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/30 hover:bg-primary/10 hover:border-primary"
                >
                  Browse Courses
                </Button>
              </a>
              <a href="https://app.skola.academy">
                <Button size="sm" className="shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                  Start Teaching
                </Button>
              </a>
              <button
                className="lg:hidden p-2"
                onClick={() => setMobileMenuOpen(true)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </Container>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex justify-end">
                <button onClick={() => setMobileMenuOpen(false)} className="p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col items-center justify-center flex-1 gap-8">
                {["Features", "How It Works", "Pricing", "Docs"].map((item) => (
                  <a
                    key={item}
                    href={item === "Docs" ? "https://github.com/SkolaDAO/monorepo#readme" : `#${item.toLowerCase().replace(/ /g, "-")}`}
                    className="text-2xl font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
                <a href="https://app.skola.academy">
                  <Button size="lg" className="mt-4">Start Teaching Free</Button>
                </a>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <motion.div
          className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(217 91% 60% / 0.12) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -50, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 50%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <Container>
        <motion.div
          style={{ y, opacity }}
          className="mx-auto max-w-5xl text-center py-20 md:py-32"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Badge
              className="mb-6 px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 cursor-default"
            >
              <span className="mr-2">🎉</span>
              First Course Free • No Credit Card Required
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]"
          >
            Teach Web3.
            <br />
            <span className="relative">
              <span className="bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Keep 92%.
              </span>
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-500 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto mb-10 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed"
          >
            The decentralized course marketplace built on{" "}
            <span className="text-foreground font-medium">Base</span>. Create courses,
            get paid instantly in crypto, and keep almost everything you earn.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a href="https://app.skola.academy">
              <Button
                size="lg"
                className="text-lg px-8 py-6 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300 group"
              >
                Start Creating — It's Free
                <motion.span
                  className="ml-2 inline-block"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </Button>
            </a>
            <a href="https://app.skola.academy">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2 hover:bg-accent/50 transition-all duration-300"
              >
                Explore Free Courses
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>No monthly fees</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Instant payments</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Own your content</span>
            </div>
          </motion.div>
        </motion.div>
      </Container>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-3 bg-muted-foreground/50 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

function Stats() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const stats = [
    { value: 92, suffix: "%", label: "Revenue to Creators", description: "Industry-leading payouts" },
    { value: 5, suffix: "", label: "Free Courses", description: "Start learning today" },
    { value: 1, suffix: "¢", label: "Gas Fees", description: "Built on Base L2" },
    { value: 20, prefix: "$", suffix: "", label: "One-time Fee", description: "Unlimited courses forever" },
  ];

  return (
    <section ref={ref} className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
      <Container>
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {stats.map((stat) => {
            const counter = useCounter(stat.value, 2000, isInView);
            return (
              <motion.div
                key={stat.label}
                variants={fadeUpVariant}
                className="text-center group"
              >
                <div className="relative inline-block">
                  <motion.div
                    className="absolute inset-0 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={false}
                  />
                  <span
                    ref={counter.ref}
                    className="relative text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent"
                  >
                    {stat.prefix}{counter.count}{stat.suffix}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{stat.label}</h3>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}

interface FeaturedCourse {
  id: string;
  title: string;
  thumbnail: string | null;
  priceUsd: string;
  isFree: boolean;
  studentCount?: number;
  rating?: {
    average: number;
    count: number;
  } | null;
  creator?: {
    username: string | null;
    address: string;
    avatar: string | null;
    isVerified?: boolean;
  };
}

function useFeaturedCourses() {
  const [courses, setCourses] = useState<FeaturedCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/courses?limit=4`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data.data || []);
      }
    } catch {
      // Silently fail - will show empty state or fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, isLoading };
}

function FeaturedCourses() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { courses, isLoading } = useFeaturedCourses();

  const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  // Don't render section if no courses and not loading
  if (!isLoading && courses.length === 0) {
    return null;
  }

  return (
    <section ref={ref} className="py-20 md:py-32">
      <Container>
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpVariant} className="text-center mb-12">
            <Badge className="mb-4">Start Learning Now</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Popular Courses
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Jump right in with courses from our community of expert creators.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border/50 animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {courses.map((course) => (
                <motion.a
                  key={course.id}
                  href={`https://app.skola.academy/course/${course.id}`}
                  variants={fadeUpVariant}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <svg className="w-12 h-12 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Badge className={cn(
                      "absolute top-3 left-3 border-0",
                      course.isFree ? "bg-green-500 text-white" : "bg-background/90 text-foreground"
                    )}>
                      {course.isFree ? "FREE" : `$${Number(course.priceUsd).toFixed(0)}`}
                    </Badge>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {course.creator?.avatar ? (
                        <img
                          src={course.creator.avatar}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-[10px] font-medium text-white">
                          {(course.creator?.username || course.creator?.address || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <span className="truncate flex items-center gap-1">
                        {course.creator?.username || truncateAddress(course.creator?.address || "")}
                        {course.creator?.isVerified && (
                          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 22 22" fill="none">
                            <circle cx="11" cy="11" r="11" fill="#1D9BF0"/>
                            <path d="M9.5 14.25L6.25 11L7.3125 9.9375L9.5 12.125L14.6875 6.9375L15.75 8L9.5 14.25Z" fill="white"/>
                          </svg>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      {course.rating && course.rating.count > 0 && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-medium text-foreground">{course.rating.average}</span>
                          <span>({course.rating.count})</span>
                        </div>
                      )}
                      {course.studentCount !== undefined && course.studentCount > 0 && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span>{course.studentCount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          )}

          <motion.div variants={fadeUpVariant} className="text-center mt-10">
            <a href="https://app.skola.academy">
              <Button variant="outline" size="lg" className="group">
                View All Courses
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

function Features() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Keep 92-95%",
      description: "The highest creator payouts in the industry. Only 5% platform fee vs 50-63% on traditional platforms.",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Instant Payments",
      description: "Get paid in ETH or USDC the moment someone purchases. No 30-60 day wait periods.",
      gradient: "from-amber-500 to-orange-600",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      title: "Protected Videos",
      description: "Secure video hosting with signed URLs. No downloading, no unauthorized sharing.",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: "Built-in Community",
      description: "Course chat rooms and direct messaging. Engage with students without external tools.",
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
      title: "Referral Program",
      description: "Earn 3% on every sale from your referral links. Turn your audience into revenue.",
      gradient: "from-pink-500 to-rose-600",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      title: "Built on Base",
      description: "Ethereum security with ~$0.01 gas fees. Fast, cheap, and fully decentralized.",
      gradient: "from-indigo-500 to-blue-600",
    },
  ];

  return (
    <section ref={ref} id="features" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-transparent" />
      <Container>
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpVariant} className="text-center mb-16">
            <Badge className="mb-4">Platform Features</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Video hosting, payments, chat, analytics — all built in. No plugins, no extra subscriptions.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUpVariant}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className={cn(
                  "inline-flex p-3 rounded-xl bg-gradient-to-br mb-4 text-white",
                  feature.gradient
                )}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      step: "01",
      title: "Connect Your Wallet",
      description: "Use MetaMask, Rainbow, or any Web3 wallet. Takes 10 seconds to get started.",
      icon: "🔗",
    },
    {
      step: "02",
      title: "Create Your Course",
      description: "Upload videos, write lessons, set your price. Your first course is completely free.",
      icon: "📝",
    },
    {
      step: "03",
      title: "Publish & Share",
      description: "Go live instantly. Share with your community and engage in course chat.",
      icon: "🚀",
    },
    {
      step: "04",
      title: "Get Paid Instantly",
      description: "92% of every sale hits your wallet immediately. No waiting, no minimums.",
      icon: "💰",
    },
  ];

  return (
    <section ref={ref} id="how-it-works" className="py-20 md:py-32">
      <Container>
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpVariant} className="text-center mb-16">
            <Badge className="mb-4">Simple Process</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              From Idea to Income in 4 Steps
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We've made it ridiculously simple to start earning from your knowledge.
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            {/* Connection line */}
            <div className="absolute top-0 left-[39px] md:left-1/2 md:-translate-x-px w-0.5 h-full bg-gradient-to-b from-primary/50 via-primary/20 to-transparent hidden sm:block" />

            <motion.div variants={staggerContainer} className="space-y-12">
              {steps.map((step, idx) => (
                <motion.div
                  key={step.step}
                  variants={fadeUpVariant}
                  className={cn(
                    "relative flex gap-6 md:gap-12",
                    idx % 2 === 1 && "md:flex-row-reverse"
                  )}
                >
                  {/* Step number */}
                  <div className="relative z-10 flex-shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-3xl shadow-lg shadow-primary/25"
                    >
                      {step.icon}
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className={cn(
                    "flex-1 pt-2",
                    idx % 2 === 1 && "md:text-right"
                  )}>
                    <span className="text-sm font-mono text-primary/60">Step {step.step}</span>
                    <h3 className="text-2xl font-bold mt-1 mb-2">{step.title}</h3>
                    <p className="text-muted-foreground max-w-md">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

function Pricing() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="pricing" className="py-20 md:py-32">
      <Container>
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpVariant} className="text-center mb-16">
            <Badge className="mb-4">Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No monthly fees. No hidden costs. Pay once, own forever.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            {/* Free tier */}
            <motion.div
              variants={fadeUpVariant}
              whileHover={{ y: -4 }}
              className="relative p-8 rounded-3xl bg-card border-2 border-primary shadow-xl"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">
                  Best for Starting
                </Badge>
              </div>
              <div className="pt-4">
                <h3 className="text-2xl font-bold mb-2">First Course</h3>
                <div className="mb-4">
                  <span className="text-6xl font-bold">Free</span>
                </div>
                <p className="text-muted-foreground mb-8">
                  Test the platform, build your audience, zero risk.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    "1 published course",
                    "Unlimited lessons & videos",
                    "Course chat & DMs",
                    "92% revenue share",
                    "Instant crypto payments",
                    "Referral earnings",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a href="https://app.skola.academy" className="block">
                  <Button size="lg" className="w-full shadow-lg shadow-primary/25">
                    Start Creating Free
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Pro tier */}
            <motion.div
              variants={fadeUpVariant}
              whileHover={{ y: -4 }}
              className="relative p-8 rounded-3xl bg-card border border-border/50"
            >
              <h3 className="text-2xl font-bold mb-2">Unlimited</h3>
              <div className="mb-4">
                <span className="text-6xl font-bold">$20</span>
                <span className="text-muted-foreground ml-2">one-time</span>
              </div>
              <p className="text-muted-foreground mb-8">
                For serious creators building a course catalog.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited courses",
                  "Everything in Free tier",
                  "Pay once, publish forever",
                  "Pay with ETH or USDC",
                  "Early supporter rewards",
                  "Priority support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a href="https://app.skola.academy" className="block">
                <Button size="lg" variant="outline" className="w-full">
                  Upgrade Anytime
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

function Comparison() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const platforms = [
    { name: "Udemy", revenue: "37%", fees: "None", payout: "30-60 days", highlight: false },
    { name: "Teachable", revenue: "90%", fees: "$39-119/mo", payout: "30 days", highlight: false },
    { name: "Kajabi", revenue: "100%", fees: "$149-399/mo", payout: "Weekly", highlight: false },
    { name: "Skola", revenue: "92%", fees: "$20 once", payout: "Instant", highlight: true },
  ];

  return (
    <section ref={ref} className="py-20 md:py-32 bg-muted/30">
      <Container>
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpVariant} className="text-center mb-16">
            <Badge className="mb-4">Comparison</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              See the Difference
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Compare Skola with traditional course platforms. The numbers speak for themselves.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUpVariant}
            className="max-w-4xl mx-auto overflow-x-auto"
          >
            <div className="min-w-[600px]">
              <div className="grid grid-cols-4 gap-4 mb-4 px-4">
                <div className="text-sm font-medium text-muted-foreground">Platform</div>
                <div className="text-sm font-medium text-muted-foreground">You Keep</div>
                <div className="text-sm font-medium text-muted-foreground">Monthly Fees</div>
                <div className="text-sm font-medium text-muted-foreground">Payout Speed</div>
              </div>
              <div className="space-y-3">
                {platforms.map((platform) => (
                  <motion.div
                    key={platform.name}
                    whileHover={{ x: 4 }}
                    className={cn(
                      "grid grid-cols-4 gap-4 p-4 rounded-xl transition-colors",
                      platform.highlight
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-card border border-border/50"
                    )}
                  >
                    <div className={cn("font-semibold", platform.highlight && "text-primary")}>
                      {platform.name}
                    </div>
                    <div className={cn(platform.highlight && "text-primary font-semibold")}>
                      {platform.revenue}
                    </div>
                    <div className="text-muted-foreground">{platform.fees}</div>
                    <div className={cn(platform.highlight && "text-primary font-semibold")}>
                      {platform.payout}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

function FAQ() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Do I need crypto experience to use Skola?",
      answer: "Not at all! If you can install a browser extension (MetaMask), you can use Skola. We've designed the platform to be as simple as any traditional website. Students can even browse courses without connecting a wallet.",
    },
    {
      question: "How do I get paid?",
      answer: "Payments go directly to your wallet the instant someone purchases your course. You can receive ETH or USDC. No waiting periods, no payment thresholds, no middlemen.",
    },
    {
      question: "Is my content protected?",
      answer: "Yes! Videos are served with signed, time-limited URLs. They can't be downloaded or shared. Only users who've purchased your course can access the content.",
    },
    {
      question: "What's the catch with the free first course?",
      answer: "No catch! We want you to try the platform risk-free. Create your first course, start earning, and only pay $20 if you want to publish more courses in the future.",
    },
    {
      question: "Why are fees so low compared to Udemy?",
      answer: "Traditional platforms have massive overhead: marketing, sales teams, payment processing fees. We're built on blockchain, so payments are near-instant and cost pennies. We pass those savings to you.",
    },
  ];

  return (
    <section ref={ref} className="py-20 md:py-32">
      <Container>
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpVariant} className="text-center mb-16">
            <Badge className="mb-4">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Common Questions
            </h2>
          </motion.div>

          <motion.div variants={staggerContainer} className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={fadeUpVariant}
                className="border border-border/50 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
                >
                  <span className="font-semibold">{faq.question}</span>
                  <motion.svg
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    className="w-5 h-5 flex-shrink-0 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-6 text-muted-foreground">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

function CTA() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-32">
      <Container>
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUpVariant}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-indigo-600 p-12 md:p-20"
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full bg-white/10"
              animate={{ rotate: 360 }}
              transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full bg-white/5"
              animate={{ rotate: -360 }}
              transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <div className="relative text-center text-white">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
              Ready to Start Teaching?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-10"
            >
              Your first course is free. No credit card, no commitment.
              Just connect your wallet and start creating.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a href="https://app.skola.academy">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 shadow-xl"
                >
                  Create Your First Course
                </Button>
              </a>
              <a href="https://github.com/SkolaDAO/monorepo#readme">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6"
                >
                  Read the Docs
                </Button>
              </a>
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();

  const links = {
    Product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Browse Courses", href: "https://app.skola.academy" },
    ],
    Resources: [
      { label: "Documentation", href: "https://github.com/SkolaDAO/monorepo/tree/main/apps/docs" },
      { label: "GitHub", href: "https://github.com/SkolaDAO/monorepo" },
    ],
    Community: [
      { label: "Discord", href: "https://discord.gg/5qec9N8xmY" },
      { label: "Twitter", href: "https://x.com/skoladao" },
      { label: "GitHub", href: "https://github.com/SkolaDAO" },
    ],
  };

  return (
    <footer className="border-t border-border py-16">
      <Container>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Skola" className="h-8 w-8" />
              <span className="text-xl font-bold">Skola</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-sm">
              The decentralized course marketplace. Create, teach, and earn on your terms.
            </p>
            <div className="flex gap-4">
              <a
                href="https://x.com/skoladao"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                aria-label="Twitter / X"
              >
                <FaXTwitter className="w-5 h-5" />
              </a>
              <a
                href="https://discord.gg/5qec9N8xmY"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                aria-label="Discord"
              >
                <FaDiscord className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/SkolaDAO"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                aria-label="GitHub"
              >
                <FaGithub className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-3">
                {items.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Skola. Built on Base.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            All systems operational
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default App;
