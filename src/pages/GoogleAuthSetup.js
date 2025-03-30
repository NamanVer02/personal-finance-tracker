import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function GoogleAuthSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract twoFactorSetup data from location state
  const twoFactorSetup = location.state?.twoFactorSetup || {};
  const { secret, qrCodeBase64 } = twoFactorSetup;

  const handleContinue = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-gray-100 p-8 rounded-lg shadow-neumorphic max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-700">Set Up Two-Factor Authentication</h1>
          <p className="text-sm text-gray-500 mt-2">
            Secure your account with Google Authenticator
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Step-by-step Instructions */}
          <div className="space-y-6 mb-8 md:w-1/2">
            <div className="flex items-start">
              <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Download Google Authenticator</h3>
                <p className="text-sm text-gray-600">
                  Install the Google Authenticator app from the App Store (iOS) or Play Store (Android) on your mobile device.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Scan the QR Code</h3>
                <p className="text-sm text-gray-600">
                  Open Google Authenticator, tap the "+" icon, and select "Scan a QR code". Then scan the QR code displayed on the right.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Use the Code to Sign In</h3>
                <p className="text-sm text-gray-600">
                  Next time you log in, you'll need to enter the 6-digit code from the Google Authenticator app along with your password.
                </p>
              </div>
            </div>
          </div>

          {/* QR Code and Secret Display */}
          <div className="md:w-1/2 flex flex-col items-center justify-center">
            {qrCodeBase64 && (
              <div className="mb-6 text-center">
                <img 
                  src={`data:image/png;base64,${qrCodeBase64}`} 
                  alt="Google Authenticator QR Code" 
                  className="w-48 h-48 shadow-neumorphic mx-auto"
                />
              </div>
            )}
            
            {secret && (
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  If you can't scan the QR code, enter this secret key manually:
                </p>
                <div className="bg-gray-100 p-3 rounded-lg font-mono text-center break-all shadow-neumorphic-inset">
                  {secret}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg shadow-neumorphic-purple mb-4"
        >
          Continue to Login
        </button>

        <p className="text-xs text-gray-500 text-center">
          If you lose access to your authenticator app, contact support for assistance.
        </p>
      </div>
    </div>
  );
}