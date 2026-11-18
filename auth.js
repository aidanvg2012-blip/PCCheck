/* PCCheck account authentication — Supabase Auth */
(() => {
  'use strict';
  const SUPABASE_URL = 'https://rtssojyophcgybdhhqzz.supabase.co';
  // Publishable browser key. This key is designed for public client-side use.
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_kK8xaomzreBOVF4Dnvy4UQ_uuVvLWH3';
  if (!window.supabase?.createClient) {
    const button = document.getElementById('accountOpenButton');
    if (button) { button.textContent = 'Accounts unavailable'; button.disabled = true; }
    return;
  }
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const $ = id => document.getElementById(id);
  let mode = 'signin';

  function setStatus(message, kind='info') {
    const el = $('accountStatus');
    if (!el) return;
    el.textContent = message;
    el.className = 'message ' + kind;
  }
  function openModal() {
    const modal = $('accountModal');
    if (modal) modal.hidden = false;
    refreshAccount();
  }
  function closeModal() {
    const modal = $('accountModal');
    if (modal) modal.hidden = true;
  }
  function setMode(nextMode) {
    mode = nextMode;
    $('accountTitle').textContent = mode === 'signup' ? 'Create your account' : 'Sign in to PCCheck';
    $('accountSubmit').textContent = mode === 'signup' ? 'Create account' : 'Sign in';
    $('accountModeToggle').textContent = mode === 'signup' ? 'Already have an account? Sign in' : 'New to PCCheck? Create an account';
    $('accountConsentRow').hidden = mode !== 'signup';
    $('accountPassword').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    $('accountPassword').minLength = mode === 'signup' ? 10 : 1;
    setStatus('');
  }
  async function getSession() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  }
  async function refreshAccount() {
    try {
      const session = await getSession();
      const signedIn = Boolean(session?.user);
      if (!signedIn) {
        if (window.PCCheckAuth) window.PCCheckAuth.hasPlus = false;
        window.dispatchEvent(new CustomEvent('pccheck:membership', { detail: { hasPlus: false } }));
      }
      $('accountManageBilling').hidden = true;
      $('accountSignedOut').hidden = signedIn;
      $('accountSignedIn').hidden = !signedIn;
      $('accountOpenButton').textContent = signedIn ? 'My account' : 'Sign in';
      if (!signedIn && window.PCCheckAuth) window.PCCheckAuth.hasPlus = false;
      if (signedIn) {
        $('accountEmailDisplay').textContent = session.user.email || 'Signed-in account';
        $('accountPlusStatus').textContent = 'Checking Plus access…';
        try {
          const response = await fetch('/api/plus-status', {
            headers: { Authorization: 'Bearer ' + session.access_token }
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || 'Could not check membership.');
          if (window.PCCheckAuth) window.PCCheckAuth.hasPlus = Boolean(result.hasPlus);
          window.dispatchEvent(new CustomEvent('pccheck:membership', { detail: { hasPlus: Boolean(result.hasPlus) } }));
          const periodEnd = result.currentPeriodEnd
            ? new Date(result.currentPeriodEnd).toLocaleDateString()
            : null;
          if (result.hasPlus && result.cancelAtPeriodEnd) {
            $('accountPlusStatus').textContent = 'Plus is active · cancellation scheduled' + (periodEnd ? ' for ' + periodEnd + '.' : '.');
          } else if (result.hasPlus) {
            $('accountPlusStatus').textContent = 'PCCheck Plus is active' + (periodEnd ? ' · next billing date ' + periodEnd + '.' : '.');
          } else if (result.status === 'past_due' || result.status === 'unpaid') {
            $('accountPlusStatus').textContent = 'Payment needs attention · Plus access is paused. Open billing management to review the test subscription.';
          } else if (result.status === 'canceled') {
            $('accountPlusStatus').textContent = 'Subscription canceled · Free account.';
          } else {
            $('accountPlusStatus').textContent = 'Free account · Plus is not active.';
          }
          $('accountManageBilling').hidden = !result.hasCustomer;
        } catch (error) {
          if (window.PCCheckAuth) window.PCCheckAuth.hasPlus = false;
          window.dispatchEvent(new CustomEvent('pccheck:membership', { detail: { hasPlus: false } }));
          $('accountPlusStatus').textContent = 'Membership status is temporarily unavailable.';
        }
      }
    } catch (error) {
      if (window.PCCheckAuth) window.PCCheckAuth.hasPlus = false;
      window.dispatchEvent(new CustomEvent('pccheck:membership', { detail: { hasPlus: false } }));
      $('accountOpenButton').textContent = 'Sign in';
      setStatus('Could not check your session. Refresh the page and try again.', 'error');
    }
  }

  $('accountOpenButton')?.addEventListener('click', openModal);
  $('accountCloseButton')?.addEventListener('click', closeModal);
  $('accountModal')?.addEventListener('click', event => {
    if (event.target === $('accountModal')) closeModal();
  });
  $('accountModeToggle')?.addEventListener('click', () => setMode(mode === 'signup' ? 'signin' : 'signup'));
  $('accountForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const email = $('accountEmail').value.trim();
    const password = $('accountPassword').value;
    const consent = $('accountConsent').checked;
    const submit = $('accountSubmit');
    submit.disabled = true;
    setStatus(mode === 'signup' ? 'Creating your account…' : 'Signing in…');
    try {
      if (mode === 'signup') {
        if (!consent) throw new Error('Please confirm the age and permission statement first.');
        if (password.length < 10) throw new Error('Use a password with at least 10 characters.');
        const { data, error } = await client.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + '/' }
        });
        if (error) throw error;
        if (!data.session) {
          setStatus('Account created. Check your email for a confirmation link, then sign in.', 'success');
          $('accountForm').reset();
        } else {
          setStatus('Account created and signed in.', 'success');
          await refreshAccount();
        }
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setStatus('Signed in successfully.', 'success');
        await refreshAccount();
      }
    } catch (error) {
      setStatus(error.message || 'Account request failed. Please try again.', 'error');
    } finally {
      submit.disabled = false;
    }
  });
  $('accountManageBilling')?.addEventListener('click', async () => {
    const button = $('accountManageBilling');
    button.disabled = true;
    try {
      const session = await getSession();
      if (!session?.access_token) throw new Error('Sign in again to manage billing.');
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + session.access_token }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw new Error(result.error || 'Billing management is unavailable.');
      window.location.assign(result.url);
    } catch (error) {
      setStatus(error.message || 'Could not open billing management.', 'error');
    } finally {
      button.disabled = false;
    }
  });
  $('accountSignOut')?.addEventListener('click', async () => {
    const button = $('accountSignOut');
    button.disabled = true;
    const { error } = await client.auth.signOut();
    button.disabled = false;
    if (error) setStatus('Could not sign out. Please try again.', 'error');
    else {
      setMode('signin');
      setStatus('You are signed out.', 'success');
      await refreshAccount();
    }
  });

  client.auth.onAuthStateChange(() => {
    window.setTimeout(refreshAccount, 0);
  });
  window.PCCheckAuth = { getSession, openModal, refreshAccount, hasPlus: false };
  setMode('signin');
  refreshAccount();
  if (window.location.hash === '#account') openModal();
})();