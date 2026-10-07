import { Request, Response } from 'express';
import { CareerApplication } from '../models/careerApplication.model';
import { emailService } from '../services/email.service';
import { notificationService } from '../services/notification.service';
import { logger } from '../utils/logger';

export class CareerController {
  /**
   * Submit Application from Public Careers Page
   * POST /api/careers/apply
   */
  async submitApplication(req: Request, res: Response): Promise<void> {
    try {
      const {
        jobId,
        jobTitle,
        department = 'Engineering',
        roleType = 'Job',
        fullName,
        email,
        phone,
        linkedin,
        github,
        experienceYears = 'Fresher / 1+ Years',
        coverNote,
        resumeFileName,
        resumeFileSize,
        resumeBase64OrUrl,
      } = req.body;

      if (!jobId || !jobTitle || !fullName || !email || !phone || !resumeFileName) {
        res.status(400).json({
          success: false,
          message: 'Please provide all required fields (Name, Email, Phone, Position, and Resume).',
        });
        return;
      }

      let application: any;
      let appId = `APP-${Date.now().toString().slice(-6)}`;

      try {
        application = await CareerApplication.create({
          jobId,
          jobTitle,
          department,
          roleType,
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          linkedin: linkedin?.trim() || '',
          github: github?.trim() || '',
          experienceYears: experienceYears.trim(),
          coverNote: coverNote?.trim() || '',
          resumeFileName: resumeFileName.trim(),
          resumeFileSize: resumeFileSize || '',
          resumeBase64OrUrl: resumeBase64OrUrl || '',
          status: 'Under Review',
        });
        appId = application._id.toString();
      } catch (dbErr: any) {
        logger.warn(`[CAREER DB] Could not persist to Mongo, proceeding with in-memory notification: ${dbErr.message}`);
      }

      // 1. Dispatch Instant in-app Notification to all Admin Accounts
      try {
        await notificationService.notifyAdmins({
          title: `💼 New Candidate Application: ${fullName.trim()}`,
          message: `${fullName.trim()} applied for ${jobTitle.trim()} (${roleType} in ${department}). Phone: ${phone.trim()}`,
          type: 'CAREER',
          link: '/admin/careers',
          referenceType: 'CAREER_APPLICATION',
          referenceId: appId,
        });
      } catch (notifErr: any) {
        logger.warn(`[CAREER ADMIN NOTIF ERROR] ${notifErr.message}`);
      }

      // 2. Send Instant "Application Received / Thanks for Applying" Email to Candidate
      const emailResult = await emailService.sendCareerApplicationReceivedEmail({
        candidateName: fullName.trim(),
        candidateEmail: email.trim().toLowerCase(),
        jobTitle: jobTitle.trim(),
        department,
        roleType,
        applicationId: appId,
        resumeFileName: resumeFileName.trim(),
        experienceYears: experienceYears.trim(),
        phone: phone.trim(),
        appliedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      });

      const formattedApp = application
        ? {
            id: application._id.toString(),
            _id: application._id.toString(),
            jobId: application.jobId,
            jobTitle: application.jobTitle,
            department: application.department,
            roleType: application.roleType,
            fullName: application.fullName,
            email: application.email,
            phone: application.phone,
            linkedin: application.linkedin,
            github: application.github,
            experienceYears: application.experienceYears,
            coverNote: application.coverNote,
            resumeFileName: application.resumeFileName,
            resumeFileSize: application.resumeFileSize,
            resumeBase64OrUrl: application.resumeBase64OrUrl,
            status: application.status,
            appliedAt: application.createdAt ? new Date(application.createdAt).toISOString() : new Date().toISOString(),
            adminRating: application.adminRating,
            adminNotes: application.adminNotes,
            interviewDetails: application.interviewDetails,
          }
        : {
            id: appId,
            jobId,
            jobTitle,
            department,
            roleType,
            fullName,
            email,
            phone,
            linkedin,
            github,
            experienceYears,
            coverNote,
            resumeFileName,
            resumeFileSize,
            resumeBase64OrUrl,
            status: 'Under Review',
            appliedAt: new Date().toISOString(),
          };

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully! Confirmation email dispatched to candidate.',
        data: {
          application: formattedApp,
          emailDelivery: emailResult,
        },
      });
    } catch (error: any) {
      logger.error(`[CAREER SUBMIT ERROR] ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to process job application. Please try again.',
        error: error.message,
      });
    }
  }

  /**
   * Dedicated Email Dispatch Endpoint for Status Updates (Submitted / Shortlisted / Interview / Rejected)
   * POST /api/careers/notify-email
   */
  async notifyCandidateEmail(req: Request, res: Response): Promise<void> {
    try {
      const {
        type, // 'submitted' | 'shortlisted' | 'interview' | 'rejected'
        candidateName,
        candidateEmail,
        jobTitle,
        department = 'Engineering',
        roleType = 'Job',
        applicationId = `APP-${Date.now().toString().slice(-6)}`,
        resumeFileName = 'Candidate_Resume.pdf',
        experienceYears = '1+ Years',
        adminNotes = '',
        interviewDate,
        interviewTime,
        interviewMode,
        meetingLink,
        panelists,
        roundType,
        duration,
        agendaOrNotes,
      } = req.body;

      if (!candidateName || !candidateEmail || !jobTitle) {
        res.status(400).json({
          success: false,
          message: 'Missing required candidate information (Name, Email, Job Title).',
        });
        return;
      }

      let emailResult;

      if (type === 'interview' || type === 'interview_scheduled') {
        emailResult = await emailService.sendCareerInterviewScheduledEmail({
          candidateName,
          candidateEmail,
          jobTitle,
          department,
          roleType,
          applicationId,
          interviewDate: interviewDate || 'To Be Confirmed',
          interviewTime: interviewTime || '04:00 PM IST',
          interviewMode: interviewMode || 'Google Meet',
          meetingLink: meetingLink || 'https://meet.google.com',
          panelists: panelists || 'Engineering Lead & HR Team',
          roundType: roundType || 'Technical Round 1',
          duration: duration || '45 Minutes',
          agendaOrNotes: agendaOrNotes || adminNotes,
        });
      } else if (type === 'shortlisted') {
        emailResult = await emailService.sendCareerShortlistedEmail({
          candidateName,
          candidateEmail,
          jobTitle,
          department,
          roleType,
          applicationId,
          adminNotes,
        });
      } else if (type === 'rejected') {
        emailResult = await emailService.sendCareerRejectedEmail({
          candidateName,
          candidateEmail,
          jobTitle,
          department,
          roleType,
          applicationId,
        });
      } else {
        // Default to Application Received
        emailResult = await emailService.sendCareerApplicationReceivedEmail({
          candidateName,
          candidateEmail,
          jobTitle,
          department,
          roleType,
          applicationId,
          resumeFileName,
          experienceYears,
        });
      }

      res.status(200).json({
        success: true,
        message: `Career notification email (${type}) processed successfully.`,
        data: {
          emailDelivery: emailResult,
        },
      });
    } catch (error: any) {
      logger.error(`[CAREER NOTIFY EMAIL ERROR] ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to send career notification email.',
        error: error.message,
      });
    }
  }

  /**
   * Schedule Candidate Interview & Dispatch Invitation Email
   * POST /api/careers/applications/:id/schedule-interview
   */
  async scheduleInterview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        interviewDate,
        interviewTime,
        interviewMode = 'Google Meet (Online Video Conference)',
        meetingLink,
        panelists,
        roundType = 'Technical & Coding Round',
        duration = '45 Minutes',
        agendaOrNotes = '',
        sendEmail = true,
      } = req.body;

      if (!interviewDate || !interviewTime || !meetingLink || !panelists) {
        res.status(400).json({
          success: false,
          message: 'Please provide all required interview fields: Date, Time, Meeting Link, and Panelist/Teacher/HR names.',
        });
        return;
      }

      const app = await CareerApplication.findById(id);
      if (!app) {
        res.status(404).json({
          success: false,
          message: 'Candidate application not found.',
        });
        return;
      }

      app.status = 'Interview Scheduled';
      app.interviewDetails = {
        interviewDate: interviewDate.trim(),
        interviewTime: interviewTime.trim(),
        interviewMode: interviewMode.trim(),
        meetingLink: meetingLink.trim(),
        panelists: panelists.trim(),
        roundType: roundType.trim(),
        duration: duration.trim(),
        agendaOrNotes: agendaOrNotes.trim(),
        scheduledAt: new Date(),
      };

      await app.save();

      let emailResult = null;
      if (sendEmail) {
        emailResult = await emailService.sendCareerInterviewScheduledEmail({
          candidateName: app.fullName,
          candidateEmail: app.email,
          jobTitle: app.jobTitle,
          department: app.department,
          roleType: app.roleType,
          applicationId: app._id.toString(),
          interviewDate: interviewDate.trim(),
          interviewTime: interviewTime.trim(),
          interviewMode: interviewMode.trim(),
          meetingLink: meetingLink.trim(),
          panelists: panelists.trim(),
          roundType: roundType.trim(),
          duration: duration.trim(),
          agendaOrNotes: agendaOrNotes.trim(),
        });
      }

      res.status(200).json({
        success: true,
        message: `Interview scheduled for ${app.fullName} on ${interviewDate} at ${interviewTime}. Invitation email dispatched!`,
        data: {
          application: app,
          emailDelivery: emailResult,
        },
      });
    } catch (error: any) {
      logger.error(`[SCHEDULE INTERVIEW ERROR] ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule interview.',
        error: error.message,
      });
    }
  }

  /**
   * Get All Candidate Applications (Admin)
   * GET /api/careers/applications
   */
  async getApplications(_req: Request, res: Response): Promise<void> {
    try {
      const applications = await CareerApplication.find().sort({ createdAt: -1 }).lean();
      const formatted = applications.map((app: any) => ({
        id: app._id ? app._id.toString() : app.id,
        _id: app._id ? app._id.toString() : app.id,
        jobId: app.jobId,
        jobTitle: app.jobTitle,
        department: app.department,
        roleType: app.roleType,
        fullName: app.fullName,
        email: app.email,
        phone: app.phone,
        linkedin: app.linkedin,
        github: app.github,
        experienceYears: app.experienceYears,
        coverNote: app.coverNote,
        resumeFileName: app.resumeFileName,
        resumeFileSize: app.resumeFileSize,
        resumeBase64OrUrl: app.resumeBase64OrUrl,
        status: app.status,
        appliedAt: app.createdAt ? new Date(app.createdAt).toISOString() : new Date().toISOString(),
        adminRating: app.adminRating,
        adminNotes: app.adminNotes,
        interviewDetails: app.interviewDetails,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      }));
      res.status(200).json({
        success: true,
        data: formatted,
      });
    } catch (error: any) {
      logger.error(`[GET APPLICATIONS ERROR] ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve applications.',
        error: error.message,
      });
    }
  }

  /**
   * Update Candidate Application Status & Auto-trigger Email on Shortlist / Reject
   * PATCH /api/careers/applications/:id/status
   */
  async updateApplicationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, adminNotes, adminRating, sendEmail = true } = req.body;

      const app = await CareerApplication.findById(id);
      if (!app) {
        res.status(404).json({
          success: false,
          message: 'Application not found.',
        });
        return;
      }

      const prevStatus = app.status;
      if (status) app.status = status;
      if (adminNotes !== undefined) app.adminNotes = adminNotes;
      if (adminRating !== undefined) app.adminRating = adminRating;

      await app.save();

      let emailResult = null;
      if (sendEmail) {
        if (status === 'Shortlisted' && prevStatus !== 'Shortlisted') {
          emailResult = await emailService.sendCareerShortlistedEmail({
            candidateName: app.fullName,
            candidateEmail: app.email,
            jobTitle: app.jobTitle,
            department: app.department,
            roleType: app.roleType,
            applicationId: app._id.toString(),
            adminNotes: adminNotes || app.adminNotes,
          });
        } else if (status === 'Rejected' && prevStatus !== 'Rejected') {
          emailResult = await emailService.sendCareerRejectedEmail({
            candidateName: app.fullName,
            candidateEmail: app.email,
            jobTitle: app.jobTitle,
            department: app.department,
            roleType: app.roleType,
            applicationId: app._id.toString(),
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `Application status updated to "${status}".`,
        data: {
          application: app,
          emailDelivery: emailResult,
        },
      });
    } catch (error: any) {
      logger.error(`[UPDATE APPLICATION STATUS ERROR] ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to update application status.',
        error: error.message,
      });
    }
  }

  /**
   * Delete Application (Admin)
   * DELETE /api/careers/applications/:id
   */
  async deleteApplication(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await CareerApplication.findByIdAndDelete(id);
      res.status(200).json({
        success: true,
        message: 'Application deleted successfully.',
      });
    } catch (error: any) {
      logger.error(`[DELETE APPLICATION ERROR] ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to delete application.',
        error: error.message,
      });
    }
  }
}

export const careerController = new CareerController();
