// Login / register / forgot / reset screens shared by the admin panel and the client portal.
import { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Field, Spinner, Seo } from '../../components/ui';

const pw = z.string().min(8, 'At least 8 characters').regex(/[A-Za-z]/, 'Add a letter').regex(/[0-9]/, 'Add a number');

function Shell({ portal, title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <Seo title={title} noindex />
      <div className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <img src="/images/hero-landmarks.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-950/80 to-navy-800/60" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3"><img src="/logo.jpg" alt="LN PAK LLC logo" className="h-14 rounded-xl bg-white p-1" /><span className="font-serif text-2xl font-bold">LN PAK LLC</span></Link>
          <div>
            <p className="eyebrow mb-3 text-gold-500">{portal === 'admin' ? 'Staff CRM' : 'Client Portal'}</p>
            <h2 className="max-w-md text-4xl text-white">{portal === 'admin' ? 'Manage leads, clients and the website in one place.' : 'Track your application, documents and messages.'}</h2>
          </div>
          <p className="flex items-center gap-2 text-sm text-white/60"><ShieldCheck className="h-4 w-4" />Secure, encrypted sign-in</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-navy-50 px-4 py-12 lg:bg-white">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-3 lg:hidden"><img src="/logo.jpg" alt="LN PAK LLC logo" className="h-12" /><span className="font-serif text-xl font-bold text-navy-900">LN PAK LLC</span></Link>
          <div className="card p-6 sm:p-8 lg:border-0 lg:shadow-none">
            <h1 className="text-2xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({ registration, placeholder = 'Password', autoComplete = 'current-password' }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} className="input pr-10" placeholder={placeholder} autoComplete={autoComplete} {...registration} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-2.5 text-slate-400" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
    </div>
  );
}

export function LoginPage({ portal }) {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [err, setErr] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(1, 'Enter your password') })),
  });
  const base = portal === 'admin' ? '/admin' : '/client';
  const submit = async (v) => {
    setErr('');
    try {
      await login(v.email, v.password, portal);
      nav(location.state?.from || base, { replace: true });
    } catch (e) { setErr(e.message); }
  };
  return (
    <Shell portal={portal} title={portal === 'admin' ? 'Staff sign in' : 'Client login'} subtitle={portal === 'admin' ? 'For LN PAK LLC team members.' : 'Welcome back — sign in to your portal.'}>
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <Field label="Email" error={errors.email?.message}><input className="input" type="email" autoComplete="email" {...register('email')} /></Field>
        <Field label="Password" error={errors.password?.message}><PasswordInput registration={register('password')} /></Field>
        {err && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">{err}</p>}
        <button className="btn-primary w-full py-3" disabled={isSubmitting}>{isSubmitting && <Spinner className="h-4 w-4 text-white" />}Sign in</button>
        <div className="flex justify-between text-sm">
          <Link to={`${base}/forgot-password`} className="font-semibold text-navy-700 hover:underline">Forgot password?</Link>
          {portal === 'client' && <Link to="/client/register" className="font-semibold text-navy-700 hover:underline">Create an account</Link>}
        </div>
        <Link to="/" className="flex items-center gap-1 pt-2 text-xs text-slate-500 hover:text-navy-900"><ArrowLeft className="h-3.5 w-3.5" />Back to website</Link>
      </form>
    </Shell>
  );
}

export function RegisterPage() {
  const { register: signup } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const schema = z.object({
    name: z.string().trim().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().trim().min(7, 'Enter a valid phone number'),
    password: pw,
    confirm: z.string(),
  }).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const submit = async ({ confirm, ...v }) => {
    setErr('');
    try { await signup(v); nav('/client', { replace: true }); } catch (e) { setErr(e.message); }
  };
  return (
    <Shell portal="client" title="Create your client account" subtitle="Track inquiries and applications online.">
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <Field label="Full name" error={errors.name?.message}><input className="input" autoComplete="name" {...register('name')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" error={errors.email?.message}><input className="input" type="email" autoComplete="email" {...register('email')} /></Field>
          <Field label="Phone / WhatsApp" error={errors.phone?.message}><input className="input" type="tel" autoComplete="tel" {...register('phone')} /></Field>
        </div>
        <Field label="Password" error={errors.password?.message} hint="At least 8 characters with letters and numbers"><PasswordInput registration={register('password')} autoComplete="new-password" /></Field>
        <Field label="Confirm password" error={errors.confirm?.message}><PasswordInput registration={register('confirm')} autoComplete="new-password" placeholder="Repeat password" /></Field>
        {err && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">{err}</p>}
        <button className="btn-primary w-full py-3" disabled={isSubmitting}>{isSubmitting && <Spinner className="h-4 w-4 text-white" />}Create account</button>
        <p className="text-center text-sm">Already have an account? <Link to="/client/login" className="font-semibold text-navy-700 hover:underline">Sign in</Link></p>
      </form>
    </Shell>
  );
}

export function ForgotPasswordPage({ portal }) {
  const [sent, setSent] = useState('');
  const [err, setErr] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(z.object({ email: z.string().email('Enter a valid email') })) });
  const submit = async (v) => {
    setErr('');
    try { const r = await api.post('/auth/forgot-password', v); setSent(r.data.data.message); } catch (e) { setErr(e.message); }
  };
  return (
    <Shell portal={portal} title="Reset your password" subtitle="We will email you a secure link.">
      {sent ? <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{sent}</p> : (
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <Field label="Email" error={errors.email?.message}><input className="input" type="email" {...register('email')} /></Field>
          {err && <p className="text-sm text-rose-700">{err}</p>}
          <button className="btn-primary w-full py-3" disabled={isSubmitting}>{isSubmitting && <Spinner className="h-4 w-4 text-white" />}Send reset link</button>
        </form>
      )}
      <Link to={portal === 'admin' ? '/admin/login' : '/client/login'} className="mt-4 inline-block text-sm font-semibold text-navy-700 hover:underline">Back to sign in</Link>
    </Shell>
  );
}

export function ResetPasswordPage({ portal }) {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const schema = z.object({ password: pw, confirm: z.string() }).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const submit = async (v) => {
    setErr('');
    try { await api.post('/auth/reset-password', { token: params.get('token'), password: v.password }); setDone(true); } catch (e) { setErr(e.message); }
  };
  const loginPath = portal === 'admin' ? '/admin/login' : '/client/login';
  return (
    <Shell portal={portal} title="Set a new password" subtitle="Choose a strong password you have not used before.">
      {done ? (
        <div className="space-y-4"><p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Your password has been set. You can now sign in.</p><button className="btn-primary w-full" onClick={() => nav(loginPath)}>Go to sign in</button></div>
      ) : !params.get('token') ? <p className="text-sm text-rose-700">This link is missing its token. Please use the link from your email.</p> : (
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <Field label="New password" error={errors.password?.message} hint="At least 8 characters with letters and numbers"><PasswordInput registration={register('password')} autoComplete="new-password" /></Field>
          <Field label="Confirm password" error={errors.confirm?.message}><PasswordInput registration={register('confirm')} autoComplete="new-password" placeholder="Repeat password" /></Field>
          {err && <p className="text-sm text-rose-700" role="alert">{err}</p>}
          <button className="btn-primary w-full py-3" disabled={isSubmitting}>{isSubmitting && <Spinner className="h-4 w-4 text-white" />}Save password</button>
        </form>
      )}
    </Shell>
  );
}
