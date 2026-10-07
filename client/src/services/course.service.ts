import api from './api';
import { CourseListResponse, ICourse, EnrolledCourseItem } from '../types/course.types';

export const courseService = {
  async getCourses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    level?: string;
    featured?: boolean;
    sort?: string;
    type?: string;
  }): Promise<CourseListResponse> {
    const res = await api.get('/courses', { params });
    return res.data.data;
  },

  async getCourseBySlug(slug: string): Promise<ICourse> {
    const res = await api.get(`/courses/${slug}`);
    return res.data.data.course;
  },

  async enrollCourse(
    courseId: string,
    payload?: { tier?: 'free' | 'pro'; paymentDetails?: any }
  ): Promise<{ enrollment: any; course: any }> {
    const res = await api.post(`/courses/${courseId}/enroll`, payload || { tier: 'free' });
    return res.data.data;
  },

  async getMyEnrolledCourses(): Promise<EnrolledCourseItem[]> {
    const res = await api.get('/courses/enrolled/me');
    return res.data.data.courses;
  },
};
