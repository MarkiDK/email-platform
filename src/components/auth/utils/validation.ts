import * as z from 'zod';

// Login validering
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email er påkrævet')
    .email('Ugyldig email'),
  password: z
    .string()
    .min(1, 'Adgangskode er påkrævet')
});

// Registrering validering
export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Navn er påkrævet')
    .min(2, 'Navn skal være mindst 2 tegn'),
  email: z
    .string()
    .min(1, 'Email er påkrævet')
    .email('Ugyldig email'),
  password: z
    .string()
    .min(1, 'Adgangskode er påkrævet')
    .min(8, 'Adgangskode skal være mindst 8 tegn')
    .regex(/[A-Z]/, 'Adgangskode skal indeholde mindst ét stort bogstav')
    .regex(/[a-z]/, 'Adgangskode skal indeholde mindst ét lille bogstav')
    .regex(/[0-9]/, 'Adgangskode skal indeholde mindst ét tal'),
  password_confirmation: z
    .string()
    .min(1, 'Bekræft adgangskode er påkrævet')
}).refine((data) => data.password === data.password_confirmation, {
  message: "Adgangskoderne matcher ikke",
  path: ["password_confirmation"],
});

// Glemt adgangskode validering
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email er påkrævet')
    .email('Ugyldig email')
});

// Nulstil adgangskode validering
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(1, 'Adgangskode er påkrævet')
    .min(8, 'Adgangskode skal være mindst 8 tegn')
    .regex(/[A-Z]/, 'Adgangskode skal indeholde mindst ét stort bogstav')
    .regex(/[a-z]/, 'Adgangskode skal indeholde mindst ét lille bogstav')
    .regex(/[0-9]/, 'Adgangskode skal indeholde mindst ét tal'),
  password_confirmation: z
    .string()
    .min(1, 'Bekræft adgangskode er påkrævet')
}).refine((data) => data.password === data.password_confirmation, {
  message: "Adgangskoderne matcher ikke",
  path: ["password_confirmation"],
});

// Email validering
export const emailSchema = z.object({
  to: z
    .string()
    .min(1, 'Modtager er påkrævet')
    .email('Ugyldig email'),
  subject: z
    .string()
    .min(1, 'Emne er påkrævet')
    .max(255, 'Emne må maksimalt være 255 tegn'),
  body: z
    .string()
    .min(1, 'Besked er påkrævet'),
  attachments: z
    .array(z.string())
    .optional()
});

// Kontakt validering
export const contactSchema = z.object({
  name: z
    .string()
    .min(1, 'Navn er påkrævet')
    .min(2, 'Navn skal være mindst 2 tegn'),
  email: z
    .string()
    .min(1, 'Email er påkrævet')
    .email('Ugyldig email'),
  phone: z
    .string()
    .optional(),
  company: z
    .string()
    .optional(),
  notes: z
    .string()
    .optional()
});

// Type definitioner
export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
export type EmailForm = z.infer<typeof emailSchema>;
export type ContactForm = z.infer<typeof contactSchema>;