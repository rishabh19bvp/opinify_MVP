# Opinify Design System - Component Library

## Overview
This document outlines our component library, including smart components, error handling, and form design patterns.

## Table of Contents
1. [Component Psychology](#component-psychology)
2. [Form Design](#form-design)
3. [Error Handling](#error-handling)
4. [Loading States](#loading-states)

## Component Psychology
Based on [Aesthetic-Usability Effect](https://lawsofux.com/aesthetic-usability-effect/) and [Peak-End Rule](https://lawsofux.com/peak-end-rule/):

- **Aesthetic-Usability Effect**: Components should be visually appealing as users forgive minor usability issues if the design is attractive.
- **Peak-End Rule**: Users judge experiences by the most intense point and the end. Ensure error/success states are clear and memorable.
- **Zeigarnik Effect**: Users remember interrupted or incomplete tasks. Use progress indicators and reminders for unfinished actions.

| Principle        | Implementation                | Impact                          |
|-----------------|-------------------------------|--------------------------------|
| Visual Appeal   | Polished, consistent design   | Increases perceived usability  |
| Error States    | Friendly error messages       | Reduces user frustration       |
| Success States  | Celebratory animations        | Reinforces positive actions    |

## Form Design
Based on [Tesler's Law](https://lawsofux.com/teslers-law/) and [Postel's Law](https://lawsofux.com/postels-law/):

### Principles
| Principle        | Implementation                | Rationale                      |
|-----------------|-------------------------------|--------------------------------|
| Input Format    | Be liberal in input acceptance | Reduce user errors             |
| Validation      | Real-time feedback            | Immediate error correction     |
| Default Values  | Smart, contextual defaults    | Reduce cognitive load          |
| Error Prevention| Clear constraints & hints     | Guide users to success        |

### Implementation Example
```jsx
// Smart Form Input
const SmartInput = ({ 
  label, 
  value, 
  onChange, 
  validation, 
  autoFormat,
  suggestions
}) => {
  const [error, setError] = useState('');
  const [isFocused, setFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleChange = (text) => {
    // Be liberal in what you accept
    const formatted = autoFormat ? autoFormat(text) : text;
    onChange(formatted);

    // Validate in real-time
    if (validation) {
      const validationError = validation(formatted);
      setError(validationError || '');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={handleChange}
        onFocus={() => {
          setFocused(true);
          setShowSuggestions(true);
        }}
        onBlur={() => {
          setFocused(false);
          setTimeout(() => setShowSuggestions(false), 200);
        }}
        style={[
          styles.input,
          isFocused && styles.focused,
          error && styles.error
        ]}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.hint}>{getContextualHint(value)}</Text>
      )}
      {showSuggestions && suggestions && (
        <View style={styles.suggestions}>
          {suggestions.map(suggestion => (
            <TouchableOpacity
              key={suggestion}
              onPress={() => {
                onChange(suggestion);
                setShowSuggestions(false);
              }}>
              <Text>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};
```

## Error Handling
Based on our Firebase implementation and [Peak-End Rule](https://lawsofux.com/peak-end-rule/):

### Error Boundary Component
```jsx
const ErrorBoundary = ({ children }) => {
  const [error, setError] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    const handleError = (error) => {
      setError(error);
      // Log error to analytics
      logErrorToAnalytics(error);
    };

    const subscription = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler(handleError);

    return () => {
      ErrorUtils.setGlobalHandler(subscription);
    };
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={32} color="#F44336" />
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>
          {error.message || 'An unexpected error occurred'}
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setErrorInfo(null);
          }}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return children;
};
```

### Network Error Handler
```jsx
const NetworkErrorHandler = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  if (!isOnline) {
    return (
      <View style={styles.offlineContainer}>
        <Icon name="wifi-off" size={48} color="#757575" />
        <Text style={styles.offlineTitle}>No Internet Connection</Text>
        <Text style={styles.offlineMessage}>
          Please check your connection and try again
        </Text>
        <RetryButton onRetry={handleRetry} isRetrying={retrying} />
      </View>
    );
  }

  return children;
};
```

## Loading States
Based on [Doherty Threshold](https://lawsofux.com/doherty-threshold/) and [Zeigarnik Effect](https://lawsofux.com/zeigarnik-effect/):

### Principles
| Principle        | Implementation                | Impact                          |
|-----------------|-------------------------------|--------------------------------|
| Response Time   | < 400ms for feedback          | Maintain user engagement        |
| Progress        | Show progress for >1s tasks   | Reduce perceived wait time     |
| Completion      | Clear success/failure states  | Provide closure to users       |
| Background Tasks| Progress indicators          | Keep users informed            |

### Implementation Example
```jsx
const SmartLoading = ({ isLoading, duration, children }) => {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // For quick operations (<400ms), show nothing
      const spinnerTimer = setTimeout(() => {
        setShowSpinner(true);
      }, 400);

      // For longer operations (>2s), switch to skeleton
      const skeletonTimer = setTimeout(() => {
        setShowSpinner(false);
        setShowSkeleton(true);
      }, 2000);

      return () => {
        clearTimeout(spinnerTimer);
        clearTimeout(skeletonTimer);
      };
    }
  }, [isLoading]);

  if (showSkeleton) {
    return <SkeletonPlaceholder>{children}</SkeletonPlaceholder>;
  }

  if (showSpinner) {
    return (
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        {duration && (
          <Text style={styles.loadingText}>
            Estimated time: {Math.ceil(duration / 1000)}s
          </Text>
        )}
      </View>
    );
  }

  return children;
};
```

## References
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Native Elements](https://reactnativeelements.com/)
