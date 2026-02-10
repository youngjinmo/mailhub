import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { checkAuth } from '@/lib/api';
import { Shield, Lock, Settings, Sparkles } from 'lucide-react';

const AboutPage = () => {
  const appName = import.meta.env.APP_NAME || 'Mailhub';
  const isLoggedIn = checkAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <Header isLoggedIn={isLoggedIn} />

      <main className="flex flex-1 flex-col px-4 py-16">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-3">Why Choose {appName}?</h1>
            <p className="text-lg text-muted-foreground">The best way to protect your email</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Protect Your Real Email</h3>
              <p className="text-sm text-muted-foreground">
                Keep your real email safe from untrusted sites. Use masked email addresses for
                signups and subscriptions.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Encrypted Storage</h3>
              <p className="text-sm text-muted-foreground">
                Your email address is encrypted on our servers. Nobody can access your real
                address.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Centralized Management</h3>
              <p className="text-sm text-muted-foreground">
                Manage all your mail subscriptions in one place. No need to unsubscribe from
                each platform individually.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">AI-Powered Summaries</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="inline-block px-2 py-0.5 text-xs bg-primary/20 rounded mb-1">
                    Coming Soon
                  </span>
                  <br />
                </p>
              </div>
              Save time with AI-generated email summaries.
            </div>
          </div>

          <div className="mt-12 p-6 rounded-lg bg-background border">
            <h3 className="font-semibold mb-3 text-center">Privacy and Transparency</h3>
            <p className="text-sm text-muted-foreground text-center">
              No data collection, no data sales. <br />
              Only encrypted email address are stored, and every line of code is open-source on
              Github, licensed under AGPL-3.0. <br />
              Visit our{' '}
              <a
                href="https://github.com/youngjinmo/private-mailhub"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: '#895BF5' }}
              >
                open-source repository
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
