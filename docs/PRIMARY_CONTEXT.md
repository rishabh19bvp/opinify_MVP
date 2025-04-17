# Primary Context: Opinify Development Guide

## Introduction

This guide outlines a structured approach to developing the Opinify platform - a social good application designed to empower citizens through local issue awareness, community polling, and collaborative problem-solving. By following these phases, we ensure a robust, testable, and maintainable codebase.

## Project Overview

Opinify connects citizens with local issues through:
- Location-based community polls
- Local news and updates
- Real-time discussion channels
- User-generated content

---

## 1. Project Setup

### Goals
- Establish consistent development environment
- Define clear project architecture
- Set up version control best practices

### Environment Setup

```bash
# Clone repository
git clone [repository-url] opinify
cd opinify

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Folder Structure

```
opinify/
├── api/                  # Backend application
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Custom middleware
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes 
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Helper functions
│   │   └── __tests__/    # Test directory
│   ├── .env              # Environment variables
│   └── package.json
├── app/                  # React Native frontend
│   ├── src/
│   │   ├── api/          # API integration
│   │   ├── components/   # Reusable components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── navigation/   # Navigation config
│   │   ├── screens/      # Screen components
│   │   ├── store/        # Zustand state management
│   │   ├── theme/        # UI theme constants
│   │   └── utils/        # Helper functions
│   ├── App.tsx
│   └── package.json
└── docs/                 # Documentation
```

### Version Control Best Practices

- **Branch Structure**:
  - `main`: Production-ready code
  - `develop`: Integration branch
  - `feature/*`: Feature branches
  - `bugfix/*`: Bug fixes
  - `release/*`: Release candidates

- **Commit Message Guidelines**:
  - Use semantic commit messages: `feat:`, `fix:`, `docs:`, `test:`, etc.
  - Include ticket/issue numbers where applicable
  - Keep messages concise but descriptive

- **Pull Request Process**:
  - Create small, focused PRs
  - Include test coverage
  - Require at least one code review
  - Ensure CI tests pass

### ✅ Setup Checklist
- [ ] Repository initialized with proper .gitignore
- [ ] Environment variables configured
- [ ] Development dependencies installed
- [ ] Code formatting and linting established
- [ ] README with setup instructions created
- [ ] Continuous integration setup

---

## 2. Phase 1: Backend Development

### Goals
- Design scalable API architecture
- Implement core functionality with proper error handling
- Establish comprehensive testing patterns

### API Architecture Planning

- **API Design**: RESTful API with resource-based routing
- **Versioning**: Use URL-based versioning (e.g., `/api/v1/`)
- **Response Format**: Consistent JSON structure
- **Status Codes**: Follow HTTP standards

### Schema Definitions

Define TypeScript interfaces for all resources:

```typescript
// Example Poll schema
interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
}
```

### Testing Strategy

- **Unit Tests**: Test individual functions and services
- **Integration Tests**: Test API endpoints and database operations
- **Mocking**: Use mocks for external services
- **Test Coverage**: Aim for >80% code coverage

### ✅ Backend Development Checklist
- [ ] Define API endpoints and routes
- [ ] Implement controllers with proper error handling
- [ ] Create service layer for business logic
- [ ] Write unit tests for services
- [ ] Write integration tests for API endpoints
- [ ] Generate API documentation (Swagger/OpenAPI)
- [ ] Run test coverage report (aim for >80%)

### Recommended Tools
- Testing: Jest, Supertest
- Documentation: Swagger/OpenAPI
- API Testing: Postman/Insomnia

---

## 3. Phase 2: Database Integration

### Goals
- Implement robust data models
- Create efficient database operations
- Ensure data integrity and validation

### Database Setup

- MongoDB with Mongoose for schema validation
- Proper indexing for performance (especially for geospatial queries)
- Connection pooling configuration

### Schema Implementation

```typescript
// Example Poll schema with Mongoose
const PollSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  options: [{
    text: { type: String, required: true },
    votes: { type: Number, default: 0 }
  }],
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

// Add geospatial index
PollSchema.index({ location: '2dsphere' });
```

### Data Validation

- Implement model-level validation with Mongoose
- Add service-level validation for complex business rules
- Create consistent error messages for validation failures

### Database Testing

- Test CRUD operations independently
- Validate data integrity constraints
- Test edge cases (e.g., duplicate keys, invalid data)

### ✅ Database Integration Checklist
- [ ] Define all database schemas
- [ ] Implement indexes for performance
- [ ] Create data access service layer
- [ ] Implement validation rules
- [ ] Create seed data for development
- [ ] Write tests for database operations
- [ ] Implement database migration strategy

### Recommended Tools
- Mongoose for MongoDB schema modeling
- MongoDB Atlas for cloud database (alternative)
- MongoDB Compass for visualization

---

## 4. Phase 3: Authentication & Authorization

### Goals
- Implement secure user authentication
- Create role-based access control
- Test authentication flows thoroughly

### Authentication Implementation

- JWT-based authentication
- Secure password handling with bcrypt
- Refresh token rotation
- OAuth integration for social logins

### Middleware Development

```typescript
// Example authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

### Permission Models

- Define user roles (e.g., user, moderator, admin)
- Implement permission checks for protected resources
- Create middleware for role-based access

### Testing Authentication

- Test token generation and validation
- Verify protected route access control
- Test token expiration and refresh flow
- Test invalid authentication scenarios

### ✅ Authentication Checklist
- [ ] Implement user registration and login
- [ ] Create JWT token generation and validation
- [ ] Implement password hashing and comparison
- [ ] Create authentication middleware
- [ ] Implement refresh token mechanism
- [ ] Add OAuth providers (if applicable)
- [ ] Test authentication flows
- [ ] Create role-based access control

### Recommended Tools
- jsonwebtoken for JWT handling
- bcrypt for password hashing
- Passport.js for OAuth integration

---

## 5. Phase 4: Frontend Architecture

### Goals
- Establish consistent component structure
- Configure state management
- Set up routing and navigation
- Implement API integration layer

### React Native Setup

- Expo or React Native CLI setup
- Navigation configuration with React Navigation
- UI component library integration

### Component Hierarchy

- Atomic design pattern (atoms, molecules, organisms, templates, pages)
- Reusable component library
- Screen-specific components

### State Management with Zustand

```typescript
// Example auth store slice
import create from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // API call to login
      const response = await api.post('/auth/login', { email, password });
      set({ 
        user: response.data.user,
        token: response.data.token,
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: error.message || 'Failed to login',
        isLoading: false
      });
    }
  },
  logout: () => {
    set({ user: null, token: null });
  }
}));
```

### API Integration

- Create API client with Axios or fetch
- Implement request/response interceptors
- Add token handling for authenticated requests
- Create mock API for development

### ✅ Frontend Architecture Checklist
- [ ] Set up React Native project structure
- [ ] Configure navigation
- [ ] Establish theming and styling approach
- [ ] Create reusable component library
- [ ] Implement state management with Zustand
- [ ] Set up API integration layer
- [ ] Configure mock data for development

### Recommended Tools
- React Navigation for routing
- React Native Paper for UI components
- Axios for API requests
- Zustand for state management

---

## 6. Phase 5: Frontend Development

### Goals
- Implement screens and features incrementally
- Create responsive and accessible UI
- Test components and user flows

### Screen Implementation

Develop screens in order of priority:
1. Authentication screens (Login/Register)
2. Polls Screen
3. News Screen
4. Discussion Channels
5. Profile Screen

### Component Testing

- Unit test custom hooks
- Test component rendering and interaction
- Mock API calls and state

```typescript
// Example component test
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PollCard from '../PollCard';

describe('PollCard', () => {
  it('renders poll information correctly', () => {
    const poll = {
      id: '1',
      title: 'Test Poll',
      description: 'Test Description',
      options: [
        { id: '1', text: 'Option 1', votes: 5 },
        { id: '2', text: 'Option 2', votes: 10 }
      ]
    };
    
    const { getByText } = render(<PollCard poll={poll} />);
    
    expect(getByText('Test Poll')).toBeTruthy();
    expect(getByText('Test Description')).toBeTruthy();
    expect(getByText('Option 1')).toBeTruthy();
    expect(getByText('Option 2')).toBeTruthy();
  });
  
  it('handles vote action', async () => {
    const mockVote = jest.fn();
    // Test implementation
  });
});
```

### Form Validation

- Implement client-side validation
- Display meaningful error messages
- Handle form submission and API errors

### ✅ Frontend Development Checklist
- [ ] Implement authentication screens
- [ ] Create main feature screens
- [ ] Implement form validation
- [ ] Add error handling for API calls
- [ ] Create loading states and indicators
- [ ] Write component unit tests
- [ ] Ensure responsive design
- [ ] Implement accessibility features

### Recommended Tools
- React Native Testing Library
- Formik or React Hook Form for form handling
- Yup for validation

---

## 7. Phase 6: End-to-End Testing

### Goals
- Validate complete user flows
- Test cross-platform functionality
- Ensure robust error handling

### End-to-End Test Scenarios

1. User registration and login
2. Creating and voting on polls
3. Viewing and filtering news
4. Joining and participating in discussion channels
5. Updating user profile

### Mobile Testing Considerations

- Test on multiple device sizes
- Verify permissions handling (location, notifications)
- Test offline behavior and error states

### Automated Testing

- Configure Detox or Appium for E2E testing
- Create test scripts for critical user flows
- Automate regression testing

### ✅ End-to-End Testing Checklist
- [ ] Define critical user flows
- [ ] Create E2E test suite
- [ ] Test on multiple devices/platforms
- [ ] Verify offline behavior
- [ ] Test error handling
- [ ] Validate permissions management
- [ ] Check performance on low-end devices

### Recommended Tools
- Detox for React Native E2E testing
- Appium for cross-platform testing
- BrowserStack for device testing

---

## 8. Phase 7: CI/CD & Deployment Readiness

### Goals
- Automate testing and deployment
- Establish release process
- Create monitoring and feedback mechanisms

### CI/CD Pipeline

- Configure GitHub Actions or similar CI tool
- Automate test execution
- Set up deployment to staging/production environments

```yaml
# Example GitHub Actions workflow
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run linting
        run: npm run lint
```

### Deployment Strategy

- Create separate staging and production environments
- Implement feature flags for controlled rollouts
- Configure automatic and manual deployment triggers

### Monitoring and Analytics

- Set up error tracking (Sentry)
- Implement analytics (Google Analytics, Firebase)
- Create performance monitoring

### ✅ CI/CD & Deployment Checklist
- [ ] Configure CI/CD pipeline
- [ ] Set up automated testing
- [ ] Create staging environment
- [ ] Implement feature flags
- [ ] Set up error tracking
- [ ] Configure analytics
- [ ] Document deployment process
- [ ] Create rollback procedures

### Recommended Tools
- GitHub Actions or CircleCI
- Firebase App Distribution for beta testing
- Sentry for error tracking
- Google Analytics for usage analytics

---

## 9. Appendix

### Essential Tools Reference

#### Development Tools
- **IDE**: VS Code with React Native extensions
- **API Testing**: Postman or Insomnia
- **Database Management**: MongoDB Compass
- **Version Control**: Git with GitHub/GitLab

#### Testing Tools
- **Unit Testing**: Jest
- **Component Testing**: React Native Testing Library
- **API Testing**: Supertest
- **E2E Testing**: Detox

#### DevOps Tools
- **CI/CD**: GitHub Actions, CircleCI
- **Monitoring**: Sentry, LogRocket
- **Analytics**: Google Analytics, Firebase Analytics

### Useful Commands

```bash
# Backend
npm run dev        # Start development server
npm test           # Run all tests
npm run test:watch # Run tests in watch mode
npm run lint       # Run linting

# Frontend
npm start          # Start Expo development server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run test       # Run tests
npm run lint       # Run linting
```

### Debugging Tips

- Use React Native Debugger for frontend debugging
- Implement proper logging throughout the application
- Use Chrome DevTools for network inspection
- Leverage Postman for API testing and debugging

### Performance Optimization

- Implement virtualized lists for long scrolling screens
- Use memoization for expensive calculations
- Optimize images and assets
- Implement code splitting where applicable

---

## Conclusion

This phased development approach ensures that Opinify is built on a solid foundation with proper testing and best practices at each step. By completing each phase before moving to the next, we maintain quality and reduce technical debt throughout the development lifecycle.

Remember that this guide is a living document and should be updated as the project evolves and new requirements emerge.
