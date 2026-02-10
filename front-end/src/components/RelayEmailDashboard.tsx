import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import RelayEmailCard from './RelayEmailCard';
import Header from './Header';
import Footer from './Footer';
import { toast } from 'sonner';
import {
  getRelayEmails,
  createRelayEmail,
  updateRelayEmailDescription,
  updateRelayEmailActiveStatus,
} from '@/lib/api';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

interface RelayEmailDashboardProps {
  userEmail: string;
  onLogout?: () => void;
}

const ITEMS_PER_PAGE = 5;

const RelayEmailDashboard = ({ userEmail }: RelayEmailDashboardProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Fetch relay emails
  const { data: relayEmails = [], isLoading } = useQuery({
    queryKey: ['relayEmails'],
    queryFn: getRelayEmails,
  });

  // Create relay email mutation
  const createMutation = useMutation({
    mutationFn: () => createRelayEmail(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relayEmails'] });
      setCurrentPage(1);
      toast.success('Private email created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create private email');
    },
  });

  // Update description mutation
  const updateDescriptionMutation = useMutation({
    mutationFn: ({ id, description }: { id: string; description: string }) =>
      updateRelayEmailDescription(id, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relayEmails'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update description');
    },
  });

  // Update active status mutation
  const updateActiveStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateRelayEmailActiveStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relayEmails'] });
      toast.success('Status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await createMutation.mutateAsync();
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = (id: string, isActive: boolean) => {
    updateActiveStatusMutation.mutate({ id, isActive });
  };

  const handleUpdateDescription = async (id: string, description: string) => {
    await updateDescriptionMutation.mutateAsync({ id, description });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header isLoggedIn={true} />

      <main className="flex-1 w-full max-w-2xl mx-auto p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Private Emails</h1>
          <p className="text-sm text-muted-foreground">{userEmail}</p>
        </div>

        <Button onClick={handleCreate} disabled={isCreating} className="w-full h-12">
          <Plus className="h-5 w-5 mr-2" />
          {isCreating ? 'Creating...' : 'Create New Private Email'}
        </Button>

        {(() => {
          const totalPages = Math.ceil(relayEmails.length / ITEMS_PER_PAGE);
          const safePage = Math.min(currentPage, totalPages || 1);
          const paginatedEmails = relayEmails.slice(
            (safePage - 1) * ITEMS_PER_PAGE,
            safePage * ITEMS_PER_PAGE,
          );

          const getPageNumbers = () => {
            const pages: (number | 'ellipsis')[] = [];
            if (totalPages <= 5) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              pages.push(1);
              if (safePage > 3) pages.push('ellipsis');
              const start = Math.max(2, safePage - 1);
              const end = Math.min(totalPages - 1, safePage + 1);
              for (let i = start; i <= end; i++) pages.push(i);
              if (safePage < totalPages - 2) pages.push('ellipsis');
              pages.push(totalPages);
            }
            return pages;
          };

          if (isLoading) {
            return (
              <div className="text-center py-12 text-muted-foreground">
                <p>Loading private emails...</p>
              </div>
            );
          }

          if (relayEmails.length === 0) {
            return (
              <div className="text-center py-12 text-muted-foreground">
                <p>No private emails created yet.</p>
                <p className="text-sm mt-1">Click the button above to create a new relay email.</p>
              </div>
            );
          }

          return (
            <>
              <div className="space-y-3">
                {paginatedEmails.map((relayEmail) => (
                  <RelayEmailCard
                    key={relayEmail.id}
                    email={relayEmail.relayEmail}
                    description={relayEmail.description}
                    isActive={relayEmail.isActive}
                    onToggle={(active) => handleToggle(relayEmail.id, active)}
                    onUpdateDescription={(description) =>
                      handleUpdateDescription(relayEmail.id, description)
                    }
                  />
                ))}
              </div>

              {relayEmails.length > 0 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={
                          safePage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>

                    {getPageNumbers().map((page, idx) =>
                      page === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === safePage}
                            onClick={() => setCurrentPage(page)}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={
                          safePage >= totalPages
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          );
        })()}
      </main>

      <Footer />
    </div>
  );
};

export default RelayEmailDashboard;
