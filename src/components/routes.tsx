import { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import { PrivateRoute, PublicRoute } from '@/components/auth/RouteGuards';

// Lazy loaded components
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const InboxPage = lazy(() => import('@/pages/email/InboxPage'));
const ComposePage = lazy(() => import('@/pages/email/ComposePage'));
const EmailDetailPage = lazy(() => import('@/pages/email/EmailDetailPage'));
const DraftsPage = lazy(() => import('@/pages/email/DraftsPage'));
const SentPage = lazy(() => import('@/pages/email/SentPage'));
const TrashPage = lazy(() => import('@/pages/email/TrashPage'));
const SpamPage = lazy(() => import('@/pages/email/SpamPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const ContactsPage = lazy(() => import('@/pages/contacts/ContactsPage'));
const CalendarPage = lazy(() => import('@/pages/calendar/CalendarPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Wrapper for lazy loaded components
const withSuspense = (Component: React.LazyExoticComponent<() => JSX.Element>) => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Component />
    </Suspense>
  );
};

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <PublicRoute>{withSuspense(LoginPage)}</PublicRoute>,
      },
      {
        path: 'register',
        element: <PublicRoute>{withSuspense(RegisterPage)}</PublicRoute>,
      },
      {
        path: 'forgot-password',
        element: <PublicRoute>{withSuspense(ForgotPasswordPage)}</PublicRoute>,
      },
      {
        path: 'reset-password',
        element: <PublicRoute>{withSuspense(ResetPasswordPage)}</PublicRoute>,
      },
    ],
  },
  {
    path: '/',
    element: <PrivateRoute><MainLayout /></PrivateRoute>,
    children: [
      {
        path: '/',
        element: withSuspense(InboxPage),
      },
      {
        path: 'inbox',
        element: withSuspense(InboxPage),
      },
      {
        path: 'compose',
        element: withSuspense(ComposePage),
      },
      {
        path: 'email/:id',
        element: withSuspense(EmailDetailPage),
      },
      {
        path: 'drafts',
        element: withSuspense(DraftsPage),
      },
      {
        path: 'sent',
        element: withSuspense(SentPage),
      },
      {
        path: 'trash',
        element: withSuspense(TrashPage),
      },
      {
        path: 'spam',
        element: withSuspense(SpamPage),
      },
      {
        path: 'contacts',
        element: withSuspense(ContactsPage),
      },
      {
        path: 'calendar',
        element: withSuspense(CalendarPage),
      },
      {
        path: 'settings',
        element: withSuspense(SettingsPage),
      },
    ],
  },
  {
    path: '*',
    element: withSuspense(NotFoundPage),
  },
];

export default routes;