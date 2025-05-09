# Opinify Design System - UX Laws & Psychology

## Overview
This document outlines the key UX laws and psychological principles that guide our design decisions.

## Table of Contents
1. [Cognitive Load](#cognitive-load)
2. [Visual Hierarchy](#visual-hierarchy)
3. [Response Time](#response-time)
4. [Decision Making](#decision-making)
5. [User Patterns](#user-patterns)

## Cognitive Load
Based on [Miller's Law](https://lawsofux.com/millers-law/) and [Cognitive Load Theory](https://lawsofux.com/cognitive-load/):

### Principles
- Keep interface elements between 5-9 items
- Break complex tasks into smaller chunks
- Use progressive disclosure for complex interfaces

### Implementation Example
```jsx
// Progressive Disclosure Component
const ProgressiveDisclosure = ({ title, content }) => {
  const [isExpanded, setExpanded] = useState(false);
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setExpanded(!isExpanded)}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Icon 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color="#757575"
          />
        </View>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.content}>
          {content}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: Platform.select({ ios: 0, android: 2 }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  content: {
    marginTop: 12,
  },
});
```

## Visual Hierarchy
Based on [Serial Position Effect](https://lawsofux.com/serial-position-effect/) and [Von Restorff Effect](https://lawsofux.com/von-restorff-effect/):

### Principles
- Place critical actions at the beginning or end
- Highlight important elements through contrast
- Use consistent visual patterns for similar elements

### Implementation Example
```jsx
// Priority Action Button
const PriorityButton = ({ label, onPress }) => (
  <TouchableOpacity 
    style={styles.priorityButton}
    onPress={onPress}
  >
    <Text style={styles.priorityLabel}>{label}</Text>
  </TouchableOpacity>
);
```

## Response Time
Based on [Doherty Threshold](https://lawsofux.com/doherty-threshold/):

### Principles
- Maintain response times under 400ms
- Show loading states for longer operations
- Provide immediate feedback for user actions

### Implementation Example
```jsx
// Responsive Feedback Component
const ResponsiveFeedback = ({ onAction }) => {
  const [isLoading, setLoading] = useState(false);
  
  const handleAction = async () => {
    setLoading(true);
    await onAction();
    setLoading(false);
  };
  
  return (
    <TouchableOpacity 
      onPress={handleAction}
      disabled={isLoading}
    >
      {isLoading ? <ActivityIndicator /> : <Text>Action</Text>}
    </TouchableOpacity>
  );
};
```

## Decision Making
Based on [Hick's Law](https://lawsofux.com/hicks-law/) and [Choice Overload](https://lawsofux.com/choice-overload/):

### Principles
- Limit primary actions to 2-3 options
- Group related choices
- Use progressive disclosure for complex choices

### Implementation Example
```jsx
// Decision Menu Component
const DecisionMenu = ({ options }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <View>
      {options.slice(0, 3).map(option => (
        <PrimaryButton key={option.id} {...option} />
      ))}
      {options.length > 3 && (
        <ExpandableMenu 
          options={options.slice(3)}
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
        />
      )}
    </View>
  );
};
```

## User Patterns
Based on [Jakob's Law](https://lawsofux.com/jakobs-law/) and [Mental Models](https://lawsofux.com/mental-model/):

### Principles
- Follow platform conventions
- Use familiar interaction patterns
- Maintain consistency with system behaviors

### Implementation Example
```jsx
// Platform-Specific Navigation
const Navigation = () => (
  Platform.select({
    ios: <TabBarNavigation />,
    android: <MaterialBottomNavigation />
  })
);
```

## References
- [Laws of UX](https://lawsofux.com)
- [Nielsen Norman Group - UX Research](https://www.nngroup.com/articles/)
