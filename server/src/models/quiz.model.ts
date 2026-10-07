import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  marks: number;
  order: number;
}

export interface IQuiz extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  courseId?: Types.ObjectId;
  lessonId?: Types.ObjectId;
  description: string;
  questions: IQuizQuestion[];
  passingScore: number; // percentage, e.g. 70
  timeLimit: number; // minutes (0 = unlimited)
  isPublished: boolean;
  totalAttempts?: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [String],
      required: [true, 'Options are required'],
      validate: [(val: string[]) => val.length >= 2, 'A question must have at least 2 options'],
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
      trim: true,
    },
    explanation: {
      type: String,
      default: '',
    },
    marks: {
      type: Number,
      default: 1,
      min: 1,
    },
    order: {
      type: Number,
      default: 1,
    },
  },
  { _id: true }
);

const QuizSchema = new Schema<IQuiz>(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
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
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Quiz description is required'],
      trim: true,
    },
    questions: {
      type: [QuizQuestionSchema],
      default: [],
      validate: [(val: IQuizQuestion[]) => val.length >= 1, 'Quiz must have at least 1 question'],
    },
    passingScore: {
      type: Number,
      default: 70,
      min: 1,
      max: 100,
    },
    timeLimit: {
      type: Number,
      default: 15, // 15 minutes default
      min: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save slug generator
QuizSchema.pre<IQuiz>('validate', function (next) {
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

QuizSchema.index({ isPublished: 1, courseId: 1 });

export const Quiz = mongoose.model<IQuiz>('Quiz', QuizSchema);
