
import { renderWithProviders } from '../../../utils/test-utils';
import { ThresholdSettings } from '@/components/dashboard/coach/ThresholdSettings';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/dom';
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
    const user = userEvent.setup();
    const { getByRole } = renderWithProviders(
      <ThresholdSettings 
        currentThresholds={defaultThresholds}
        onUpdateThresholds={mockOnUpdateThresholds}
      />
    );

    const settingsButton = getByRole('button');
    await user.click(settingsButton);

    await waitFor(() => {
      expect(getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('displays auto-scaled threshold information', async () => {
    const user = userEvent.setup();
    const { getByRole, getByText } = renderWithProviders(
      <ThresholdSettings 
        currentThresholds={defaultThresholds}
        onUpdateThresholds={mockOnUpdateThresholds}
      />
    );

    await user.click(getByRole('button'));

    await waitFor(() => {
      expect(getByText('8 students')).toBeInTheDocument();
      expect(getByText('2 sessions')).toBeInTheDocument();
      expect(getByText('7 days')).toBeInTheDocument();
    });
  });

  it('enables custom threshold mode', async () => {
    const user = userEvent.setup();
    const { getByRole, getByLabelText } = renderWithProviders(
      <ThresholdSettings 
        currentThresholds={defaultThresholds}
        onUpdateThresholds={mockOnUpdateThresholds}
      />
    );

    await user.click(getByRole('button'));

    await waitFor(() => {
      const customToggle = getByLabelText(/custom thresholds/i);
      return user.click(customToggle);
    });

    await waitFor(() => {
      expect(getByLabelText(/custom mode active/i)).toBeInTheDocument();
    });
  });

  it('adjusts custom thresholds with sliders', async () => {
    const user = userEvent.setup();
    const { getByRole, getByLabelText, getByText } = renderWithProviders(
      <ThresholdSettings 
        currentThresholds={defaultThresholds}
        onUpdateThresholds={mockOnUpdateThresholds}
      />
    );

    await user.click(getByRole('button'));

    await waitFor(() => {
      const customToggle = getByLabelText(/custom thresholds/i);
      return user.click(customToggle);
    });

    await waitFor(async () => {
      const slider = getByLabelText(/missed sessions alert/i).nextElementSibling;
      await user.clear(slider as Element);
      await user.type(slider as Element, '5');
    });

    expect(getByText(/5 sessions/)).toBeInTheDocument();
  });

  it('saves custom thresholds when confirmed', async () => {
    const user = userEvent.setup();
    const { getByRole, getByLabelText, getByText } = renderWithProviders(
      <ThresholdSettings 
        currentThresholds={defaultThresholds}
        onUpdateThresholds={mockOnUpdateThresholds}
      />
    );

    await user.click(getByRole('button'));

    await waitFor(() => {
      const customToggle = getByLabelText(/custom thresholds/i);
      return user.click(customToggle);
    });

    await waitFor(async () => {
      const saveButton = getByText(/save settings/i);
      await user.click(saveButton);
    });

    expect(mockOnUpdateThresholds).toHaveBeenCalledWith({
      missedSessionThreshold: 2,
      neverPostedThreshold: 7,
      consecutiveThreshold: 3
    });
  });

  it('cancels changes without saving', async () => {
    const user = userEvent.setup();
    const { getByRole, getByText } = renderWithProviders(
      <ThresholdSettings 
        currentThresholds={defaultThresholds}
        onUpdateThresholds={mockOnUpdateThresholds}
      />
    );

    await user.click(getByRole('button'));

    await waitFor(async () => {
      const cancelButton = getByText(/cancel/i);
      await user.click(cancelButton);
    });

    expect(mockOnUpdateThresholds).not.toHaveBeenCalled();
  });

  it('shows recommended thresholds for different roster sizes', async () => {
    const user = userEvent.setup();
    const smallRosterThresholds = { ...defaultThresholds, rosterSize: 3 };
    
    const { getByRole, getByText } = renderWithProviders(
      <ThresholdSettings 
        currentThresholds={smallRosterThresholds}
        onUpdateThresholds={mockOnUpdateThresholds}
      />
    );

    await user.click(getByRole('button'));

    await waitFor(() => {
      expect(getByText(/small groups.*alert after 1 missed session/i)).toBeInTheDocument();
    });
  });
});
