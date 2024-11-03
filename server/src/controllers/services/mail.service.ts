import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { config } from '@/config';
import { IEmailOptions } from '@/interfaces/email.interface';
import { logger } from '@/utils/logger';
import { ApiError } from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import Mail from 'nodemailer/lib/mailer';
import { EmailTemplate } from '@/models/emailTemplate.model';
import Handlebars from 'handlebars';

class MailService {
  private transporter: Mail;
  private readonly OAuth2Client;

  constructor() {
    this.OAuth2Client = new google.auth.OAuth2(
      config.email.clientId,
      config.email.clientSecret,
      config.email.redirectUri
    );

    this.OAuth2Client.setCredentials({
      refresh_token: config.email.refreshToken,
    });

    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      const accessToken = await this.OAuth2Client.getAccessToken();

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: config.email.senderEmail,
          clientId: config.email.clientId,
          clientSecret: config.email.clientSecret,
          refreshToken: config.email.refreshToken,
          accessToken: accessToken.token || '',
        },
      });

      // Verify connection
      await this.transporter.verify();
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Email service initialization failed:', error);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Email service initialization failed'
      );
    }
  }

  public async sendEmail(options: IEmailOptions): Promise<void> {
    try {
      const { to, subject, text, html, attachments, template, context } = options;

      let emailContent = html;
      
      // If template is specified, render it with the context
      if (template) {
        const emailTemplate = await EmailTemplate.findOne({ name: template });
        if (!emailTemplate) {
          throw new ApiError(
            StatusCodes.NOT_FOUND,
            `Email template '${template}' not found`
          );
        }

        const compiledTemplate = Handlebars.compile(emailTemplate.content);
        emailContent = compiledTemplate(context || {});
      }

      const mailOptions = {
        from: `${config.email.senderName} <${config.email.senderEmail}>`,
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        text: text || '',
        html: emailContent || '',
        attachments,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`);
    } catch (error) {
      logger.error('Error sending email:', error);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to send email'
      );
    }
  }

  public async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verificationUrl = `${config.app.frontendUrl}/verify-email?token=${token}`;
    
    await this.sendEmail({
      to,
      subject: 'Verify Your Email Address',
      template: 'email-verification',
      context: {
        verificationUrl,
        supportEmail: config.email.supportEmail,
      },
    });
  }

  public async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${config.app.frontendUrl}/reset-password?token=${token}`;
    
    await this.sendEmail({
      to,
      subject: 'Reset Your Password',
      template: 'password-reset',
      context: {
        resetUrl,
        supportEmail: config.email.supportEmail,
      },
    });
  }

  public async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Welcome to Our Platform',
      template: 'welcome',
      context: {
        userName,
        loginUrl: config.app.frontendUrl,
        supportEmail: config.email.supportEmail,
      },
    });
  }

  public async sendTwoFactorAuthCode(to: string, code: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Your Two-Factor Authentication Code',
      template: 'two-factor-auth',
      context: {
        code,
        expiryTime: '10 minutes',
      },
    });
  }

  public async sendLoginNotification(
    to: string,
    deviceInfo: string,
    location: string
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'New Login Detected',
      template: 'login-notification',
      context: {
        deviceInfo,
        location,
        time: new Date().toLocaleString(),
        supportEmail: config.email.supportEmail,
      },
    });
  }

  public async sendBulkEmails(
    recipients: string[],
    options: Omit<IEmailOptions, 'to'>
  ): Promise<void> {
    try {
      const batchSize = 50; // Send emails in batches to avoid rate limits
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        await Promise.all(
          batch.map((recipient) =>
            this.sendEmail({ ...options, to: recipient })
          )
        );
        // Add delay between batches to avoid hitting rate limits
        if (i + batchSize < recipients.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      logger.error('Error sending bulk emails:', error);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to send bulk emails'
      );
    }
  }

  public async sendScheduledEmail(options: IEmailOptions, date: Date): Promise<void> {
    const now = new Date();
    const delay = date.getTime() - now.getTime();
    
    if (delay < 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Scheduled date must be in the future'
      );
    }

    setTimeout(async () => {
      try {
        await this.sendEmail(options);
      } catch (error) {
        logger.error('Error sending scheduled email:', error);
      }
    }, delay);
  }
}

export const mailService = new MailService();