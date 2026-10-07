import { api } from './api';

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company?: string;
  avatar?: string;
  content: string;
  rating: number;
}

export const testimonialService = {
  async getPublicTestimonials(): Promise<{ testimonials: TestimonialItem[] }> {
    const response = await api.get('/testimonials');
    return response.data.data;
  },
};
