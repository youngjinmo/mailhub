import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { unlinkOAuth } from '@/lib/api';
import type { UserInfo } from '@/lib/api';
import { OAuthProvider } from '@/lib/oauth-provider.enum';
import { useToast } from '@/hooks/use-toast';

interface OAuthManagementProps {
  userInfo: UserInfo;
  onUpdate: () => void;
}

const providerLabels: Record<OAuthProvider, string> = {
  [OAuthProvider.GITHUB]: 'GitHub',
  [OAuthProvider.APPLE]: 'Apple',
  [OAuthProvider.GOOGLE]: 'Google',
};

const OAuthManagement = ({ userInfo, onUpdate }: OAuthManagementProps) => {
  const [unlinkProvider, setUnlinkProvider] = useState<OAuthProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const linkedProviders: { provider: OAuthProvider; linked: boolean }[] = [
    { provider: OAuthProvider.GITHUB, linked: userInfo.ghOauth },
    { provider: OAuthProvider.APPLE, linked: userInfo.aaplOauth },
    { provider: OAuthProvider.GOOGLE, linked: userInfo.googOauth },
  ];

  const hasAnyLinked = linkedProviders.some((p) => p.linked);
  if (!hasAnyLinked) return null;

  const handleUnlink = async () => {
    if (!unlinkProvider) return;
    setIsLoading(true);
    try {
      await unlinkOAuth(unlinkProvider);
      toast({
        title: 'OAuth Unlinked',
        description: `${providerLabels[unlinkProvider]} login has been unlinked from your account.`,
      });
      onUpdate();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to unlink OAuth',
      });
    } finally {
      setIsLoading(false);
      setUnlinkProvider(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {linkedProviders
          .filter((p) => p.linked)
          .map(({ provider }) => (
            <div key={provider} className="flex items-center justify-between">
              <span className="text-sm font-medium">{providerLabels[provider]} Login</span>
              <Button variant="outline" size="sm" onClick={() => setUnlinkProvider(provider)}>
                Unlink
              </Button>
            </div>
          ))}
      </div>

      <AlertDialog open={!!unlinkProvider} onOpenChange={() => setUnlinkProvider(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink OAuth Login</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink {unlinkProvider ? providerLabels[unlinkProvider] : ''}{' '}
              login? You can always link it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlink} disabled={isLoading}>
              {isLoading ? 'Unlinking...' : 'Yes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OAuthManagement;
