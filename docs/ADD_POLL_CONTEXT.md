# ➕ Add Poll Page - Technical Specification

## Overview
The Add Poll page enables users to create new polls about local issues, allowing them to gather community input and initiate discussions on topics that matter to them.

## Purpose
- Allow users to create new polls on community issues
- Enable citizens to raise awareness about local problems
- Facilitate data collection on community opinions
- Initiate discussion channels around important topics

## User Flow
1. User navigates to the Add Poll tab from bottom navigation
2. User fills out the poll creation form
3. System validates the input in real-time
4. User reviews poll details before submission
5. User submits the poll
6. User receives confirmation and is redirected to view their new poll

## UI Components

### Form Components
- **Header Section**
  - Title ("Create New Poll")
  - Brief instructions

- **Poll Information Section**
  - Issue Title input field
  - Description text area
  - Location selector (auto-filled with current location, editable)
  - Category dropdown (optional)
  - Tags input (optional)

- **Poll Options Section**
  - Minimum of 2 option fields
  - "Add Option" button to add more options
  - "Remove" button for each option (except first two)

- **Submission Section**
  - Submit button (disabled until required fields are valid)
  - Cancel button
  - Preview option (optional)

### Validation Components
- Error messages for invalid inputs
- Character counters for fields with limits
- Visual indicators for required vs. optional fields
- Duplicate option checker

### Confirmation Modal
- Summary of poll details
- Final confirmation button
- Edit button to return to form
- Success animation upon submission

## Data Structure

```typescript
interface PollDraft {
  title: string;
  description: string;
  location: {
    name: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  category?: string;
  tags?: string[];
  options: string[];
  settings?: {
    allowAnonymousVoting: boolean;
    endDate?: string; // ISO date string
    allowMultipleVotes: boolean;
    allowComments: boolean;
  };
}

interface ValidationErrors {
  title?: string;
  description?: string;
  location?: string;
  options?: string[];
  general?: string;
}
```

## Form Validation Rules

### Title
- Required
- Min length: 5 characters
- Max length: 100 characters
- No duplicate titles (optional check against existing polls)

### Description
- Required
- Min length: 20 characters
- Max length: 500 characters

### Location
- Required
- Valid location format
- Within supported geographical areas

### Poll Options
- Minimum 2 options required
- Max 10 options
- Each option: 
  - Min length: 1 character
  - Max length: 100 characters
- No duplicate options

## API Integration

### Endpoints to Implement
- `POST /api/polls` - Create a new poll
  - Body: PollDraft object

- `GET /api/categories` - Fetch available categories for dropdown

- `GET /api/locations/validate` - Validate location input
  - Query params: `location`: string (location name or coordinates)

- `GET /api/polls/check-duplicate` - Check if similar poll exists
  - Query params: `title`: string

## State Management

### Local State
- Form values
- Validation errors
- Submission status
- Form step (if multi-step)

### Global State (Zustand)
- User's default location
- Recently created polls
- Draft polls (for saving incomplete forms)

## Features to Implement

### Phase 1 (MVP)
- Basic poll creation form
- Real-time validation
- Location auto-fill
- Poll submission

### Phase 2
- Poll preview
- Draft saving
- Category and tag selection
- Similar poll detection

### Phase 3
- Rich text description
- Poll scheduling
- Advanced poll settings
- Media attachment options

## Integration Points
- **Location Services**: Auto-fill user's current location
- **User Authentication**: Track poll creator
- **Categories System**: Provide relevant categories
- **Poll Database**: Store new polls

## Accessibility Considerations
- Clear error messages
- Keyboard navigation for form fields
- Screen reader support for validation feedback
- Focus management for multi-step forms

## Performance Optimization
- Debounced validation for text inputs
- Lazy loading of non-critical form components
- Optimized location services integration
- Efficient form state management

## Testing Scenarios
- Test form validation with various inputs
- Test location services integration
- Test submission with network errors
- Test with different device sizes and orientations

---

## Implementation Notes
- Use React Native Paper components for consistent UI
- Implement Formik or React Hook Form for form management
- Consider using Yup for validation schema
- Use a step indicator for multi-step forms if implemented
- Ensure proper error handling for submission failures
- Implement optimistic UI updates for better user experience
