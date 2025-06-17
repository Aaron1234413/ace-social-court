
import { renderWithProviders } from '../../../utils/test-utils';
import SessionNavigationControls from '@/components/logging/session/SessionNavigationControls';
import { fireEvent } from '@testing-library/react';

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

  it('navigates to previous tab when previous button is clicked', () => {
    const { getByText } = renderWithProviders(
      <SessionNavigationControls
        currentTab="mental"
        onTabChange={mockOnTabChange}
      />
    );

    const previousButton = getByText('Previous');
    fireEvent.click(previousButton);

    expect(mockOnTabChange).toHaveBeenCalledWith('physical');
  });

  it('navigates to next tab when next button is clicked', () => {
    const { getByText } = renderWithProviders(
      <SessionNavigationControls
        currentTab="physical"
        onTabChange={mockOnTabChange}
      />
    );

    const nextButton = getByText('Next');
    fireEvent.click(nextButton);

    expect(mockOnTabChange).toHaveBeenCalledWith('mental');
  });

  it('follows correct tab order', () => {
    const expectedOrder = ['basics', 'coaches', 'physical', 'mental', 'technical', 'summary'];
    
    // Test moving forward through all tabs
    expectedOrder.forEach((currentTab, index) => {
      if (index < expectedOrder.length - 1) {
        const { getByText } = renderWithProviders(
          <SessionNavigationControls
            currentTab={currentTab}
            onTabChange={mockOnTabChange}
          />
        );

        const nextButton = getByText('Next');
        fireEvent.click(nextButton);

        expect(mockOnTabChange).toHaveBeenCalledWith(expectedOrder[index + 1]);
        mockOnTabChange.mockClear();
      }
    });
  });

  it('handles edge cases for tab navigation', () => {
    // Test that clicking previous on first tab doesn't call onTabChange
    const { getByText } = renderWithProviders(
      <SessionNavigationControls
        currentTab="basics"
        onTabChange={mockOnTabChange}
      />
    );

    const previousButton = getByText('Previous');
    expect(previousButton).toBeDisabled();
    fireEvent.click(previousButton);

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
