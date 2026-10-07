import mongoose, { Document, Schema, Types } from 'mongoose';

export type ProjectDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface IProject extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  difficulty: ProjectDifficulty;
  category: string;
  technologies: string[];
  requirements: string[];
  features: string[];
  learningOutcomes: string[];
  githubUrl?: string;
  demoUrl?: string;
  isPublished: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
    },
    thumbnail: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Project category is required'],
      trim: true,
      index: true,
    },
    technologies: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    features: {
      type: [String],
      default: [],
    },
    learningOutcomes: {
      type: [String],
      default: [],
    },
    githubUrl: {
      type: String,
      default: '',
      trim: true,
    },
    demoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save slug generator
ProjectSchema.pre<IProject>('validate', function (next) {
  if (this.isModified('title') && (!this.slug || this.slug.trim() === '')) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

ProjectSchema.index({ isPublished: 1, category: 1, difficulty: 1 });
ProjectSchema.index({ title: 'text', description: 'text', technologies: 'text' });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
