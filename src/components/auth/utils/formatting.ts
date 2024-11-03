import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { da } from 'date-fns/locale';

/**
 * Formaterer en dato til et læsevenligt format
 * @param date Dato der skal formateres
 * @returns Formateret dato string
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return format(dateObj, 'HH:mm', { locale: da });
  }
  
  if (isYesterday(dateObj)) {
    return 'I går ' + format(dateObj, 'HH:mm', { locale: da });
  }
  
  return format(dateObj, 'd. MMM yyyy HH:mm', { locale: da });
};

/**
 * Formaterer en dato til relativ tid (fx "for 2 timer siden")
 * @param date Dato der skal formateres
 * @returns Formateret relativ tid string
 */
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { 
    addSuffix: true,
    locale: da 
  });
};

/**
 * Formaterer filstørrelse til læsevenligt format
 * @param bytes Antal bytes
 * @returns Formateret filstørrelse string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Formaterer et telefonnummer til dansk format
 * @param phone Telefonnummer der skal formateres
 * @returns Formateret telefonnummer string
 */
export const formatPhoneNumber = (phone: string): string => {
  // Fjern alt andet end tal
  const cleaned = phone.replace(/\D/g, '');
  
  // Tjek om det er et dansk mobilnummer (8 cifre)
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  }
  
  // Tjek om det er et dansk fastnetnummer med områdekode (8 cifre)
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  }
  
  // Returner uformatteret hvis ikke det matcher ovenstående
  return phone;
};

/**
 * Forkorter en tekst til et maksimalt antal tegn
 * @param text Tekst der skal forkortes
 * @param maxLength Maksimal længde
 * @returns Forkortet tekst string
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Formaterer et navn til initialer
 * @param name Navn der skal formateres
 * @returns Initialer string
 */
export const formatInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};