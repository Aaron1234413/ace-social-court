
import { renderWithProviders } from '../../utils/test-utils';
import MapView from '@/components/map/MapView';
import { mockUsers } from '../../mocks/data/users';

// Mock MapContainer to avoid mapbox issues in tests
jest.mock('@/components/map/MapContainer', () => {
  return function MockMapContainer({ children, onMapInitialized }: any) {
    // Simulate map initialization
    React.useEffect(() => {
      if (onMapInitialized) {
        onMapInitialized({
          flyTo: jest.fn(),
          on: jest.fn(),
          off: jest.fn()
        });
      }
    }, [onMapInitialized]);

    return <div data-testid="map-container">{children}</div>;
  };
});

jest.mock('@/components/map/NearbyUsersLayer', () => {
  return function MockNearbyUsersLayer({ users }: any) {
    return (
      <div data-testid="users-layer">
        {users.map((user: any) => (
          <div key={user.id} data-testid={`user-${user.id}`}>
            {user.full_name}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('@/components/map/TennisCourtsLayer', () => {
  return function MockTennisCourtsLayer({ courts }: any) {
    return (
      <div data-testid="courts-layer">
        {courts.map((court: any) => (
          <div key={court.id} data-testid={`court-${court.id}`}>
            {court.name}
          </div>
        ))}
      </div>
    );
  };
});

describe('MapView', () => {
  const defaultProps = {
    isReady: true,
    locationPrivacy: {
      shareExactLocation: true,
      showOnMap: true,
      locationHistory: true
    },
    onMapInitialized: jest.fn(),
    onUserPositionUpdate: jest.fn(),
    mapInstance: null,
    nearbyUsers: [],
    nearbyCourts: [],
    filters: {
      showPlayers: true,
      showCoaches: true,
      showCourts: true,
      showOwnLocation: true,
      showFollowing: false
    },
    onSelectUser: jest.fn(),
    onSelectCourt: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner when not ready', () => {
    const { getByRole } = renderWithProviders(
      <MapView {...defaultProps} isReady={false} />
    );

    expect(getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('renders map container when ready', () => {
    const { getByTestId } = renderWithProviders(
      <MapView {...defaultProps} />
    );

    expect(getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders nearby users when provided', () => {
    const mockNearbyUsers = [
      mockUsers.player(),
      mockUsers.coach()
    ];

    const { getByTestId } = renderWithProviders(
      <MapView {...defaultProps} nearbyUsers={mockNearbyUsers} />
    );

    expect(getByTestId('users-layer')).toBeInTheDocument();
    expect(getByTestId(`user-${mockNearbyUsers[0].id}`)).toBeInTheDocument();
    expect(getByTestId(`user-${mockNearbyUsers[1].id}`)).toBeInTheDocument();
  });

  it('renders tennis courts when filters allow', () => {
    const mockCourts = [
      {
        id: '1',
        name: 'Central Park Courts',
        latitude: 40.7829,
        longitude: -73.9654,
        is_public: true
      }
    ];

    const { getByTestId } = renderWithProviders(
      <MapView {...defaultProps} nearbyCourts={mockCourts} />
    );

    expect(getByTestId('courts-layer')).toBeInTheDocument();
    expect(getByTestId('court-1')).toBeInTheDocument();
  });

  it('hides courts layer when filter is disabled', () => {
    const mockCourts = [
      {
        id: '1',
        name: 'Central Park Courts',
        latitude: 40.7829,
        longitude: -73.9654,
        is_public: true
      }
    ];

    const { queryByTestId } = renderWithProviders(
      <MapView 
        {...defaultProps} 
        nearbyCourts={mockCourts}
        filters={{ ...defaultProps.filters, showCourts: false }}
      />
    );

    expect(queryByTestId('courts-layer')).not.toBeInTheDocument();
  });

  it('calls onMapInitialized when map is ready', () => {
    const mockOnMapInitialized = jest.fn();

    renderWithProviders(
      <MapView {...defaultProps} onMapInitialized={mockOnMapInitialized} />
    );

    expect(mockOnMapInitialized).toHaveBeenCalledWith(
      expect.objectContaining({
        flyTo: expect.any(Function)
      })
    );
  });

  it('applies correct responsive height classes', () => {
    const { getByTestId } = renderWithProviders(
      <MapView {...defaultProps} />
    );

    const mapContainer = getByTestId('map-container').parentElement;
    expect(mapContainer).toHaveClass('h-[50vh]', 'sm:h-[60vh]', 'md:h-[65vh]', 'lg:h-[70vh]');
  });
});
