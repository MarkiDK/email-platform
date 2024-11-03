import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword, validateFullName } from '../../utils/validation';
import type { RegisterCredentials } from '../../types/auth.types';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    emailUpdates: false
  });

  // Password styrke indikatorer
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasNumber: false,
    hasSpecial: false,
    hasUpperCase: false
  });

  const updatePasswordStrength = (password: string) => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasUpperCase: /[A-Z]/.test(password)
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    if (name === 'password') {
      updatePasswordStrength(value);
    }
    
    setError(null);
  };

  const validateStep1 = (): boolean => {
    if (!validateFullName(formData.fullName)) {
      setError('Indtast venligst dit fulde navn (min. 2 karakterer)');
      return false;
    }

    if (!validateEmail(formData.email)) {
      setError('Indtast venligst en gyldig email-adresse');
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    if (!validatePassword(formData.password)) {
      setError('Adgangskoden opfylder ikke sikkerhedskravene');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Adgangskoderne matcher ikke');
      return false;
    }

    if (!formData.acceptTerms) {
      setError('Du skal acceptere vilkårene for at fortsætte');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
      return;
    }
    
    if (!validateStep2()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const credentials: RegisterCredentials = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        emailUpdates: formData.emailUpdates
      };
      
      await register(credentials);
      navigate('/verify-email');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl. Prøv igen senere.');
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordStrength = () => (
    <div className="mt-2 space-y-2">
      <p className="text-sm font-medium text-gray-700">Adgangskoden skal indeholde:</p>
      <div className="space-y-1">
        {[
          { check: passwordStrength.hasMinLength, text: 'Mindst 8 tegn' },
          { check: passwordStrength.hasUpperCase, text: 'Mindst ét stort bogstav' },
          { check: passwordStrength.hasNumber, text: 'Mindst ét tal' },
          { check: passwordStrength.hasSpecial, text: 'Mindst ét specialtegn' }
        ].map((requirement, index) => (
          <div key={index} className="flex items-center gap-2">
            {requirement.check ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Info className="h-4 w-4 text-gray-400" />
            )}
            <span className={`text-sm ${requirement.check ? 'text-green-600' : 'text-gray-600'}`}>
              {requirement.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        {/* Logo og titel */}
        <div className="text-center mb-8">
          <img 
            src="/assets/images/logo.svg" 
            alt="Emailsiden logo" 
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-blue-600">Opret ny konto</h1>
          <p className="text-gray-600 mt-2">
            Trin {step} af 2: {step === 1 ? 'Personlige oplysninger' : 'Sikkerhed'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${step * 50}%` }}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {/* Registration form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Fulde navn
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Indtast dit fulde navn"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="vaelg@emailsiden.dk"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Vælg adgangskode
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Indtast sikker adgangskode"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {renderPasswordStrength()}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Bekræft adgangskode
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Gentag adgangskode"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Jeg accepterer{' '}
                    <a href="/vilkaar" className="text-blue-600 hover:text-blue-700">
                      vilkår og betingelser
                    </a>
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="emailUpdates"
                    checked={formData.emailUpdates}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Ja tak til nyheder og opdateringer
                  </span>
                </label>
              </div>
            </>
          )}

          <div className="flex gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Tilbage
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2 px-4 rounded-lg text-white font-medium transition-colors
                ${loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Vent venligst...
                </span>
              ) : (
                step === 1 ? 'Fortsæt' : 'Opret konto'
              )}
            </button>
          </div>
        </form>

        {/* Login link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Har du allerede en konto?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Log ind her
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;