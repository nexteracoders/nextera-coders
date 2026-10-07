import api from './api';
import {
  ICertificate,
  ICertificateListResponse,
  ICertificateVerifyResponse,
  ICertificateTemplateSettings,
} from '../types/certificate.types';

export const certificateService = {
  // Get all certificates earned by logged in student
  async getMyCertificates(): Promise<ICertificateListResponse> {
    const res = await api.get('/certificates');
    return res.data.data;
  },

  // Get single certificate by ID or CertificateId
  async getCertificateById(id: string): Promise<ICertificate> {
    const res = await api.get(`/certificates/${id}`);
    return res.data.data.certificate;
  },

  // Generate certificate for completed course
  async generateCertificate(courseId: string): Promise<{ certificate: ICertificate; newlyCreated: boolean }> {
    const res = await api.post(`/certificates/generate/${courseId}`);
    return res.data.data;
  },

  // Public certificate verification (No auth required)
  async verifyCertificate(certificateId: string): Promise<ICertificateVerifyResponse> {
    const res = await api.get(`/certificates/verify/${certificateId}`);
    return res.data.data;
  },

  // Get active certificate template format settings (Public / Authenticated)
  async getCertificateTemplate(): Promise<ICertificateTemplateSettings> {
    const res = await api.get('/certificates/template');
    return res.data.data.template;
  },

  // Admin: Update certificate template format settings
  async updateCertificateTemplate(templateData: Partial<ICertificateTemplateSettings>): Promise<ICertificateTemplateSettings> {
    const res = await api.put('/admin/certificates/template', templateData);
    return res.data.data.template;
  },
};

