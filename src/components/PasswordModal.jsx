import { useState } from 'preact/hooks';
import { resetAppData } from '../db';

export default function PasswordModal({
  onUnlock,
  onSetNewPassword,
  isFirstSetup = false
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
      setError(isFirstSetup 
        ? 'Fehler beim Setzen des Passworts' 
        : 'Falsches Passwort');
    } finally {
      setLoading(false);
    }
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmedReset = async () => {
    setShowResetConfirm(false);
    setResetLoading(true);

    try {
      await resetAppData();
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Zurücksetzen der Daten.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      {/* Haupt-Login Modal */}
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[90] backdrop-blur-md">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl w-full max-w-md mx-4">
          
          {/* Header */}
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
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white font-medium py-4 rounded-2xl transition mb-6"
            >
              {loading ? 'Entschlüssle...' : (isFirstSetup ? 'Passwort setzen' : 'Entsperren')}
            </button>
          </form>

          {/* Reset-Bereich */}
          {!isFirstSetup && (
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleResetClick}
                disabled={resetLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-800 transition-all text-sm font-medium"
              >
                {resetLoading ? (
                  'Daten werden gelöscht...'
                ) : (
                  <>🗑️ Passwort vergessen? App zurücksetzen</>
                )}
              </button>
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3">
                Alle Beobachtungsprotokolle werden unwiderruflich gelöscht
              </p>
            </div>
          )}
        </div>
      </div>

      {/* === Bestätigungs-Modal === */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[95] backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl w-full max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                ⚠️
              </div>
              <h3 className="text-xl font-semibold text-red-600 mb-2">
                Wirklich alle Daten löschen?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Diese Aktion kann <strong>nicht rückgängig gemacht</strong> werden.<br />
                Alle Schüler, Beobachtungen und Einstellungen gehen endgültig verloren.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3.5 border border-slate-300 dark:border-slate-600 rounded-2xl font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleConfirmedReset}
                  disabled={resetLoading}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-medium transition disabled:opacity-70"
                >
                  {resetLoading ? 'Wird gelöscht...' : 'Ja, alles löschen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}