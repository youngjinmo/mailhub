import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getAdminDashboard, checkAuth, logout } from '@/lib/api';
import type { AdminDashboardStats } from '@/lib/api';

const AdminPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!checkAuth()) {
        navigate('/');
        return;
      }

      try {
        const data = await getAdminDashboard();
        setStats(data);
      } catch (error) {
        if (error instanceof Error && error.message === 'Access denied') {
          setAccessDenied(true);
        } else {
          console.error('Failed to fetch admin dashboard:', error);
          await logout();
          navigate('/');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isLoggedIn={true} onLogout={handleLogout} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isLoggedIn={true} onLogout={handleLogout} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">
              You do not have permission to view this page.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header isLoggedIn={true} onLogout={handleLogout} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Users</h2>
            <p>Total: {stats.users.total}</p>
            <p>Last 28 days: {stats.users.last28Days}</p>
            <p>Last 7 days: {stats.users.last7Days}</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Relay Emails</h2>
            <p>Total: {stats.relayEmails.total}</p>
            <p>Last 28 days: {stats.relayEmails.last28Days}</p>
            <p>Last 7 days: {stats.relayEmails.last7Days}</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Forward Count</h2>
            <p>Total: {stats.forwardCount.total}</p>
            <p>Last 28 days: {stats.forwardCount.last28Days}</p>
            <p>Last 7 days: {stats.forwardCount.last7Days}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;
