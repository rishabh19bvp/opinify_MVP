# Opinify Design System - Performance Optimization

## Overview
This document outlines our performance optimization strategies, focusing on network optimization, memory management, and rendering performance.

## Table of Contents
1. [Network Optimization](#network-optimization)
2. [Memory Management](#memory-management)
3. [Rendering Performance](#rendering-performance)
4. [Firebase Optimization](#firebase-optimization)

## Network Optimization
Based on our mobile-first approach and network reliability requirements:

### Data Fetching Strategy
```jsx
const useFetchWithCache = (key, fetchFn, options = {}) => {
  const { 
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 30 * 60 * 1000, // 30 minutes
    retryCount = 3
  } = options;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check cache first
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < staleTime) {
            setData(cachedData);
            setLoading(false);
            return;
          }
        }

        // Fetch fresh data
        let attempts = 0;
        let success = false;
        while (attempts < retryCount && !success) {
          try {
            const freshData = await fetchFn();
            await AsyncStorage.setItem(key, JSON.stringify({
              data: freshData,
              timestamp: Date.now()
            }));
            setData(freshData);
            success = true;
          } catch (e) {
            attempts++;
            if (attempts === retryCount) throw e;
            await new Promise(r => setTimeout(r, 1000 * attempts));
          }
        }
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key]);

  return { data, error, isLoading };
};
```

### Image Optimization
```jsx
const SmartImage = ({
  uri,
  width,
  height,
  placeholder,
  quality = 'auto'
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Calculate optimal quality based on network
  const [imageQuality, setImageQuality] = useState(quality);
  
  useEffect(() => {
    NetInfo.fetch().then(state => {
      if (state.type === 'cellular' && state.details.cellularGeneration === '3g') {
        setImageQuality('low');
      }
    });
  }, []);

  const optimizedUri = useMemo(() => {
    const base = uri;
    if (imageQuality === 'low') {
      return base + '?w=300&q=60';  // Lower quality for slow connections
    }
    return base + '?w=600&q=80';    // Higher quality for fast connections
  }, [uri, imageQuality]);

  return (
    <View style={{ width, height }}>
      {!loaded && !error && (
        <Image 
          source={placeholder} 
          style={[styles.image, { position: 'absolute' }]} 
        />
      )}
      <Image
        source={{ uri: optimizedUri }}
        style={styles.image}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </View>
  );
};
```

## Memory Management

### List Virtualization
```jsx
const VirtualizedList = ({ 
  data,
  renderItem,
  itemHeight,
  windowSize = 5
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: windowSize });
  
  const onScroll = useCallback(({ nativeEvent }) => {
    const offset = nativeEvent.contentOffset.y;
    const visibleItems = Math.ceil(nativeEvent.layoutMeasurement.height / itemHeight);
    
    const start = Math.max(0, Math.floor(offset / itemHeight) - windowSize);
    const end = Math.min(data.length, Math.ceil(offset / itemHeight) + visibleItems + windowSize);
    
    setVisibleRange({ start, end });
  }, [data.length, itemHeight, windowSize]);

  const getItemLayout = useCallback((_, index) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  }), [itemHeight]);

  return (
    <FlatList
      data={data.slice(visibleRange.start, visibleRange.end)}
      renderItem={renderItem}
      onScroll={onScroll}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={windowSize}
      windowSize={windowSize}
      keyExtractor={(item, index) => \`\${index}-\${visibleRange.start}\`}
      contentContainerStyle={{
        paddingTop: visibleRange.start * itemHeight
      }}
    />
  );
};
```

## Rendering Performance

### Component Memoization
```jsx
const MemoizedCard = memo(({ item, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(item.id);
  }, [item.id, onPress]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.card}>
        <SmartImage
          uri={item.imageUrl}
          width={150}
          height={150}
        />
        <Text>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.imageUrl === nextProps.item.imageUrl
  );
});
```

## Firebase Optimization
Based on our Firebase implementation:

### Efficient Queries
```jsx
const useFirestoreQuery = (collection, queryFn, options = {}) => {
  const { limit = 10, orderBy = 'createdAt' } = options;
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastDoc = useRef(null);

  const loadMore = useCallback(async () => {
    try {
      let query = firebase
        .firestore()
        .collection(collection)
        .orderBy(orderBy, 'desc')
        .limit(limit);

      if (lastDoc.current) {
        query = query.startAfter(lastDoc.current);
      }

      if (queryFn) {
        query = queryFn(query);
      }

      const snapshot = await query.get();
      const newDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      lastDoc.current = snapshot.docs[snapshot.docs.length - 1];
      setDocs(prev => [...prev, ...newDocs]);
    } finally {
      setLoading(false);
    }
  }, [collection, queryFn, limit, orderBy]);

  useEffect(() => {
    loadMore();
  }, []);

  return { docs, loading, loadMore };
};
```

### Offline Persistence
```jsx
const initializeFirebase = async () => {
  try {
    await firebase.firestore().enablePersistence({
      synchronizeTabs: true
    });
    
    // Configure cache size
    firebase.firestore().settings({
      cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
    });

    // Initialize custom persistence layer
    await AsyncStorage.setItem('firebaseInitialized', 'true');
  } catch (err) {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab
      console.warn('Multiple tabs not supported');
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support persistence
      console.warn('Persistence not supported');
    }
  }
};
```

## References
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mon)
- [React Native Profiler](https://reactnative.dev/docs/profiler)
