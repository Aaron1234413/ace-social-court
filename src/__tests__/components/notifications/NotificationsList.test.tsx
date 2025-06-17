
import { renderWithProviders } from '../../utils/test-utils';
import NotificationsList from '@/components/notifications/NotificationsList';
import { mockSupabase } from '../../mocks/supabase';
import { mockUsers } from '../../mocks/data/users';
import { waitFor } from '@testing-library/react';

describe('NotificationsList', () => {
  const mockUser = mockUsers.player();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockSupabase.from().select().eq().mockReturnValue({
      data: null,
      error: null,
      loading: true
    });

    const { getByTestId } = renderWithProviders(
      <NotificationsList />,
      { user: mockUser }
    );

    expect(getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('shows empty state when no notifications', async () => {
    mockSupabase.from().select().eq().mockResolvedValue({
      data: [],
      error: null
    });

    const { getByText } = renderWithProviders(
      <NotificationsList />,
      { user: mockUser }
    );

    await waitFor(() => {
      expect(getByText(/no notifications yet/i)).toBeInTheDocument();
    });
  });

  it('displays notifications list', async () => {
    const mockNotifications = [
      {
        id: '1',
        type: 'follow',
        content: 'John started following you',
        created_at: new Date().toISOString(),
        read: false,
        sender_id: 'sender-1',
        entity_id: null,
        entity_type: null,
        sender: {
          avatar_url: 'https://example.com/avatar.jpg',
          username: 'john_doe',
          full_name: 'John Doe'
        }
      },
      {
        id: '2',
        type: 'like',
        content: 'Sarah liked your post',
        created_at: new Date().toISOString(),
        read: true,
        sender_id: 'sender-2',
        entity_id: 'post-1',
        entity_type: 'post',
        sender: {
          avatar_url: null,
          username: 'sarah_wilson',
          full_name: 'Sarah Wilson'
        }
      }
    ];

    mockSupabase.from().select().eq().mockResolvedValue({
      data: mockNotifications,
      error: null
    });

    const { getByText } = renderWithProviders(
      <NotificationsList />,
      { user: mockUser }
    );

    await waitFor(() => {
      expect(getByText('John started following you')).toBeInTheDocument();
      expect(getByText('Sarah liked your post')).toBeInTheDocument();
    });
  });

  it('filters unread notifications when filterUnread is true', async () => {
    const mockNotifications = [
      {
        id: '1',
        type: 'follow',
        content: 'John started following you',
        created_at: new Date().toISOString(),
        read: false,
        sender_id: 'sender-1',
        entity_id: null,
        entity_type: null
      },
      {
        id: '2',
        type: 'like',
        content: 'Sarah liked your post',
        created_at: new Date().toISOString(),
        read: true,
        sender_id: 'sender-2',
        entity_id: 'post-1',
        entity_type: 'post'
      }
    ];

    mockSupabase.from().select().eq().mockResolvedValue({
      data: [mockNotifications[0]], // Only unread
      error: null
    });

    const { getByText, queryByText } = renderWithProviders(
      <NotificationsList filterUnread={true} />,
      { user: mockUser }
    );

    await waitFor(() => {
      expect(getByText('John started following you')).toBeInTheDocument();
      expect(queryByText('Sarah liked your post')).not.toBeInTheDocument();
    });
  });

  it('calls onNotificationRead when notification is marked as read', async () => {
    const mockOnNotificationRead = jest.fn();
    const mockNotifications = [
      {
        id: '1',
        type: 'follow',
        content: 'John started following you',
        created_at: new Date().toISOString(),
        read: false,
        sender_id: 'sender-1',
        entity_id: null,
        entity_type: null
      }
    ];

    mockSupabase.from().select().eq().mockResolvedValue({
      data: mockNotifications,
      error: null
    });

    mockSupabase.from().update().eq().mockResolvedValue({
      data: [{ ...mockNotifications[0], read: true }],
      error: null
    });

    const { getByTitle } = renderWithProviders(
      <NotificationsList onNotificationRead={mockOnNotificationRead} />,
      { user: mockUser }
    );

    await waitFor(() => {
      const markReadButton = getByTitle(/mark as read/i);
      markReadButton.click();
    });

    await waitFor(() => {
      expect(mockOnNotificationRead).toHaveBeenCalled();
    });
  });

  it('returns null when user is not authenticated', () => {
    const { container } = renderWithProviders(
      <NotificationsList />,
      { user: null }
    );

    expect(container.firstChild).toBeNull();
  });

  it('handles loading errors gracefully', async () => {
    mockSupabase.from().select().eq().mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' }
    });

    const { getByText } = renderWithProviders(
      <NotificationsList />,
      { user: mockUser }
    );

    await waitFor(() => {
      expect(getByText(/error loading/i)).toBeInTheDocument();
    });
  });
});
