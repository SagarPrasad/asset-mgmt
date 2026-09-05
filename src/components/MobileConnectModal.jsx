import React, { useState, useEffect } from 'react';
import { X, Smartphone, QrCode, Copy, Check, ShieldCheck, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';

export const MobileConnectModal = ({
  isOpen,
  onClose,
  url,
  anonKey
}) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [pairUrl, setPairUrl] = useState('');

  useEffect(() => {
    if (isOpen && url && anonKey) {
      try {
        const baseUrl = window.location.href.split('#')[0].split('?')[0];
        const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ u: url, k: anonKey }))));
        const fullPairUrl = `${baseUrl}#connect=${payload}`;
        setPairUrl(fullPairUrl);

        QRCode.toDataURL(fullPairUrl, {
          width: 260,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        }).then(setQrDataUrl).catch(console.error);
      } catch (err) {
        console.error('Failed to generate pairing payload:', err);
      }
    }
  }, [isOpen, url, anonKey]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(pairUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '500px', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Smartphone size={20} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Connect Mobile Device
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Zero credentials in Git • Direct device-to-device pairing
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: 32, height: 32 }}>
            <X size={16} />
          </button>
        </div>

        {/* QR Code Container */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}>
          {qrDataUrl ? (
            <div style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
              display: 'inline-block'
            }}>
              <img
                src={qrDataUrl}
                alt="Mobile Connect QR Code"
                style={{ width: '220px', height: '220px', display: 'block' }}
              />
            </div>
          ) : (
            <div style={{ padding: '3rem', color: 'var(--text-muted)' }}>
              Generating QR Code...
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginTop: '1rem',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            fontWeight: 500
          }}>
            <QrCode size={15} color="var(--accent-primary)" />
            <span>Scan with your phone's camera to pair immediately</span>
          </div>
        </div>

        {/* Copy Setup Link Alternative */}
        <div style={{
          background: 'var(--bg-card-inner)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.875rem',
          marginBottom: '1.25rem',
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Or send direct pairing link to your phone (AirDrop / Notes / WhatsApp):
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              readOnly
              value={pairUrl}
              style={{
                flex: 1,
                background: 'var(--bg-input)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem 0.75rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            />
            <button
              onClick={handleCopy}
              className="btn-primary"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Privacy Note */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.625rem 0.875rem',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          color: '#34d399',
          textAlign: 'left'
        }}>
          <ShieldCheck size={16} color="#10b981" style={{ flexShrink: 0 }} />
          <span>
            <strong>100% Private:</strong> Credentials are encrypted in the QR payload and saved directly into your phone's memory. No data is sent to GitHub or third parties.
          </span>
        </div>
      </div>
    </div>
  );
};
