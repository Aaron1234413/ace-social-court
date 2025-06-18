
# Component Architecture

## 🧩 Component Hierarchy & Organization

The frontend follows a hierarchical component structure with clear separation of concerns and reusability patterns.

## 📁 Component Structure

```
src/components/
├── ui/                    # Base design system components (shadcn/ui)
├── layout/               # App-wide layout components
├── auth/                 # Authentication flows
├── profile/              # User profile management
├── social/               # Social interaction components
├── feed/                 # Social feed features
├── logging/              # Session/match tracking
├── tennis-ai/            # AI chat interface
├── map/                  # Location & map features
├── messages/             # Direct messaging
├── notifications/        # Notification system
├── dashboard/            # Analytics dashboards
├── admin/                # Admin panel components
└── onboarding/           # User onboarding flows
```

## 🎨 Design System (UI Components)

### Base Components (`components/ui/`)
Built on shadcn/ui and Radix UI primitives:

```typescript
// Core interactive components
Button, Input, Select, Checkbox, Switch, Slider
Dialog, Sheet, Popover, Tooltip, Alert
Card, Badge, Avatar, Separator
Table, Tabs, Accordion, Collapsible

// Form components
Form, Label, Error handling
Calendar, DatePicker, Command

// Layout components
Container, Grid, Flex utilities
ScrollArea, Resizable panels

// Feedback components
Toast, Loading, Skeleton
Progress, Charts (Recharts)
```

**Design Principles**:
- Consistent spacing using Tailwind scale
- Accessible by default (ARIA attributes)
- Dark/light mode support
- Responsive design patterns
- Compound component APIs

## 🏠 Layout Components

### `MainLayout`
**Purpose**: Primary app shell with navigation and user context.

```typescript
interface MainLayoutProps {
  children: React.ReactNode;
}

// Features:
// - Responsive sidebar navigation
// - User authentication state
// - Quick actions menu
// - Notification popover
// - Mobile-optimized navigation
```

### Navigation System
```typescript
// AppSidebar - Desktop navigation
interface SidebarItem {
  title: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
  requiresAuth?: boolean;
}

// BottomNav - Mobile navigation
// QuickActions - Floating action button
// UserDropdown - Profile and settings
```

## 👤 Authentication Components

### `AuthProvider`
**Purpose**: Global authentication context and session management.

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}
```

### Auth Flow Components
- **Login/SignUp Forms**: Email/password authentication
- **Profile Setup**: Initial user configuration
- **Role Selection**: Player/coach role assignment
- **Email Verification**: Confirmation flows

## 👥 Profile Management

### Profile Architecture
```typescript
// ProfileHeader - Display component
interface ProfileHeaderProps {
  user: UserProfile;
  isOwnProfile: boolean;
  onEdit?: () => void;
  onFollow?: () => void;
}

// ProfileEdit - Multi-step wizard
interface ProfileEditSteps {
  basicInfo: BasicInfoFields;
  playingInfo: PlayingInfoFields;
  location: LocationField;
  achievements: AchievementsField;
  certifications: CertificationsField;
}
```

**Key Features**:
- **Wizard-based Editing**: Step-by-step profile completion
- **Image Upload**: Avatar and cover photo management
- **Location Integration**: Mapbox-powered location picker
- **Achievement Tracking**: Tennis milestones and certifications
- **Privacy Controls**: Granular visibility settings

## 📱 Social Components

### Content Creation
```typescript
// PostComposer - Main post creation
interface PostComposerProps {
  initialContent?: string;
  template?: PostTemplate;
  onSubmit: (post: CreatePostData) => void;
}

// Features:
// - Rich text editing
// - Media upload (images/videos)
// - Privacy level selection
// - Template suggestions
// - AI prompt integration
```

### Engagement System
```typescript
// ReactionBar - Tennis-specific reactions
type ReactionType = 'love' | 'fire' | 'tip' | 'achievement';

interface Reaction {
  type: ReactionType;
  count: number;
  hasReacted: boolean;
  commentContent?: string; // For 'tip' reactions
}

// Interactive components:
// - LikeButton, CommentButton, ShareButton
// - ReactionButton with contextual options
// - TipCommentModal for coaching feedback
```

### Content Display
```typescript
// PostList - Feed display with virtualization
// PostContent - Rich post rendering
// PostActions - Interaction buttons
// CommentsDisplay - Threaded comments
// AmbassadorBadge - AI content indicator
```

## 📊 Session & Match Logging

### Multi-Step Logging Wizard
```typescript
// SessionLogger - Main orchestrator
interface SessionFormData {
  basics: SessionBasicsForm;      // Date, location, coaches
  drills: SessionDrillsForm;      // Drill tracking with ratings
  technical: TechnicalTracker;    // Stroke improvements
  physical: PhysicalTracker;      // Energy, endurance metrics
  mental: MentalTracker;          // Confidence, motivation
  nextSteps: SessionNextStepsForm; // Action items
}

// Form validation with Zod schemas
// Auto-save functionality
// Coach notification system
// AI suggestion integration
```

### Progress Tracking
```typescript
// Dashboard widgets
// - SessionsList: Recent training sessions
// - MatchesList: Competitive match history
// - ProgressCharts: Performance trends
// - CoachFeedback: Instructor insights
```

## 🤖 AI Chat Interface

### Chat Architecture
```typescript
// TennisAILayout - Chat container
interface ChatMessage {
  id: string;
  content: string;
  isFromAI: boolean;
  timestamp: Date;
  conversationId: string;
}

