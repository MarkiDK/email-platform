import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  Lock, 
  Smartphone, 
  History, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const SecurityCenter: React.FC = () => {
  const { user, updateSecurity, getSecurityStatus } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [securityStatus, setSecurityStatus] = useState({
    passwordStrength: 0,
    twoFactorEnabled: false,
    lastPasswordChange: null,
    recentLogins: [],
    activeDevices: [],
    securityAlerts: []
  });

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadSecurityStatus();
  }, []);

  const loadSecurityStatus = async () => {
    try {
      setLoading(true);
      const status = await getSecurityStatus();
      setSecurityStatus(status);
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Kunne ikke hente sikkerhedsstatus',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Fejl',
        description: 'De nye adgangskoder matcher ikke',
        type: 'error'
      });
      return;
    }

    try {
      await updateSecurity({
        type: 'password',
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      toast({
        title: 'Succes',
        description: 'Din adgangskode er blevet opdateret',
        type: 'success'
      });

      setShowPasswordChange(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      loadSecurityStatus();
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Kunne ikke opdatere adgangskoden',
        type: 'error'
      });
    }
  };

  const handleToggle2FA = async () => {
    try {
      await updateSecurity({
        type: '2fa',
        enabled: !securityStatus.twoFactorEnabled
      });

      toast({
        title: 'Succes',
        description: `To-faktor autentificering er blevet ${
          securityStatus.twoFactorEnabled ? 'deaktiveret' : 'aktiveret'
        }`,
        type: 'success'
      });

      loadSecurityStatus();
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Kunne ikke opdatere to-faktor autentificering',
        type: 'error'
      });
    }
  };

  const handleDeviceRemoval = async (deviceId: string) => {
    try {
      await updateSecurity({
        type: 'device',
        deviceId,
        action: 'remove'
      });

      toast({
        title: 'Succes',
        description: 'Enheden er blevet fjernet',
        type: 'success'
      });

      loadSecurityStatus();
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Kunne ikke fjerne enheden',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Sikkerhedscenter
        </h1>
        <p className="text-gray-600 mt-2">
          Administrer dine sikkerhedsindstillinger og overvåg din kontos sikkerhed
        </p>
      </div>

      {/* Sikkerhedsoversigt */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Sikkerhedsstatus</h2>
            <div className={`px-3 py-1 rounded-full text-sm ${
              securityStatus.passwordStrength >= 80
                ? 'bg-green-100 text-green-800'
                : securityStatus.passwordStrength >= 50
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {securityStatus.passwordStrength >= 80
                ? 'Stærk'
                : securityStatus.passwordStrength >= 50
                ? 'Moderat'
                : 'Svag'}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Key className="h-5 w-5 text-gray-500" />
                Adgangskodestyrke
              </span>
              <div className="w-32 h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-full rounded-full ${
                    securityStatus.passwordStrength >= 80
                      ? 'bg-green-500'
                      : securityStatus.passwordStrength >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${securityStatus.passwordStrength}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-gray-500" />
                To-faktor autentificering
              </span>
              {securityStatus.twoFactorEnabled ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="h-5 w-5 text-gray-500" />
                Sidste adgangskodeændring
              </span>
              <span className="text-sm text-gray-600">
                {securityStatus.lastPasswordChange
                  ? new Date(securityStatus.lastPasswordChange).toLocaleDateString()
                  : 'Aldrig'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Sikkerhedsalarmer</h2>
          {securityStatus.securityAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p>Ingen aktive sikkerhedsalarmer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {securityStatus.securityAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg"
                >
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">{alert.title}</p>
                    <p className="text-sm text-yellow-600">{alert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Adgangskode ændring */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="text-lg font-semibold mb-4">Skift adgangskode</h2>
        
        {!showPasswordChange ? (
          <button
            onClick={() => setShowPasswordChange(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Skift adgangskode
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nuværende adgangskode
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({
                  ...prev,
                  currentPassword: e.target.value
                }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ny adgangskode
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({
                  ...prev,
                  newPassword: e.target.value
                }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bekræft ny adgangskode
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({
                  ...prev,
                  confirmPassword: e.target.value
                }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Gem ny adgangskode
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Annuller
              </button>
            </div>
          </form>
        )}
      </div>

      {/* To-faktor autentificering */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">To-faktor autentificering</h2>
          <button
            onClick={handleToggle2FA}
            className={`px-4 py-2 rounded-lg ${
              securityStatus.twoFactorEnabled
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {securityStatus.twoFactorEnabled ? 'Deaktiver' : 'Aktiver'}
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          To-faktor autentificering tilføjer et ekstra lag af sikkerhed til din konto
          ved at kræve både din adgangskode og en kode fra din mobiltelefon for at logge ind.
        </p>

        {securityStatus.twoFactorEnabled && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-blue-800">
              To-faktor autentificering er aktiv. Du vil modtage en bekræftelseskode
              på din telefon, hver gang du logger ind.
            </p>
          </div>
        )}
      </div>

      {/* Aktive enheder */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Aktive enheder</h2>
        
        <div className="space-y-4">
          {securityStatus.activeDevices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  {device.type === 'mobile' ? (
                    <Smartphone className="h-5 w-5 text-gray-600" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{device.name}</p>
                  <p className="text-sm text-gray-500">
                    Sidst aktiv: {new Date(device.lastActive).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handle