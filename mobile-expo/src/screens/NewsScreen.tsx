import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Button, Image, TouchableOpacity, Linking } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabNavigatorParamList } from '../navigation/TabNavigator';
import { useLocation } from '../hooks/useLocation';
import { initApi } from '../services/api';
import Constants from 'expo-constants';

interface NewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
  tags?: string[];
}

interface NewsResponse {
  success: boolean;
  count: number;
  data: NewsArticle[];
  message?: string;
  error?: string;
}

interface NewsScreenProps extends BottomTabScreenProps<TabNavigatorParamList, 'News'> {}

const NewsScreen: React.FC<NewsScreenProps> = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const { coordinates } = useLocation();

  const fetchNews = async (reset = false) => {
    try {
      if (reset) {
        setNews([]);
        setPage(1);
      }

      setLoading(true);
      setError(null);
      setMessage(null);

      const maxResults = 20; // Number of results per page
      const currentPage = reset ? 1 : page;

      // Get API base URL from env
      const apiBaseUrl = Constants.expoConfig?.extra?.API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
      if (!apiBaseUrl) throw new Error('API base URL not configured');
      const api = await initApi(apiBaseUrl);

      const response = await api.get(`/api/news/headlines`, {
        params: {
          lang: 'en',
          max: maxResults,
          page: currentPage,
        },
      });
      const data = response.data;
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      // Update message if provided by backend
      if (data.message) {
        setMessage(data.message);
      }
      
      // Add new articles to existing ones
      if (reset) {
        setNews(data.data);
        setPage(2); // next page will be 2
        setHasMore(data.count > data.data.length);
        console.log('[NewsScreen] Reset news:', { added: data.data.length, total: data.count });
        console.log('[NewsScreen] State after fetch:', {
          newsLength: data.data.length,
          hasMore: data.count > data.data.length,
          page: 2
        });
      } else {
        setNews(prev => {
          const updated = [...prev, ...data.data];
          const hasMoreNow = data.count > updated.length;
          setHasMore(hasMoreNow);
          console.log('[NewsScreen] Appending news:', { added: data.data.length, total: updated.length });
          console.log('[NewsScreen] State after fetch:', {
            newsLength: updated.length,
            hasMore: hasMoreNow,
            page: page + 1
          });
          return updated;
        });
        setPage(prev => prev + 1);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching news:', error);
      let errorMsg = 'Failed to fetch news';
      if (typeof error === 'object' && error && 'message' in error && typeof (error as any).message === 'string') {
        errorMsg = (error as any).message;
      }
      setError(errorMsg);
      setLoading(false);
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchNews(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNews(true);
    setRefreshing(false);
  };

  const renderNewsItem = ({ item }: { item: NewsArticle }) => (
    <TouchableOpacity 
      style={styles.newsCard}
      activeOpacity={0.7}
      onPress={() => Linking.openURL(item.url)}
    >
      {item.urlToImage ? (
        <Image
          source={{ uri: item.urlToImage }}
          style={styles.newsImage}
          resizeMode="cover"
          onError={() => {}}
        />
      ) : (
        <View style={styles.placeholderImage} />
      )}
      <View style={styles.newsContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.source}>{item.source.name}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.publishedAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red', marginTop: 40, textAlign: 'center' }}>{error}</Text>
        <Button title="Retry" onPress={() => fetchNews(true)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={news}
        keyExtractor={(item, index) => item.url + index}
        renderItem={renderNewsItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListFooterComponent={
          loading && !refreshing ? <ActivityIndicator size="large" color="#007bff" /> : null
        }
        ListEmptyComponent={
          !loading && news.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text>No news articles found.</Text>
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  newsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden', // Only 'visible' or 'hidden' are valid in React Native
  },
  newsImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
  },
  imageFallbackText: {
    color: '#888',
    fontSize: 14,
  },
  newsContent: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    color: '#444',
    marginBottom: 8,
  },
  source: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'right',
  },
  error: {
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  retryButtonContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  list: {
    paddingBottom: 32,
  },

});

export default NewsScreen;
