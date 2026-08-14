import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 'otp') {
      otpRefs.current[0]?.focus();
    }
  }, [step]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only keep the last character typed
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) return;
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // For demo, if phone is 9999999999, go to admin, else citizen
      if (phone === '9999999999') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center px-4 bg-gray-50 dark:bg-[#0F1620]">
      <div className="w-full max-w-md animate-slide-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white mb-4">
            <Shield size={28} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to Nagrik Setu</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Login to track your grievances or file a new one.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{step === 'phone' ? 'Enter Mobile Number' : 'Verify OTP'}</CardTitle>
            <CardDescription>
              {step === 'phone' 
                ? 'We will send a 6-digit One Time Password to this number.' 
                : `Enter the OTP sent to +91 ${phone}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mobile Number
                  </label>
                  <div className="flex">
                    <div className="flex-shrink-0 flex items-center px-3 border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#0F1620] text-gray-500 rounded-l-md text-sm">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter 10-digit number"
                      className="rounded-l-none"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={phone.length < 10} isLoading={isLoading}>
                  Send OTP
                </Button>
                <div className="text-center mt-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Admin Demo: Use <span className="font-semibold">9999999999</span><br/>
                    Customer Demo: Use <span className="font-semibold">8888888888</span>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-lg font-bold"
                    />
                  ))}
                </div>
                <Button type="submit" className="w-full" disabled={otp.join('').length < 6} isLoading={isLoading}>
                  Verify & Proceed
                  <ArrowRight size={18} className="ml-2" />
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => setStep('phone')} className="text-sm text-primary dark:text-blue-400 font-medium hover:underline">
                    Change Mobile Number
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
