import api from './api';
import { CourseListResponse, ICourse, IModule, ILesson } from '../types/course.types';
import { adminService } from './admin.service';

export const adminCourseService = {
  // Course APIs
  async getCourses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    category?: string;
  }): Promise<CourseListResponse> {
    const res = await api.get('/admin/courses', { params });
    return res.data.data;
  },

  async getCourseById(id: string): Promise<ICourse> {
    const res = await api.get(`/admin/courses/${id}`);
    return res.data.data.course;
  },

  async createCourse(data: Partial<ICourse>): Promise<ICourse> {
    const res = await api.post('/admin/courses', data);
    return res.data.data.course;
  },

  async updateCourse(id: string, data: Partial<ICourse>): Promise<ICourse> {
    const res = await api.put(`/admin/courses/${id}`, data);
    return res.data.data.course;
  },

  async deleteCourse(id: string): Promise<void> {
    await api.delete(`/admin/courses/${id}`);
  },

  async publishCourse(id: string): Promise<void> {
    await api.patch(`/admin/courses/${id}/publish`);
  },

  async unpublishCourse(id: string): Promise<void> {
    await api.patch(`/admin/courses/${id}/unpublish`);
  },

  async toggleFeature(id: string): Promise<{ isFeatured: boolean }> {
    const res = await api.patch(`/admin/courses/${id}/feature`);
    return res.data.data;
  },

  // Module APIs delegated to centralized adminService
  createModule: (data: { courseId: string; title: string; description?: string; order?: number }): Promise<IModule> =>
    adminService.createModule(data),

  updateModule: (id: string, data: { title?: string; description?: string; order?: number }): Promise<IModule> =>
    adminService.updateModule(id, data),

  deleteModule: (id: string): Promise<void> =>
    adminService.deleteModule(id),

  reorderModule: (id: string, newOrder: number): Promise<void> =>
    adminService.reorderModule(id, newOrder),

  // Lesson APIs delegated to centralized adminService
  createLesson: (data: Partial<ILesson>): Promise<ILesson> =>
    adminService.createLesson(data),

  updateLesson: (id: string, data: Partial<ILesson>): Promise<ILesson> =>
    adminService.updateLesson(id, data),

  deleteLesson: (id: string): Promise<void> =>
    adminService.deleteLesson(id),

  publishLesson: (id: string): Promise<void> =>
    adminService.publishLesson(id),

  unpublishLesson: (id: string): Promise<void> =>
    adminService.unpublishLesson(id),

  reorderLesson: (id: string, newOrder: number): Promise<void> =>
    adminService.reorderLesson(id, newOrder),
};
