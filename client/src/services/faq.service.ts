import { api } from './api';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export const faqService = {
  async getPublicFaqs(category?: string): Promise<{ faqs: FAQItem[] }> {
    const url = category && category !== 'All' ? `/faqs?category=${category}` : '/faqs';
    const response = await api.get(url);
    return response.data.data;
  },
};