// Components:
// - ConversationSidebar: Chat history
// - MessageList: Conversation display
// - MessageInput: Text input with AI prompts
// - TechniqueMemories: Persistent AI memory
```

**AI Features**:
- **Conversation History**: Persistent chat sessions
- **Technique Memory**: AI remembers user's progress
- **Context Awareness**: Tailored responses based on user data
- **Prompt Suggestions**: Quick-start conversation topics

## 🗺️ Map & Location Components

### Map Integration
```typescript
// MapView - Mapbox GL integration
interface MapViewProps {
  nearbyUsers: NearbyUser[];
  nearbyCourts: TennisCourt[];
  onUserSelect: (user: NearbyUser) => void;
  onCourtSelect: (court: TennisCourt) => void;
}

// Specialized components:
// - NearbyUsersLayer: Player/coach markers
// - TennisCourtsLayer: Court location markers
// - LocationStatusCard: User location settings
// - MapFiltersSheet: Search and filter options
```

**Location Features**:
- **Privacy Controls**: Granular location sharing
- **Geospatial Search**: Find nearby users and courts
- **Court Database**: Community-maintained court listings
- **Real-time Updates**: Live user locations

## 💬 Messaging System

### Chat Components
```typescript
// ChatInterface - Real-time messaging
interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  mediaUrl?: string;
  read: boolean;
  reactions: MessageReaction[];
}

// Message features:
// - Real-time delivery via Supabase Realtime
// - Media sharing (images, videos)
// - Message reactions
// - Read receipts
// - Conversation search
```

### Message Management
- **ConversationList**: Chat overview
- **MessageThread**: Individual conversation
- **MessageActions**: Reply, react, delete options
- **NewMessageDialog**: Start new conversations

## 📱 Responsive Design Patterns

### Mobile-First Approach
```typescript
// Responsive component patterns
const useBreakpoint = () => {
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const [isTablet] = useMediaQuery('(max-width: 1024px)');
  return { isMobile, isTablet };
};

// Adaptive UI components:
// - Desktop: Sidebar navigation
// - Mobile: Bottom navigation + drawer
// - Tablet: Hybrid approach
```

### Progressive Enhancement
- **Core functionality** works on all devices
- **Enhanced features** on larger screens
- **Touch-optimized** interactions on mobile
- **Keyboard navigation** support

## 🧪 Component Testing Strategy

### Testing Patterns
```typescript
// Component unit tests
describe('PostComposer', () => {
  it('renders with initial content', () => {
    render(<PostComposer initialContent="Test post" />);
    expect(screen.getByDisplayValue('Test post')).toBeInTheDocument();
  });

  it('calls onSubmit with form data', async () => {
    const onSubmit = jest.fn();
    render(<PostComposer onSubmit={onSubmit} />);
    
    // Simulate user interactions
    await user.type(screen.getByRole('textbox'), 'New post content');
    await user.click(screen.getByRole('button', { name: /publish/i }));
    
    expect(onSubmit).toHaveBeenCalledWith({
      content: 'New post content',
      privacy_level: 'public'
    });
  });
});
```

### Mock Strategies
- **Supabase Client**: Comprehensive database mocking
- **External APIs**: Mapbox, OpenAI service mocking
- **File Uploads**: Mock file handling
- **Real-time Features**: WebSocket mocking

## 🎯 Performance Optimizations

### Code Splitting
```typescript
// Route-based lazy loading
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const TennisAI = lazy(() => import('@/pages/TennisAI'));

// Component-level splitting for large features
const MapExplorer = lazy(() => import('@/components/map/MapExplorer'));
```

### Memoization Patterns
```typescript
// Expensive calculations
const processedStats = useMemo(() => 
  calculateEngagementMetrics(rawData), [rawData]
);

// Event handlers
const handleSubmit = useCallback((data) => {
  onSubmit(data);
}, [onSubmit]);

// Component memoization for list items
const PostItem = memo(({ post, onInteraction }) => {
  return <div>...</div>;
});
```

### Virtual Scrolling
```typescript
// Large list optimization
import { VirtualizedList } from '@/components/ui/virtualized-list';

<VirtualizedList
  items={posts}
  itemHeight={200}
  renderItem={({ item }) => <PostItem post={item} />}
/>
```

## 🔧 Component Composition Patterns

### Compound Components
```typescript
// Flexible, composable interfaces
<Card>
  <Card.Header>
    <Card.Title>Session Summary</Card.Title>
  </Card.Header>
  <Card.Content>
    <SessionMetrics data={session} />
  </Card.Content>
  <Card.Footer>
    <Card.Actions>
      <Button>Edit</Button>
      <Button>Share</Button>
    </Card.Actions>
  </Card.Footer>
</Card>
```

### Render Props
```typescript
// Flexible data sharing
<DataProvider userId={userId}>
  {({ data, loading, error }) => (
    loading ? <Skeleton /> :
    error ? <ErrorDisplay error={error} /> :
    <UserProfile user={data} />
  )}
</DataProvider>
```

### Higher-Order Components
```typescript
// Cross-cutting concerns
const withAuth = (Component) => (props) => {
  const { user } = useAuth();
  if (!user) return <LoginPrompt />;
  return <Component {...props} user={user} />;
};

export default withAuth(Dashboard);
```

This component architecture provides a scalable, maintainable foundation for the tennis social platform with clear patterns for growth and excellent developer experience.
