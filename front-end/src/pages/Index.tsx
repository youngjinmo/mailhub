import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Shield,
  ShieldCheck,
  ShoppingBag,
  Lock,
  Newspaper,
  Briefcase,
  User,
  Check,
  X,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkAuth } from '@/lib/api';

const Index = () => {
  const appName = import.meta.env.APP_NAME || 'Mailhub';
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const isLoggedIn = checkAuth();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Handle scroll visibility for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <Header isLoggedIn={isLoggedIn} />

        <main className="flex flex-1 flex-col">
          {/* Original Hero Section */}
          <section
            id="top"
            className="relative flex flex-col items-center justify-center px-4 py-16 pb-8"
          >
            <div className="w-full max-w-4xl space-y-12">
              {/* Hero Text */}
              <div className="space-y-6 text-center">
                <p className="text-sm md:text-base font-medium text-primary uppercase tracking-wider">
                  Privacy-first email protection
                </p>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                  Your email stays yours
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Protect your email with masking
                  <br />
                  Manage all your emails in one place
                </p>
              </div>

              {/* Dashboard Preview Image */}
              <div className="max-w-5xl mx-auto">
                <div className="rounded-lg border bg-muted/50 shadow-2xl">
                  <img
                    src="/landing-main.png"
                    alt="main"
                    className="w-full h-auto rounded-md mx-auto"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Introduction Section */}
          <section className="bg-muted/30 px-4 py-16">
            <div className="container mx-auto max-w-5xl space-y-8">
              <div className="space-y-6 text-center">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                  Your Real Email Stays Hidden. Always.
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                  Create relay addresses for free up to 20 that forward to your inbox. When the spam
                  starts, just turn them off. Your real email never gets exposed.
                </p>
              </div>

              {/* Intro Image */}
              <div className="max-w-4xl mx-auto">
                <div className="rounded-lg border bg-background shadow-xl overflow-hidden">
                  <img src="/landing-section-2.png" alt="dashboard" className="w-full h-auto" />
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex justify-center">
                <Button size="lg" onClick={() => navigate('/login')} className="text-lg px-8 py-6">
                  Get Started Free
                </Button>
              </div>
            </div>
          </section>

          {/* Two Steps Section */}
          <section className="bg-muted/30 px-4 py-16">
            <div className="container mx-auto max-w-5xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  Two Steps to a Spam-Free Life
                </h2>
              </div>

              <div className="grid gap-12 md:grid-cols-2">
                {/* Step 1 */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Step 1: Create a Relay Address</h3>
                      <p className="text-muted-foreground">
                        Generate a unique email address like{' '}
                        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          shop.7x9k@private-mailhub.com
                        </span>{' '}
                        in one click. Use it anywhere a website asks for your email.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 overflow-hidden">
                    <img
                      src="/landing-step1.png"
                      alt="create a relay address"
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        Step 2: Receive Emails Seamlessly
                      </h3>
                      <p className="text-muted-foreground">
                        Every email sent to your relay address is instantly forwarded to your real
                        inbox. Read them as usual—senders never see your actual email.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 overflow-hidden">
                    <img
                      src="/landing-step2.png"
                      alt="receive emails seamlessly"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Built for People Section */}
          <section className="px-4 py-16">
            <div className="container mx-auto max-w-5xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  Built for People Who Value Their Privacy
                </h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                  <ShoppingBag className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Online shoppers</h3>
                    <p className="text-sm text-muted-foreground">
                      Tired of promotional spam flooding your inbox after every purchase
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                  <Lock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Privacy-conscious users</h3>
                    <p className="text-sm text-muted-foreground">
                      Don't want to hand over their real email to every service they try
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                  <Newspaper className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Newsletter subscribers</h3>
                    <p className="text-sm text-muted-foreground">
                      Want to easily unsubscribe by simply disabling an address
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                  <Briefcase className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Freelancers and creators</h3>
                    <p className="text-sm text-muted-foreground">
                      Need separate addresses for different clients or projects
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg border bg-card md:col-span-2 lg:col-span-1">
                  <User className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Anyone</h3>
                    <p className="text-sm text-muted-foreground">
                      Who has ever regretted giving out their email address
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Comparison Table Section */}
          <section className="bg-muted/30 px-4 py-16">
            <div className="container mx-auto max-w-5xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">Why choose {appName}?</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-background rounded-lg overflow-hidden shadow-lg">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-center p-4 font-semibold text-primary">{appName}</th>
                      <th className="text-center p-4 font-semibold">Apple Hide My Email</th>
                      <th className="text-center p-4 font-semibold">Firefox Relay</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">Free relay addresses</td>
                      <td className="text-center p-4">
                        <span className="font-bold text-primary">20</span>
                      </td>
                      <td className="text-center p-4">
                        <div className="flex flex-col items-center gap-1">
                          <span>Unlimited*</span>
                        </div>
                      </td>
                      <td className="text-center p-4">5</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">Encryption personal information</td>
                      <td className="text-center p-4">
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      </td>
                      <td className="text-center p-4">
                        <X className="h-5 w-5 text-muted-foreground mx-auto" />
                      </td>
                      <td className="text-center p-4">
                        <X className="h-5 w-5 text-muted-foreground mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">Unlimited forwarding</td>
                      <td className="text-center p-4">
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      </td>
                      <td className="text-center p-4">
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      </td>
                      <td className="text-center p-4">
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">Browser extension</td>
                      <td className="text-center p-4">
                        <span className="text-sm text-muted-foreground">Coming Soon</span>
                      </td>
                      <td className="text-center p-4">
                        <span className="text-sm text-muted-foreground">Safari only</span>
                      </td>
                      <td className="text-center p-4">
                        <span className="text-sm text-muted-foreground">Chrome/Firefox</span>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">Platform restriction</td>
                      <td className="text-center p-4">
                        <span className="font-semibold text-primary">None</span>
                      </td>
                      <td className="text-center p-4">
                        <span className="text-sm text-muted-foreground">Apple devices only</span>
                      </td>
                      <td className="text-center p-4">
                        <span className="text-sm text-muted-foreground">None</span>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">Open source</td>
                      <td className="text-center p-4">
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      </td>
                      <td className="text-center p-4">
                        <X className="h-5 w-5 text-muted-foreground mx-auto" />
                      </td>
                      <td className="text-center p-4">
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">Price</td>
                      <td className="text-center p-4">
                        <span className="font-bold text-primary">Free</span>
                      </td>
                      <td className="text-center p-4">
                        <span className="text-sm text-muted-foreground">
                          iCloud+ required ($0.99+/mo)
                        </span>
                      </td>
                      <td className="text-center p-4">
                        <span className="text-sm text-muted-foreground">Free / $1.99/mo</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-muted-foreground mt-4 text-center">
                *Unlimited only with iCloud+ subscription. Free tier limited to Sign in with Apple
                usage only.
              </p>
            </div>
          </section>

          {/* Security Section */}
          <section className="px-4 py-16">
            <div className="container mx-auto max-w-5xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  How We Protect Your Information
                </h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-6 rounded-lg border bg-card">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Encryption</h3>
                      <p className="text-sm text-muted-foreground">
                        Your primary email address is protected with AES-256 encryption
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-lg border bg-card">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">SPF/DKIM/DMARC</h3>
                      <p className="text-sm text-muted-foreground">
                        Industry-standard email authentication prevents spoofing
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-lg border bg-card">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Rate Limiting</h3>
                      <p className="text-sm text-muted-foreground">
                        Protection against abuse and spam attacks
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-lg border bg-card">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Open Source</h3>
                      <p className="text-sm text-muted-foreground">
                        Full transparency—see exactly how your data is handled
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section className="bg-muted/30 px-4 py-16">
            <div className="container mx-auto max-w-3xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">Pricing</h2>
              </div>

              <div className="p-8 rounded-lg border bg-card text-center space-y-4">
                <p className="text-lg text-muted-foreground">
                  All features are available for{' '}
                  <span className="font-bold text-[#895BF5]">free</span> during the beta period.
                </p>
                <p className="text-base text-muted-foreground">
                  The features currently available will remain free even after the official launch.
                </p>
              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="px-4 py-16">
            <div className="container mx-auto max-w-3xl text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">
                Sign in to take control of your inbox
              </h2>
              <p className="text-lg text-muted-foreground">
                Getting started takes just a few seconds.
              </p>
              <Button size="lg" onClick={() => navigate('/login')} className="text-lg px-8 py-6">
                Get Started Free
              </Button>
            </div>
          </section>
        </main>

        <Footer />

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Button
            variant="default"
            size="icon"
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 rounded-full shadow-lg z-50"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    </>
  );
};

export default Index;
