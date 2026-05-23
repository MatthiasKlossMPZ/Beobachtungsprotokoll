import { useState } from 'preact/hooks';

export default function PasswordModal({ 
  onUnlock,      // wird aufgerufen bei erfolgreichem Passwort
  onSetNewPassword, // für ersten Start
  isFirstSetup = false 
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isFirstSetup) {
        if (password !== confirmPassword) {
          setError('Passwörter stimmen nicht überein');
          return;
        }
        await onSetNewPassword(password);
      } else {
        await onUnlock(password);
      }
    } catch (err) {
      console.error(err);
      setError(isFirstSetup ? 'Fehler beim Setzen des Passworts' : 'Falsches Passwort');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-blur-md">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isFirstSetup ? 'Passwort festlegen' : 'App entsperren'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {isFirstSetup 
              ? 'Dieses Passwort schützt alle deine Daten' 
              : 'Gib dein Passwort ein'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Passwort"
            className="w-full px-5 py-4 border border-slate-300 dark:border-slate-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            autoFocus
            required
          />

          {isFirstSetup && (
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Passwort bestätigen"
              className="w-full px-5 py-4 border border-slate-300 dark:border-slate-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
              required
            />
          )}

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white font-medium py-4 rounded-2xl transition"
          >
            {loading ? 'Entschlüssle...' : (isFirstSetup ? 'Passwort setzen' : 'Entsperren')}
          </button>
        </form>
      </div>
    </div>
  );
}