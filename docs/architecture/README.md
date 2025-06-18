
# Tennis Social Platform - Architecture Overview

## 🏗️ High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend (React + TypeScript)"
        A[React App] --> B[React Router]
        A --> C[TanStack Query]
        A --> D[Zustand/Context]
        A --> E[Tailwind CSS + shadcn/ui]
        
        subgraph "Core Pages"
            F[Feed/Social]
            G[Profile Management]
            H[Tennis AI Chat]
            I[Session/Match Logging]
            J[Map Explorer]
            K[Messages/Chat]
            L[Admin Dashboard]
        end
        
        B --> F
        B --> G
        B --> H
        B --> I
        B --> J
        B --> K
        B --> L
    end
    
    subgraph "Backend (Supabase)"
        M[Supabase Auth] --> N[PostgreSQL Database]
        N --> O[Row Level Security]
        P[Edge Functions] --> N
        Q[Realtime] --> N
        R[Storage Buckets]
    end
    
    subgraph "External APIs"
        S[OpenAI API]
        T[Mapbox API]
        U[Social Media APIs]
    end
    
    A --> M
    A --> N
    A --> Q
    A --> R
    P --> S
    J --> T
    I --> U
    
    subgraph "Testing"
        V[Jest + Testing Library]
        W[Mock Services]
        X[Test Utilities]
    end
    
    A --> V
```

## 🎯 Application Purpose

This is a comprehensive **Tennis Social Platform** that combines:
- **Social networking** for tennis players and coaches
- **Performance tracking** with session/match logging
- **AI-powered coaching** and content generation
- **Location-based discovery** of courts and players
- **Real-time messaging** and notifications
- **Admin management** tools

---

## 📱 Frontend Architecture

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **State Management**: 
  - TanStack Query for server state
  - React Context for local state
  - Custom hooks for business logic
- **UI Framework**: 
  - Tailwind CSS for styling
  - shadcn/ui component library
  - Radix UI primitives
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library

### Folder Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   ├── admin/           # Admin-specific components
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard widgets
│   ├── feed/            # Social feed components
│   ├── logging/         # Session/match logging
│   ├── map/             # Map and location features
│   ├── messages/        # Chat and messaging
│   ├── notifications/   # Notification system
│   ├── profile/         # User profile management
│   ├── social/          # Social interaction components
│   └── tennis-ai/       # AI chat interface
├── hooks/               # Custom React hooks
├── pages/               # Route-level page components
├── services/            # Business logic services
├── integrations/        # External service integrations
│   └── supabase/        # Supabase client and types
├── lib/                 # Utility functions
└── __tests__/           # Test files
```

### Component Architecture
- **Atomic Design**: Components are organized by complexity and reusability
- **Compound Components**: Complex features use compound component patterns
- **Custom Hooks**: Business logic extracted into reusable hooks
- **Service Layer**: Separation between UI and business logic

---

## 🗄️ Backend & Services

### Supabase Architecture
```mermaid
graph TB
    subgraph "Supabase Backend"
        A[Authentication] --> B[PostgreSQL]
        B --> C[Row Level Security]
        
        subgraph "Database Tables"
            D[profiles]
            E[posts]
            F[sessions]
            G[matches]
            H[messages]
            I[notifications]
            J[tennis_courts]
            K[ai_conversations]
            L[ambassador_profiles]
        end
        
        B --> D
        B --> E
        B --> F
        B --> G
        B --> H
        B --> I
        B --> J
        B --> K
        B --> L
        
        M[Edge Functions] --> N[OpenAI API]
        O[Realtime Subscriptions]
        P[Storage Buckets]
    end
```

### Key Features
1. **Authentication**: Email/password with automatic profile creation
2. **Database**: PostgreSQL with comprehensive RLS policies
3. **Realtime**: Live updates for messages, notifications, and social feeds
4. **Edge Functions**: AI integration and external API handling
5. **Storage**: File uploads for avatars, media, and court images

### Database Design
- **User Management**: `profiles`, `user_roles`, `followers`
- **Social Features**: `posts`, `comments`, `post_reactions`, `likes`
- **Tennis Tracking**: `sessions`, `matches`, `achievements`, `certifications`
- **Location Services**: `tennis_courts` with geospatial queries
- **AI Features**: `ai_conversations`, `ai_messages`, `ambassador_profiles`
- **Communication**: `direct_messages`, `notifications`, `conversations`

---

## 🔄 Key Data Flows

### 1. User Authentication Flow
```mermaid
sequenceDiagram
    participant U as User
    participant A as AuthProvider
    participant S as Supabase Auth
    participant DB as Database
    
    U->>A: Login/Signup
    A->>S: Auth request
    S->>DB: Create/verify user
    DB->>S: User data
    S->>A: Session + User
    A->>U: Authenticated state
```

