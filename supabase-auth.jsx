/* MFM Research Hub — Supabase Auth helpers (Phase 5)
   Real email/password sign-in via Supabase Auth.
   Links authenticated users to their people row.
*/

window.AuthService = {
  // Get current session synchronously (after init)
  getSession() {
    return this._session;
  },

  // Get current user's linked people row
  getCurrentPerson() {
    return this._person;
  },

  // Listen for auth state changes
  onChange(cb) {
    this._listeners = this._listeners || [];
    this._listeners.push(cb);
    return () => { this._listeners = this._listeners.filter(l => l !== cb); };
  },

  _notify() {
    (this._listeners || []).forEach(cb => cb(this._session, this._person));
  },

  // Init — call once at startup
  async init() {
    if (!window.__sb) {
      console.warn('[Auth] Supabase client not ready');
      return;
    }
    const { data: { session } } = await window.__sb.auth.getSession();
    this._session = session;
    if (session) {
      await this._loadPerson();
    }
    // Listen for future changes
    window.__sb.auth.onAuthStateChange(async (event, session) => {
      this._session = session;
      if (session) {
        await this._loadPerson();
      } else {
        this._person = null;
      }
      this._notify();
    });
  },

  async _loadPerson() {
    if (!this._session) { this._person = null; return; }
    const userId = this._session.user.id;
    const userEmail = this._session.user.email;

    // First try by auth_user_id
    let { data: person } = await window.__sb.from('people')
      .select('*').eq('auth_user_id', userId).maybeSingle();

    // Not linked yet — try by email and auto-link
    if (!person && userEmail) {
      const { data: byEmail } = await window.__sb.from('people')
        .select('*').eq('email', userEmail).maybeSingle();
      if (byEmail) {
        // Link this auth user to that person
        const { data: linked } = await window.__sb.from('people')
          .update({ auth_user_id: userId }).eq('id', byEmail.id).select().single();
        person = linked || byEmail;
      }
    }

    if (person) {
      // Map to app shape
      this._person = {
        id: person.id,
        name: person.name,
        initials: person.initials,
        role: person.role,
        training: person.training,
        email: person.email,
        color: person.color,
        joined: person.joined ? person.joined.slice(0, 7) : '',
        focus: person.focus,
        bio: person.bio,
        hasPhoto: person.has_photo,
        hasCV: person.has_cv,
      };
    } else {
      // Authenticated but no people row — create a placeholder
      this._person = {
        id: userId, name: userEmail || 'New user', initials: (userEmail || '?').slice(0, 2).toUpperCase(),
        role: 'Collaborator', training: 'Pending', email: userEmail, color: '#495965', joined: '', focus: '',
      };
    }
  },

  async signIn(email, password) {
    if (!window.__sb) throw new Error('Supabase not initialized');
    const { data, error } = await window.__sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email, password) {
    if (!window.__sb) throw new Error('Supabase not initialized');
    const { data, error } = await window.__sb.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!window.__sb) return;
    await window.__sb.auth.signOut();
  },

  async resetPassword(email) {
    if (!window.__sb) throw new Error('Supabase not initialized');
    const { error } = await window.__sb.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
};
