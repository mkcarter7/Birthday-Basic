'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import PageHeader from '@/components/PageHeader';
import PhotoCarousel from '@/components/PhotoCarousel';
import { useAuth } from '@/utils/context/authContext';
import { signIn } from '@/utils/auth';
import { useParty } from '@/utils/context/partyContext';

export default function PhotosPage() {
  const config = useParty();
  const { user, userLoading } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
    const randomInRange = (min, max) => Math.random() * (max - min) + min;
    const confettiColors = [
      config.secondaryColor || '#8B5CF6',
      config.primaryColor || '#3B82F6',
      config.accentColor || '#F59E0B',
      '#10B981', '#EC4899', '#FBBF24',
    ];

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) { clearInterval(interval); return; }
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: confettiColors });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: confettiColors });
    }, 250);

    return () => clearInterval(interval);
  }, [config.primaryColor, config.secondaryColor, config.accentColor]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append('party', config.id);

    setUploading(true);
    setMessage('');

    try {
      const token = await user.getIdToken(true);
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Photo uploaded successfully!');
        e.target.reset();
        window.location.reload();
      } else {
        setMessage(`Upload failed: ${data.detail || data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (userLoading) {
    return (
      <main className="page">
        <PageHeader title="Party Photos" subtitle="Upload and browse shared memories" />
        <div className="card">
          <div className="muted">Loading...</div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page">
        <PageHeader title="Party Photos" subtitle="Upload and browse shared memories" />
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <h3>Sign in to upload photos</h3>
          <p>You need to sign in with Google to upload photos to the party gallery.</p>
          <button type="button" onClick={signIn} className="tile tile-purple" style={{ height: 48, border: 'none' }}>
            Sign in with Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <PageHeader title="Party Photos" subtitle="Upload and browse shared memories" />
      <PhotoCarousel enableDeletion />

      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <h3>Upload a Photo</h3>
        <form onSubmit={handleUpload} style={{ display: 'grid', gap: 12 }}>
          <input type="file" name="image" accept="image/*" required style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }} />
          <button type="submit" disabled={uploading} className="tile tile-purple" style={{ height: 48, border: 'none' }}>
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </button>
        </form>
        {message && <p style={{ color: message.includes('success') ? 'green' : 'red', margin: 0 }}>{message}</p>}
      </div>

      <div className="card">
        <p>Browse photos in the gallery above or upload new ones here.</p>
      </div>
    </main>
  );
}