### 2. Social Feed Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Feed Component
    participant Q as TanStack Query
    participant S as Supabase
    participant R as Realtime
    
    U->>F: Load feed
    F->>Q: Query posts
    Q->>S: Fetch posts with RLS
    S->>Q: Posts data
    Q->>F: Cached posts
    F->>U: Display feed
    
    Note over R: Real-time updates
    R->>F: New post event
    F->>Q: Invalidate cache
    Q->>F: Updated posts
    F->>U: Live feed update
```

### 3. AI Chat Flow
```mermaid
sequenceDiagram
    participant U as User
    participant C as Chat Component
    participant E as Edge Function
    participant O as OpenAI API
    participant DB as Database
    
    U->>C: Send message
    C->>E: POST to ai-chat function
    E->>O: OpenAI completion request
    O->>E: AI response
    E->>DB: Save conversation
    E->>C: Response
    C->>U: Display AI message
```

### 4. Session Logging Flow
```mermaid
sequenceDiagram
    participant U as User
    participant L as Logging Component
    participant A as AutoPost Service
    participant S as Supabase
    participant N as Notifications
    
    U->>L: Log session data
    L->>A: Generate post suggestions
    A->>L: Suggested posts
    L->>S: Save session
    S->>N: Trigger coach notifications
    N->>S: Create notifications
    L->>U: Success confirmation
```

---

## 🧪 Testing Architecture

### Testing Strategy
```
__tests__/
├── components/          # Component unit tests
├── hooks/              # Custom hook tests
├── services/           # Service layer tests
├── mocks/              # Mock data and utilities
│   ├── data/           # Mock data fixtures
│   └── supabase.ts     # Supabase mock
├── setup.ts            # Test configuration
└── utils/              # Test utilities
```

### Testing Patterns
- **Unit Tests**: Components, hooks, and services
- **Integration Tests**: Multi-component interactions
- **Mocking Strategy**: 
  - Supabase client fully mocked
  - External APIs mocked
  - Mock data factories for consistency
- **Coverage Areas**:
  - Authentication flows
  - Social interactions
  - AI chat functionality
  - Session/match logging
  - Map and location features

### Mock Architecture
```typescript
// Centralized Supabase mock with full query builder
const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  // ... all query methods
};
```

---

## 🚀 Deployment & Infrastructure

### Frontend Deployment
- **Platform**: Lovable (React/Vite hosting)
- **Domain**: Custom domain support available
- **Build Process**: Automatic builds on code changes
- **Environment**: Production-ready with optimizations

### Backend Services
- **Supabase**: Managed PostgreSQL + Auth + Realtime
- **Edge Functions**: Automatically deployed with code
- **Database Migrations**: SQL-based schema management
- **Secrets Management**: Environment variables in Supabase

### CI/CD Pipeline
```mermaid
graph LR
    A[Code Push] --> B[Lovable Build]
    B --> C[TypeScript Check]
    C --> D[Test Suite]
    D --> E[Deploy Frontend]
    E --> F[Deploy Edge Functions]
    F --> G[Run Migrations]
```

---

## 🔧 Configuration & Environment

### Environment Variables
- Supabase URL and keys (managed by Lovable)
- OpenAI API key (stored in Supabase secrets)
- Mapbox tokens for map features

### Feature Flags
- AI responses toggle per user
- Ambassador content system
- Location sharing privacy controls
- Admin role permissions

---

## 📊 Performance Considerations

### Frontend Optimization
- **TanStack Query**: Intelligent caching and background updates
- **Lazy Loading**: Route-based code splitting
- **Optimistic Updates**: Immediate UI feedback
- **Virtual Scrolling**: For large lists and feeds

### Backend Optimization
- **RLS Policies**: Database-level security and filtering
- **Indexes**: Optimized queries for geospatial and social data
- **Edge Functions**: Minimal cold start times
- **Realtime**: Selective subscriptions to reduce overhead

---

## 🔒 Security Model

### Authentication & Authorization
- **Row Level Security**: All tables protected by RLS
- **Role-Based Access**: Admin, coach, player roles
- **API Security**: All requests authenticated
- **Privacy Controls**: Granular location and profile settings

### Data Protection
- **Input Validation**: Zod schemas for all forms
- **SQL Injection**: Prevented by Supabase client
- **XSS Protection**: React's built-in protections
- **File Upload**: Secure storage bucket policies

---

## 🎯 Key Architectural Decisions

1. **Supabase Choice**: Provides auth, database, realtime, and edge functions in one platform
2. **React Query**: Chosen for superior caching and synchronization
3. **Component Library**: shadcn/ui for consistent, accessible components
4. **Testing Strategy**: Comprehensive mocking to avoid external dependencies
5. **Service Layer**: Separation of business logic from UI components
6. **TypeScript**: Full type safety across the entire application

This architecture supports a scalable, maintainable tennis social platform with rich features and excellent developer experience.
