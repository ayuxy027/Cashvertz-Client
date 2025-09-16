// Simple email validation service
export class ValidationService {
  private static emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  /**
   * Simple email validation
   */
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || email.trim() === '') {
      return { isValid: false, error: 'Email is required' };
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!this.emailRegex.test(trimmedEmail)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true };
  }
}
