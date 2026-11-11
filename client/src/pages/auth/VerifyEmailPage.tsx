import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MessageSquare, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing email verification token.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(res.message || 'Email verified successfully!');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Verification token is invalid or has expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-900 to-brand-600 flex items-center justify-center text-white mx-auto shadow-md">
          <MessageSquare className="w-6 h-6" />
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-5 text-center">
          {status === 'verifying' && (
            <div className="space-y-3 py-6">
              <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">Verifying Your Email...</h2>
              <p className="text-xs text-slate-500">Please wait while we confirm your official address.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-brand-600 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">Email Confirmed!</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thank you! Your official email has been verified. Your business application has been submitted to the Super Admin review queue.
              </p>
              <div className="pt-2">
                <Link
                  to="/application-status"
                  className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-6 rounded-xl text-xs transition-all shadow-md"
                >
                  <span>Check Application Status</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 py-4">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">Verification Failed</h2>
              <p className="text-xs text-rose-700">{message}</p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-brand-700 hover:underline"
                >
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

