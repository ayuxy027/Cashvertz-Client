import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;

export class EmailService {
  /**
   * Send notification email using EmailJS platform directly
   */
  static async sendNotification(userEmail: string, userName?: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      // Template parameters for EmailJS platform
      const templateParams = {
        to_email: userEmail,
        to_name: userName || 'Valued Customer',
        from_name: 'CashVertz Team',
        message: 'Welcome to CashVertz! You have successfully signed up to be notified when we launch on October 21st, 2025. We are excited to revolutionize cashback shopping!',
        reply_to: 'noreply@cashvertz.com'
      };

      // Use EmailJS platform directly as per docs
      emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        {
          publicKey: EMAILJS_PUBLIC_KEY,
        }
      ).then(
        () => {
          // eslint-disable-next-line no-console
          console.log('SUCCESS!');
          resolve({ success: true });
        },
        (error) => {
          // eslint-disable-next-line no-console
          console.log('FAILED...', error.text);
          resolve({ 
            success: false, 
            error: 'Failed to send notification email. Please try again.' 
          });
        }
      );
    });
  }
}
