
import { renderWithProviders } from '../../utils/test-utils';
import { ReactionBar } from '@/components/social/ReactionBar';
import { mockPosts } from '../../mocks/data/posts';
import { mockUsers } from '../../mocks/data/users';
import { mockSupabase } from '../../mocks/supabase';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ReactionBar', () => {
  const mockPost = mockPosts.standard();
  const mockUser = mockUsers.player();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful reaction fetch
    mockSupabase.from().select().eq().mockResolvedValue({
      data: [],
      error: null
    });
  });

  it('renders all reaction buttons', () => {
    const { getByTitle } = renderWithProviders(
      <ReactionBar post={mockPost} />,
      { user: mockUser }
    );

    expect(getByTitle(/heart/i)).toBeInTheDocument();
    expect(getByTitle(/fire/i)).toBeInTheDocument();
    expect(getByTitle(/tip/i)).toBeInTheDocument();
    expect(getByTitle(/trophy/i)).toBeInTheDocument();
  });

  it('shows disabled state for fallback content', () => {
    const fallbackPost = { ...mockPost, is_fallback_content: true };
    
    const { getByTitle } = renderWithProviders(
      <ReactionBar post={fallbackPost} />,
      { user: mockUser }
    );

    const heartButton = getByTitle(/heart/i);
    expect(heartButton).toBeDisabled();
  });

  it('handles heart reaction correctly', async () => {
    const user = userEvent.setup();
    mockSupabase.from().insert().select().mockResolvedValue({
      data: [{ id: '1', reaction_type: 'heart' }],
      error: null
    });

    const { getByTitle } = renderWithProviders(
      <ReactionBar post={mockPost} />,
      { user: mockUser }
    );

    const heartButton = getByTitle(/heart/i);
    
    await user.click(heartButton);

    await waitFor(() => {
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        post_id: mockPost.id,
        user_id: mockUser.id,
        reaction_type: 'heart',
        has_comment: false
      });
    });
  });

  it('shows tip modal for tip reactions', async () => {
    const user = userEvent.setup();
    const { getByTitle, getByText } = renderWithProviders(
      <ReactionBar post={mockPost} />,
      { user: mockUser }
    );

    const tipButton = getByTitle(/tip/i);
    await user.click(tipButton);

    await waitFor(() => {
      expect(getByText(/add your coaching tip/i)).toBeInTheDocument();
    });
  });

  it('displays correct reaction counts', async () => {
    mockSupabase.from().select().eq().mockResolvedValue({
      data: [
        { reaction_type: 'heart' },
        { reaction_type: 'heart' },
        { reaction_type: 'fire' }
      ],
      error: null
    });

    const { getByText } = renderWithProviders(
      <ReactionBar post={mockPost} />,
      { user: mockUser }
    );

    await waitFor(() => {
      expect(getByText('2')).toBeInTheDocument(); // heart count
      expect(getByText('1')).toBeInTheDocument(); // fire count
    });
  });

  it('shows private post message for private content', () => {
    const privatePost = { 
      ...mockPost, 
      privacy_level: 'private' as const,
      author_id: 'different-user-id'
    };

    const { getByText } = renderWithProviders(
      <ReactionBar post={privatePost} />,
      { user: mockUser }
    );

    expect(getByText(/this post is private/i)).toBeInTheDocument();
  });

  it('handles reaction removal', async () => {
    const user = userEvent.setup();
    // Mock user already has a heart reaction
    mockSupabase.from().select().eq().mockResolvedValueOnce({
      data: [{ reaction_type: 'heart' }], // reaction counts
      error: null
    }).mockResolvedValueOnce({
      data: [{ reaction_type: 'heart' }], // user reactions
      error: null
    });

    mockSupabase.from().delete().eq().select().mockResolvedValue({
      data: [{ id: '1' }],
      error: null
    });

    const { getByTitle } = renderWithProviders(
      <ReactionBar post={mockPost} />,
      { user: mockUser }
    );

    await waitFor(() => {
      const heartButton = getByTitle(/heart/i);
      expect(heartButton).toHaveClass('bg-red-100'); // active state
    });

    const heartButton = getByTitle(/heart/i);
    await user.click(heartButton);

    await waitFor(() => {
      expect(mockSupabase.from().delete).toHaveBeenCalled();
    });
  });
});
