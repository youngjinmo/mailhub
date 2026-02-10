import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const appName = import.meta.env.APP_NAME || 'Mailhub';
  const appDomain = import.meta.env.APP_DOMAIN || 'private-mailhub.com';

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-y-4 gap-x-6 py-6 px-4">
        <p className="text-sm text-muted-foreground">
          © {currentYear} {appName}. All rights reserved.
        </p>

        <div className="flex items-center gap-4">
          <Link
            to="/privacy"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>
          <a
            href={`mailto:contact@${appDomain}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            contact@{appDomain}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
