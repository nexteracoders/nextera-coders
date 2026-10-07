import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILessonResource {
  title: string;
  url: string;
  type: 'PDF' | 'Link' | 'Code' | 'File' | 'Other';
}

export interface ILesson extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId: Types.ObjectId;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail?: string;
  duration: string;
  order: number;
  notes: string;
  resources: ILessonResource[];
  isFree: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'courseId is required'],
      index: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'moduleId is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      minlength: [2, 'Lesson title must be at least 2 characters'],
      maxlength: [150, 'Lesson title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    videoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    thumbnail: {
      type: String,
      default: '',
      trim: true,
    },
    duration: {
      type: String,
      default: '0 mins',
      trim: true,
    },
    order: {
      type: Number,
      default: 1,
    },
    notes: {
      type: String,
      default: '',
    },
    resources: [
      {
        title: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
        type: {
          type: String,
          enum: ['PDF', 'Link', 'Code', 'File', 'Other'],
          default: 'Link',
        },
      },
    ],
    isFree: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

LessonSchema.index({ courseId: 1, moduleId: 1, order: 1 });
LessonSchema.index({ moduleId: 1, isPublished: 1, order: 1 });

export const Lesson = mongoose.model<ILesson>('Lesson', LessonSchema);
