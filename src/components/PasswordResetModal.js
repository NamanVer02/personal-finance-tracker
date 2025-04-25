import React, { useState } from 'react';
import { toast } from 'react-toastify';

const PasswordResetModal = ({ isOpen, onClose, username = '' }) => {
  const [step, setStep] = useState(1); // Step 1: Username, Step 2: 2FA code and new password
  const [usernameInput, setUsernameInput] = useState(username);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle the initial forgot password request
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!usernameInput.trim()) {
      toast.error('Please enter your username');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://localhost:8080/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usernameInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      toast.success('Password reset initiated.');
      setStep(2);
    } catch (error) {
      toast.error(error.message || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle the password reset with 2FA
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!twoFactorCode.trim()) {
      toast.error('Please enter the 2FA code');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://localhost:8080/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: usernameInput,
          twoFactorCode: parseInt(twoFactorCode, 10) || null, // Convert to integer as per your API requirement
          newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      toast.success('Password has been reset successfully');
      onClose();
      setStep(1);
      setNewPassword('');
      setConfirmNewPassword('');
      setTwoFactorCode('');
    } catch (error) {
      toast.error(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-100 p-6 rounded-lg w-96 max-w-md relative">
        <button
          onClick={() => {
            setStep(1);
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {step === 1
              ? 'Enter your username to reset your password'
              : 'Enter the 2FA code and your new password'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label
                htmlFor="username-reset"
                className="block text-sm font-medium text-gray-600"
              >
                Username
              </label>
              <input
                type="text"
                id="username-reset"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="mt-1 block w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg shadow-neumorphic-purple"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label
                htmlFor="twoFactorCode"
                className="block text-sm font-medium text-gray-600"
              >
                2FA Code
              </label>
              <input
                type="text"
                id="twoFactorCode"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className="mt-1 block w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2"
                required
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-600"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmNewPassword"
                className="block text-sm font-medium text-gray-600"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg shadow-neumorphic-purple"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PasswordResetModal;