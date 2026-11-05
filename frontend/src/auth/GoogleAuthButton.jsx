import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../api";

export default function GoogleAuthButton({ onSuccess, onError, text = "Continue with Google" }) {
  const [loading, setLoading] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const buttonContainerRef = useRef(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!googleClientId) return;

    // Load Google Identity Services script if not already present
    if (!window.google || !window.google.accounts) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    } else {
      initializeGoogle();
    }

    function initializeGoogle() {
      if (window.google?.accounts?.id && buttonContainerRef.current) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
        });
      }
    }

    async function handleCredentialResponse(response) {
      if (!response?.credential) {
        if (onError) onError("No credential returned from Google.");
        return;
      }

      setLoading(true);
      try {
        const data = await apiRequest("/api/auth/google", {
          method: "POST",
          body: { credential: response.credential },
        });

        if (onSuccess) {
          onSuccess(data);
        }
      } catch (err) {
        if (onError) onError(err.message || "Google authentication failed.");
      } finally {
        setLoading(false);
      }
    }
  }, [googleClientId, onSuccess, onError]);

  const handleManualClick = () => {
    if (!googleClientId) {
      setConfigModalOpen(true);
    }
  };

  return (
    <div className="google-auth-wrapper">
      {googleClientId ? (
        <div ref={buttonContainerRef} className="google-gis-btn-container">
          {loading && <p className="google-auth-loading">Verifying with Google...</p>}
        </div>
      ) : (
        <button
          type="button"
          className="google-signin-btn"
          onClick={handleManualClick}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{text}</span>
        </button>
      )}

      {configModalOpen && (
        <div className="modal-backdrop" onClick={() => setConfigModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Google OAuth Setup</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setConfigModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                Google Sign-In is fully implemented in the CarbonTrack frontend and backend!
              </p>
              <div className="oauth-guide-box">
                <h4>To enable your Google Client ID:</h4>
                <ol>
                  <li>
                    Visit{" "}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google Cloud Console Credentials
                    </a>
                  </li>
                  <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web application)</li>
                  <li>
                    Add <code>http://localhost:5173</code> to Authorized JavaScript Origins
                  </li>
                  <li>
                    Add your Client ID to <code>frontend/.env</code>:
                    <pre>VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</pre>
                  </li>
                </ol>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-primary"
                onClick={() => setConfigModalOpen(false)}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
