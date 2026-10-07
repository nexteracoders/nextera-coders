import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IModule extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  description: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema = new Schema<IModule>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'courseId is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
      minlength: [2, 'Module title must be at least 2 characters'],
      maxlength: [150, 'Module title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    order: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

ModuleSchema.index({ courseId: 1, order: 1 });

export const Module = mongoose.model<IModule>('Module', ModuleSchema);
