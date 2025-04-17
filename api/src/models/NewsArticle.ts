import mongoose, { Document, Schema } from 'mongoose';

export interface INewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  urlToImage: string;
  publishedAt: Date;
  source: {
    id: string;
    name: string;
    url: string;
  };
  author?: string;
  tags: string[];
  reactions?: {
    likes: number;
    shares: number;
  };
}

// Define interface for static methods
interface NewsArticleModel extends mongoose.Model<INewsArticleDocument> {
  findByTags(tags: string[], limit?: number): Promise<INewsArticleDocument[]>;
}

export interface INewsArticleDocument extends INewsArticle, Document {
  createdAt: Date;
  updatedAt: Date;
}

const newsArticleSchema = new Schema<INewsArticleDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
      unique: true,
      index: true,
    },
    urlToImage: {
      type: String,
    },
    publishedAt: {
      type: Date,
      required: [true, 'Published date is required'],
    },
    source: {
      id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    reactions: {
      likes: {
        type: Number,
        default: 0,
      },
      shares: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create text index for searching
newsArticleSchema.index({ title: 'text', description: 'text', content: 'text' });

// Static method to find news articles by tags
newsArticleSchema.statics.findByTags = async function(
  tags: string[],
  limit: number = 10
): Promise<INewsArticleDocument[]> {
  return this.find({
    tags: { $in: tags }
  })
  .sort({ publishedAt: -1 })
  .limit(limit);
};



export const NewsArticle = mongoose.model<INewsArticleDocument, NewsArticleModel>('NewsArticle', newsArticleSchema);
