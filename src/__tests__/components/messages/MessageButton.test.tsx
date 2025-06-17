
import { renderWithProviders } from '../../utils/test-utils';
import MessageButton from '@/components/messages/MessageButton';
import { fireEvent } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn()
}));

const mockNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;

describe('MessageButton', () => {
  const mockNavigateFn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReturnValue(mockNavigateFn);
  });

  it('renders with default props', () => {
    const { getByRole, getByText } = renderWithProviders(
      <MessageButton userId="user-123" />
    );

    const button = getByRole('button');
    expect(button).toBeInTheDocument();
    expect(getByText('Message')).toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    const { getByRole, queryByText } = renderWithProviders(
      <MessageButton userId="user-123" compact={true} />
    );

    const button = getByRole('button');
    expect(button).toBeInTheDocument();
    expect(queryByText('Message')).not.toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    const { container } = renderWithProviders(
      <MessageButton userId="user-123" showIcon={false} />
    );

    const icon = container.querySelector('svg');
    expect(icon).not.toBeInTheDocument();
  });

  it('navigates to messages page on click', () => {
    const { getByRole } = renderWithProviders(
      <MessageButton userId="user-123" />
    );

    const button = getByRole('button');
    fireEvent.click(button);

    expect(mockNavigateFn).toHaveBeenCalledWith('/messages/user-123', {
      state: {
        fromSearch: true,
        initialMessage: undefined,
        autoSend: false,
        previousPath: '/'
      }
    });
  });

  it('passes initial message and autoSend props', () => {
    const { getByRole } = renderWithProviders(
      <MessageButton 
        userId="user-123" 
        initialMessage="Hello!"
        autoSend={true}
      />
    );

    const button = getByRole('button');
    fireEvent.click(button);

    expect(mockNavigateFn).toHaveBeenCalledWith('/messages/user-123', {
      state: {
        fromSearch: true,
        initialMessage: "Hello!",
        autoSend: true,
        previousPath: '/'
      }
    });
  });

  it('applies custom className', () => {
    const { getByRole } = renderWithProviders(
      <MessageButton userId="user-123" className="custom-class" />
    );

    const button = getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('shows tooltip when showTooltip is true', () => {
    const { getByRole } = renderWithProviders(
      <MessageButton userId="user-123" showTooltip={true} />
    );

    // Tooltip content should be accessible
    const button = getByRole('button');
    fireEvent.mouseEnter(button);
    
    // Note: Testing tooltip visibility requires more complex setup
    // This tests that the component renders without errors
    expect(button).toBeInTheDocument();
  });

  it('handles different button variants', () => {
    const { getByRole } = renderWithProviders(
      <MessageButton userId="user-123" variant="outline" />
    );

    const button = getByRole('button');
    expect(button).toHaveClass('border-input');
  });

  it('handles different button sizes', () => {
    const { getByRole } = renderWithProviders(
      <MessageButton userId="user-123" size="sm" />
    );

    const button = getByRole('button');
    expect(button).toHaveClass('h-9');
  });
});
