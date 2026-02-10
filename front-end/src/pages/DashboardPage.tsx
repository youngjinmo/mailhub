import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RelayEmailDashboard from '@/components/RelayEmailDashboard';
import { getUsernameFromToken, logout } from '@/lib/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const username = await getUsernameFromToken();
      if (username) {
        setUserEmail(username);
      } else {
        await logout();
        navigate('/login', { replace: true });
      }
      setIsLoading(false);
    };

    initAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return <RelayEmailDashboard userEmail={userEmail} />;
};

export default DashboardPage;
