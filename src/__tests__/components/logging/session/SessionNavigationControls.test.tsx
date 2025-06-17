
import { renderWithProviders } from '../../../utils/test-utils';
import SessionNavigationControls from '@/components/logging/session/SessionNavigationControls';
import userEvent from '@testing-library/user-event';

describe('SessionNavigationControls', () => {
  const mockOnTabChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders previous and next buttons', () => {
    const { getByText } = renderWithProviders(
      <SessionNavigationControls
        currentTab="physical"
        onTabChange={mockOnTabChange}
      />
    );

    expect(getByText('Previous')).toBeInTheDocument();
    expect(getByText('Next')).toBeInTheDocument();
  });

  it('disables previous button on first tab', () => {
    const { getByText } = renderWithProviders(
      <SessionNavigationControls
        currentTab="basics"
        onTabChange={mockOnTabChange}
        isFirstTab={true}
      />
    );

    const previousButton = getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('hides next button on last tab', () => {
    const { queryByText } = renderWithProviders(
      <SessionNavigationControls
        currentTab="summary"
        onTabChange={mockOnTabChange}
        isLastTab={true}
      />
    );

    expect(queryByText('Next')).not.toBeInTheDocument();
  });

  it('disables next button when canProceed is false', () => {
    const { getByText } = renderWithProviders(
      <SessionNavigationControls
        currentTab="physical"
        onTabChange={mockOnTabChange}
        canProceed={false}
      />
    );

    const nextButton = getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('navigates to previous tab when previous button is clicked', async () => {
    const user = userEvent.setup();
    const { getByText } = renderWithProviders(
      <SessionNavigationControls
        currentTab="mental"
        onTabChange={mockOnTabChange}
      />
    );

    const previousButton = getByText('Previous');
    await user.click(previousButton);

    expect(mockOnTabChange).toHaveBeenCalledWith('physical');
  });

  it('navigates to next tab when next button is clicked', async () => {
    const user = userEvent.setup();
    const { getByText } = renderWithProviders(
      <SessionNavigationControls
        currentTab="physical"
        onTabChange={mockOnTabChange}
      />
    );

    const nextButton = getByText('Next');
    await user.click(nextButton);

    expect(mockOnTabChange).toHaveBeenCalledWith('mental');
  });

  it('follows correct tab order', async () => {
    const user = userEvent.setup();
    const expectedOrder = ['basics', 'coaches', 'physical', 'mental', 'technical', 'summary'];
    
    // Test moving forward through all tabs
    for (let i = 0; i < expectedOrder.length - 1; i++) {
      const currentTab = expectedOrder[i];
      const { getByText } = renderWithProviders(
        <SessionNavigationControls
          currentTab={currentTab}
          onTabChange={mockOnTabChange}
        />
      );

      const nextButton = getByText('Next');
      await user.click(nextButton);

      expect(mockOnTabChange).toHaveBeenCalledWith(expectedOrder[i + 1]);
      mockOnTabChange.mockClear();
    }
  });

  it('handles edge cases for tab navigation', async () => {
    const user = userEvent.setup();
    // Test that clicking previous on first tab doesn't call onTabChange
    const { getByText } = renderWithProviders(
      <SessionNavigationControls
        currentTab="basics"
        onTabChange={mockOnTabChange}
      />
    );

    const previousButton = getByText('Previous');
    expect(previousButton).toBeDisabled();
    await user.click(previousButton);

    expect(mockOnTabChange).not.toHaveBeenCalled();
  });

  it('shows correct button states for middle tabs', () => {
    const { getByText } = renderWithProviders(
      <SessionNavigationControls
        currentTab="mental"
        onTabChange={mockOnTabChange}
        canProceed={true}
      />
    );

    const previousButton = getByText('Previous');
    const nextButton = getByText('Next');

    expect(previousButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });
});
