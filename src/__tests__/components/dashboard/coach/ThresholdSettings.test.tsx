
import { renderWithProviders } from '../../../utils/test-utils';
import { ThresholdSettings } from '@/components/dashboard/coach/ThresholdSettings';
import { fireEvent, waitFor } from '@testing-library/react';
import { AlertThresholds } from '@/services/AlertEngine';

describe('ThresholdSettings', () => {
  const defaultThresholds: AlertThresholds = {
    rosterSize: 8,
    missedSessionThreshold: 2,
    neverPostedThreshold: 7,
    consecutiveThreshold: 3
  };

  const mockOnUpdateThresholds = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays current threshold explanation', () => {
    const { getByText } = renderWithProviders(
      <ThresholdSettings 
        currentThresholds={defaultThresholds}
        onUpdateThresholds={mockOnUpdateThresholds}
      />
    );

    expect(getByText(/alert after 2 missed sessions/i)).toBeInTheDocument();
  });

  it('opens settings dialog when clicked', async () => {
    const { getByRole } = renderWithProviders(
      <ThresholdSettings 
        currentThresholds={defaultThresholds}
        onUpdateThresholds={mockOnUpdateThresholds}
      />
    );

    const settingsButton = getByRole('button');
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('displays auto-scaled threshold information', async () => {
    const { getByRole, getByText } = renderWithProviders(
      <ThresholdSettings 
        currentThresholds={defaultThresholds}
        onUpdateThresholds={mockOnUpdateThresholds}
      />
    );

    fireEvent.click(getByRole('button'));

    await waitFor(() => {
      expect(getByText('8 students')).toBeInTheDocument();
      expect(getByText('2 sessions')).toBeInTheDocument();
      expect(getByText('7 days')).toBeInTheDocument();
    });
  });

  it('enables custom threshold mode', async () => {
    const { getByRole, getByLabelText } = renderWithProviders(
      <ThresholdSettings 
        currentThresholds={defaultThresholds}
        onUpdateThresholds={mockOnUpdateThresholds}
      />
    );

    fireEvent.click(getByRole('button'));

    await waitFor(() => {
      const customToggle = getByLabelText(/custom thresholds/i);
      fireEvent.click(customToggle);
    });

    await waitFor(() => {
      expect(getByLabelText(/custom mode active/i)).toBeInTheDocument();
    });
  });

  it('adjusts custom thresholds with sliders', async () => {
    const { getByRole, getByLabelText, getByText } = renderWithProviders(
      <ThresholdSettings 
        currentThresholds={defaultThresholds}
        onUpdateThresholds={mockOnUpdateThresholds}
      />
    );

    fireEvent.click(getByRole('button'));

    await waitFor(() => {
      const customToggle = getByLabelText(/custom thresholds/i);
      fireEvent.click(customToggle);
    });

    await waitFor(() => {
      const slider = getByLabelText(/missed sessions alert/i).nextElementSibling;
      fireEvent.change(slider, { target: { value: '5' } });
    });

    expect(getByText(/5 sessions/)).toBeInTheDocument();
  });

  it('saves custom thresholds when confirmed', async () => {
    const { getByRole, getByLabelText, getByText } = renderWithProviders(
      <ThresholdSettings 
        currentThresholds={defaultThresholds}
        onUpdateThresholds={mockOnUpdateThresholds}
      />
    );

    fireEvent.click(getByRole('button'));

    await waitFor(() => {
      const customToggle = getByLabelText(/custom thresholds/i);
      fireEvent.click(customToggle);
    });

    await waitFor(() => {
      const saveButton = getByText(/save settings/i);
      fireEvent.click(saveButton);
    });

    expect(mockOnUpdateThresholds).toHaveBeenCalledWith({
      missedSessionThreshold: 2,
      neverPostedThreshold: 7,
      consecutiveThreshold: 3
    });
  });

  it('cancels changes without saving', async () => {
    const { getByRole, getByText } = renderWithProviders(
      <ThresholdSettings 
        currentThresholds={defaultThresholds}
        onUpdateThresholds={mockOnUpdateThresholds}
      />
    );

    fireEvent.click(getByRole('button'));

    await waitFor(() => {
      const cancelButton = getByText(/cancel/i);
      fireEvent.click(cancelButton);
    });

    expect(mockOnUpdateThresholds).not.toHaveBeenCalled();
  });

  it('shows recommended thresholds for different roster sizes', async () => {
    const smallRosterThresholds = { ...defaultThresholds, rosterSize: 3 };
    
    const { getByRole, getByText } = renderWithProviders(
      <ThresholdSettings 
        currentThresholds={smallRosterThresholds}
        onUpdateThresholds={mockOnUpdateThresholds}
      />
    );

    fireEvent.click(getByRole('button'));

    await waitFor(() => {
      expect(getByText(/small groups.*alert after 1 missed session/i)).toBeInTheDocument();
    });
  });
});
