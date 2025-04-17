import mongoose from 'mongoose';
import { cleanupDatabase } from '@/__tests__/setup/jest.setup';
import { NewsArticle, INewsArticleDocument } from '@/models/NewsArticle';

describe('News Article Model', () => {
  const testArticleData = {
    title: 'Test News Article',
    description: 'This is a test news article description',
    content: 'This is the full content of the test news article',
    url: 'https://example.com/test-article',
    image: 'https://example.com/test-image.jpg',
    publishedAt: new Date(),
    source: {
      name: 'Test Source',
      url: 'https://example.com'
    },
    tags: ['technology', 'test']
  };

  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('Validation', () => {
    it('should validate a valid news article', async () => {
      const article = await NewsArticle.create(testArticleData);
      expect(article.title).toBe(testArticleData.title);
      expect(article.description).toBe(testArticleData.description);
      expect(article.url).toBe(testArticleData.url);
      expect(article.tags).toEqual(expect.arrayContaining(testArticleData.tags));
    });

    it('should throw error for missing required fields', async () => {
      const invalidArticle = { 
        ...testArticleData,
        title: undefined
      };
      
      await expect(NewsArticle.create(invalidArticle)).rejects.toThrow();
    });

    it('should validate URL uniqueness', async () => {
      // This test verifies that the URL field has a unique constraint
      // by checking the schema definition rather than testing runtime behavior
      const urlSchema = NewsArticle.schema.path('url');
      expect(urlSchema).toBeDefined();
      
      // Check if the unique property is set to true
      const schemaOptions = (urlSchema as any).options;
      expect(schemaOptions.unique).toBe(true);
      expect(schemaOptions.index).toBe(true);
    });
    
  });

  describe('Tag Queries', () => {
    beforeEach(async () => {
      // Create articles with different tags
      await NewsArticle.create(testArticleData); // technology, test
      
      await NewsArticle.create({
        ...testArticleData,
        title: 'Health Article',
        url: 'https://example.com/health-article',
        tags: ['health', 'science']
      });
      
      await NewsArticle.create({
        ...testArticleData,
        title: 'Technology and Health',
        url: 'https://example.com/tech-health',
        tags: ['technology', 'health']
      });
    });

    it('should find articles by tag', async () => {
      const articles = await NewsArticle.findByTags(['technology']);
      
      expect(articles.length).toBe(2);
      expect(articles.map(a => a.title)).toContain(testArticleData.title);
      expect(articles.map(a => a.title)).toContain('Technology and Health');
    });

    it('should find articles by multiple tags', async () => {
      const articles = await NewsArticle.findByTags(['health', 'science']);
      
      expect(articles.length).toBe(2);
      expect(articles.map(a => a.title)).toContain('Health Article');
      expect(articles.map(a => a.title)).toContain('Technology and Health');
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt and updatedAt timestamps', async () => {
      const article = await NewsArticle.create(testArticleData);
      
      expect(article.createdAt).toBeInstanceOf(Date);
      expect(article.updatedAt).toBeInstanceOf(Date);
    });

    it('should update the updatedAt timestamp on save', async () => {
      const article = await NewsArticle.create(testArticleData);
      const originalUpdatedAt = article.updatedAt;
      
      // Wait a bit to ensure timestamp will be different
      await new Promise(resolve => setTimeout(resolve, 100));
      
      article.title = 'Updated Title';
      await article.save();
      
      expect(article.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
