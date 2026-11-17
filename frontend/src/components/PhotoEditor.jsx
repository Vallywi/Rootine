import { useRef, useState } from 'react';
import * as api from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import Avatar, { shrinkToJpeg } from './Avatar.jsx';
import { FormError } from './ui.jsx';

// Choose, replace, or remove the profile photo.
export default function PhotoEditor() {
  const { user, updateUser, sessionEnded } = useAuth();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn) => {
    setError(''); setBusy(true);
    try { updateUser({ ...user, avatarUrl: (await fn()).avatarUrl }); }
    catch (err) {
      if (err.status === 401) sessionEnded();
      setError(err.message || 'Could not save the photo.');
    } finally { setBusy(false); }
  };

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // picking the same file again should still fire
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please choose a picture (JPG, PNG, or WebP).'); return; }
    await run(async () => {
      let blob;
      try { blob = await shrinkToJpeg(file); }
      catch { throw new Error('This picture could not be read. Try a JPG or PNG.'); }
      return api.upload('PUT', '/auth/avatar', blob);
    });
  };

  return (
    <div className="photo-editor">
      <Avatar name={user.displayName} url={user.avatarUrl} size={88} />
      <div className="stack stack--tight">
        <input ref={input} type="file" accept="image/*" className="visually-hidden" aria-label="Choose a profile photo" onChange={onPick} tabIndex={-1} />
        <button type="button" className="btn btn--small" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? 'Saving...' : user.avatarUrl ? 'Change photo' : 'Add a photo'}
        </button>
        {user.avatarUrl && (
          <button type="button" className="btn btn--ghost btn--small" disabled={busy} onClick={() => run(() => api.del('/auth/avatar'))}>Remove photo</button>
        )}
        <p className="muted small">Your friends can see this photo and your nickname. Nothing else.</p>
      </div>
      <FormError>{error}</FormError>
    </div>
  );
}
