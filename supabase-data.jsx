/* MFM Research Hub — Supabase write layer (Phase 4)
   Helpers that mutate Supabase tables and refresh the in-memory arrays.
   Components call these instead of mutating local React state alone.
*/

const sb = () => window.__sb;

// Refresh data from Supabase after a mutation
const refreshAll = async () => {
  const [peopleRes, projectsRes, membersRes, pubsRes, milestonesRes, updatesRes, commentsRes, tasksRes] = await Promise.all([
    sb().from('people').select('*').order('joined', { ascending: true }),
    sb().from('projects').select('*').order('start_date', { ascending: true }),
    sb().from('project_members').select('*'),
    sb().from('publications').select('*').order('year', { ascending: false }),
    sb().from('milestones').select('*').order('due_date', { ascending: true }),
    sb().from('progress_updates').select('*').order('created_at', { ascending: false }),
    sb().from('comments').select('*').order('created_at', { ascending: true }),
    sb().from('tasks').select('*').order('created_at', { ascending: false }),
  ]);

  if (peopleRes.data) {
    const people = peopleRes.data.map(p => ({
      id: p.id, name: p.name, initials: p.initials, role: p.role, training: p.training,
      email: p.email, color: p.color, joined: p.joined ? p.joined.slice(0, 7) : '',
      focus: p.focus, bio: p.bio, hasPhoto: p.has_photo, hasCV: p.has_cv, pubmedAuthor: p.pubmed_author,
      authUserId: p.auth_user_id, isAdmin: p.is_admin, isApproved: p.is_approved,
    }));
    window.PEOPLE.length = 0; people.forEach(p => window.PEOPLE.push(p));
  }
  if (projectsRes.data && membersRes.data) {
    const membersByProject = {};
    membersRes.data.forEach(m => {
      if (!membersByProject[m.project_id]) membersByProject[m.project_id] = [];
      membersByProject[m.project_id].push(m.person_id);
    });
    const projects = projectsRes.data.map(p => ({
      id: p.id, title: p.title, acronym: p.acronym, description: p.description,
      category: p.category, studyDesign: p.study_design, status: p.status, health: p.health,
      priority: p.priority, progress: p.progress, pi: p.pi_id, lead: p.lead_id,
      members: membersByProject[p.id] || [], reb: p.reb, rebExpiry: p.reb_expiry,
      dataSource: p.data_source, targetJournal: p.target_journal, start: p.start_date, target: p.target_date,
      bin: p.bin, coverColor: p.cover_color, awaitingUpdate: p.awaiting_update,
      awaitingReview: p.awaiting_review, lastUpdate: p.last_update_date, nextMilestone: p.next_milestone,
      nextDue: p.next_due, fileCount: p.file_count,
    }));
    window.PROJECTS.length = 0; projects.forEach(p => window.PROJECTS.push(p));
  }
  if (pubsRes && pubsRes.data) {
    const publications = pubsRes.data.map(p => ({
      id: p.id, pmid: p.pmid, doi: p.doi, title: p.title, authors: p.authors,
      journal: p.journal, year: p.year, month: p.month, volume: p.volume, pages: p.pages,
      type: p.type, status: p.status, source: p.source, addedBy: p.added_by,
    }));
    window.PUBLICATIONS.length = 0; publications.forEach(p => window.PUBLICATIONS.push(p));
    // Notify subscribers
    window.__pubChangeListeners?.forEach(cb => { try { cb(); } catch (e) {} });
  }
  if (milestonesRes && milestonesRes.data) {
    Object.keys(window.MILESTONES).forEach(k => delete window.MILESTONES[k]);
    milestonesRes.data.forEach(m => {
      const mapped = {
        id: m.id, projectId: m.project_id, title: m.title,
        owner: m.owner_id, due: m.due_date, status: m.status,
        completed: m.completed_at ? m.completed_at.slice(0, 10) : null,
        notes: m.notes, displayOrder: m.display_order,
      };
      if (!window.MILESTONES[m.project_id]) window.MILESTONES[m.project_id] = [];
      window.MILESTONES[m.project_id].push(mapped);
    });
  }

  if (updatesRes && updatesRes.data) {
    window.UPDATES.length = 0;
    updatesRes.data.forEach(u => {
      window.UPDATES.push({
        id: u.id, project: u.project_id, user: u.user_id,
        completed: u.completed_since_last_update, inProgress: u.currently_working_on,
        barriers: u.barriers, helpNeeded: u.help_needed, next: u.next_steps,
        percent: u.percent_complete, piStatus: u.pi_response_status,
        piResponseText: u.pi_response_text,
        date: u.created_at ? new Date(u.created_at).toLocaleDateString('en-CA') : '',
        createdAt: u.created_at,
      });
    });
  }

  if (commentsRes && commentsRes.data) {
    window.COMMENTS = { byUpdate: {}, byProject: {} };
    commentsRes.data.forEach(c => {
      const mapped = {
        id: c.id, updateId: c.update_id, projectId: c.project_id,
        userId: c.user_id, text: c.comment_text, createdAt: c.created_at,
      };
      if (c.update_id) {
        if (!window.COMMENTS.byUpdate[c.update_id]) window.COMMENTS.byUpdate[c.update_id] = [];
        window.COMMENTS.byUpdate[c.update_id].push(mapped);
      }
      if (c.project_id) {
        if (!window.COMMENTS.byProject[c.project_id]) window.COMMENTS.byProject[c.project_id] = [];
        window.COMMENTS.byProject[c.project_id].push(mapped);
      }
    });
  }

  if (tasksRes && tasksRes.data) {
    Object.keys(window.TASKS).forEach(k => delete window.TASKS[k]);
    tasksRes.data.forEach(t => {
      const mapped = {
        id: t.id, projectId: t.project_id, title: t.title, description: t.description,
        owner: t.owner_id, priority: t.priority, status: t.status,
        due: t.due_date, completed: t.completed_at ? t.completed_at.slice(0, 10) : null,
      };
      if (!window.TASKS[t.project_id]) window.TASKS[t.project_id] = [];
      window.TASKS[t.project_id].push(mapped);
    });
  }
};

// Map app field names to Supabase column names
const PROJECT_FIELD_MAP = {
  title: 'title', acronym: 'acronym', description: 'description', category: 'category',
  studyDesign: 'study_design', status: 'status', health: 'health', priority: 'priority',
  progress: 'progress', pi: 'pi_id', lead: 'lead_id', reb: 'reb', rebExpiry: 'reb_expiry',
  dataSource: 'data_source', targetJournal: 'target_journal', start: 'start_date', target: 'target_date',
  bin: 'bin', coverColor: 'cover_color', awaitingUpdate: 'awaiting_update',
  awaitingReview: 'awaiting_review', lastUpdate: 'last_update_date', nextMilestone: 'next_milestone',
  nextDue: 'next_due', fileCount: 'file_count',
};

const PERSON_FIELD_MAP = {
  name: 'name', initials: 'initials', role: 'role', training: 'training', email: 'email',
  color: 'color', joined: 'joined', focus: 'focus', bio: 'bio',
  hasPhoto: 'has_photo', hasCV: 'has_cv', pubmedAuthor: 'pubmed_author',
};

const toRow = (patch, map) => {
  const out = {};
  Object.keys(patch).forEach(k => { if (map[k]) out[map[k]] = patch[k]; });
  return out;
};

window.DataService = {
  // ============= PROJECTS =============
  async updateProject(id, patch) {
    const row = toRow(patch, PROJECT_FIELD_MAP);
    const { error } = await sb().from('projects').update(row).eq('id', id);
    if (error) throw error;
    await refreshAll();
  },

  async deleteProject(id) {
    const { error } = await sb().from('projects').delete().eq('id', id);
    if (error) throw error;
    await refreshAll();
  },

  async createProject(patch) {
    const row = toRow(patch, PROJECT_FIELD_MAP);
    if (!row.title) throw new Error('Project title is required');
    const { data, error } = await sb().from('projects').insert(row).select().single();
    if (error) throw error;
    await refreshAll();
    return data;
  },

  async addProjectMember(projectId, personId, roleOnProject = 'Member') {
    const { error } = await sb().from('project_members')
      .upsert({ project_id: projectId, person_id: personId, role_on_project: roleOnProject });
    if (error) throw error;
    await refreshAll();
  },

  async removeProjectMember(projectId, personId) {
    const { error } = await sb().from('project_members')
      .delete().eq('project_id', projectId).eq('person_id', personId);
    if (error) throw error;
    await refreshAll();
  },

  // ============= PEOPLE =============
  async updatePerson(id, patch) {
    const row = toRow(patch, PERSON_FIELD_MAP);
    const { error } = await sb().from('people').update(row).eq('id', id);
    if (error) throw error;
    await refreshAll();
  },

  async deletePerson(id) {
    const { error } = await sb().from('people').delete().eq('id', id);
    if (error) throw error;
    await refreshAll();
  },

  async createPerson(patch) {
    const row = toRow(patch, PERSON_FIELD_MAP);
    if (!row.name) throw new Error('Name is required');
    if (!row.initials) row.initials = row.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
    if (!row.role) row.role = 'Collaborator';
    const { data, error } = await sb().from('people').insert(row).select().single();
    if (error) throw error;
    await refreshAll();
    return data;
  },

  // ============= TASKS =============
  async createTask({ projectId, title, description, ownerId, priority = 'Medium', status = 'todo', dueDate }) {
    if (!title) throw new Error('Title is required');
    const { data, error } = await sb().from('tasks').insert({
      project_id: projectId, title, description: description || null,
      owner_id: ownerId || null, priority, status, due_date: dueDate || null,
    }).select().single();
    if (error) throw error;
    await refreshAll();
    return data;
  },

  async updateTask(taskId, patch) {
    const row = {};
    if ('title'     in patch) row.title       = patch.title;
    if ('description' in patch) row.description = patch.description || null;
    if ('ownerId'   in patch) row.owner_id    = patch.ownerId || null;
    if ('priority'  in patch) row.priority    = patch.priority;
    if ('status'    in patch) {
      row.status = patch.status;
      row.completed_at = patch.status === 'done' ? new Date().toISOString() : null;
    }
    if ('dueDate'   in patch) row.due_date    = patch.dueDate || null;
    const { error } = await sb().from('tasks').update(row).eq('id', taskId);
    if (error) throw error;
    await refreshAll();
  },

  async updateTaskStatus(taskId, status) {
    const row = { status };
    if (status === 'done') row.completed_at = new Date().toISOString();
    const { error } = await sb().from('tasks').update(row).eq('id', taskId);
    if (error) throw error;
    await refreshAll();
  },

  async deleteTask(taskId) {
    const { error } = await sb().from('tasks').delete().eq('id', taskId);
    if (error) throw error;
    await refreshAll();
  },

  // ============= ACTIVITY =============
  async logActivity(projectId, userId, actionType, text, detail) {
    await sb().from('activity_log').insert({
      project_id: projectId, user_id: userId,
      action_type: actionType, text, detail,
    });
  },

  // ============= PROGRESS UPDATES =============
  async submitProgressUpdate(update) {
    const row = {
      project_id: update.project,
      user_id: update.user,
      completed_since_last_update: update.completed,
      currently_working_on: update.inProgress,
      barriers: update.barriers,
      help_needed: update.helpNeeded,
      next_steps: update.next,
      percent_complete: update.percent,
      pi_response_status: 'pending',
    };
    const { data, error } = await sb().from('progress_updates').insert(row).select().single();
    if (error) throw error;
    // Also update project progress field
    if (update.project && typeof update.percent === 'number') {
      await sb().from('projects').update({ progress: update.percent, last_update_date: new Date().toISOString().slice(0, 10) }).eq('id', update.project);
    }
    await refreshAll();
    return data;
  },

  async setUpdateStatus(updateId, status, responseText) {
    const row = { pi_response_status: status };
    if (responseText !== undefined) row.pi_response_text = responseText;
    const { error } = await sb().from('progress_updates').update(row).eq('id', updateId);
    if (error) throw error;
    await refreshAll();
  },

  // ============= COMMENTS (thread on a progress update) =============
  async addUpdateComment({ updateId, projectId, userId, text }) {
    if (!text || !text.trim()) throw new Error('Comment required');
    const { data, error } = await sb().from('comments').insert({
      update_id: updateId || null,
      project_id: projectId || null,
      user_id: userId,
      comment_text: text.trim(),
    }).select().single();
    if (error) throw error;
    await refreshAll();
    return data;
  },

  async deleteComment(commentId) {
    const { error } = await sb().from('comments').delete().eq('id', commentId);
    if (error) throw error;
    await refreshAll();
  },

  // Expose refresh so other code can manually trigger
  refresh: refreshAll,

  // ============= MILESTONES =============
  async createMilestone({ projectId, title, ownerId, dueDate, status = 'todo', notes }) {
    if (!title) throw new Error('Title is required');
    const { data, error } = await sb().from('milestones').insert({
      project_id: projectId, title, owner_id: ownerId || null,
      due_date: dueDate || null, status, notes: notes || null,
    }).select().single();
    if (error) throw error;
    await refreshAll();
    return data;
  },

  async updateMilestone(id, patch) {
    const row = {};
    if ('title'   in patch) row.title    = patch.title;
    if ('ownerId' in patch) row.owner_id = patch.ownerId || null;
    if ('dueDate' in patch) row.due_date = patch.dueDate || null;
    if ('status'  in patch) {
      row.status = patch.status;
      row.completed_at = patch.status === 'done' ? new Date().toISOString() : null;
    }
    if ('notes'   in patch) row.notes    = patch.notes || null;
    const { error } = await sb().from('milestones').update(row).eq('id', id);
    if (error) throw error;
    await refreshAll();
  },

  async deleteMilestone(id) {
    const { error } = await sb().from('milestones').delete().eq('id', id);
    if (error) throw error;
    await refreshAll();
  },

  // ============= PUBLICATIONS =============
  async createPublication(patch) {
    const row = {
      pmid: patch.pmid || null,
      doi: patch.doi || null,
      title: patch.title,
      authors: patch.authors,
      journal: patch.journal || null,
      year: patch.year || null,
      month: patch.month || null,
      volume: patch.volume || null,
      pages: patch.pages || null,
      type: patch.type || 'Original article',
      status: patch.status || 'Published',
      source: patch.source || 'manual',
      added_by: patch.addedBy || null,
    };
    if (!row.title) throw new Error('Title required');
    if (!row.authors) throw new Error('Authors required');
    const { data, error } = await sb().from('publications').insert(row).select().single();
    if (error) throw error;
    await refreshAll();
    return data;
  },

  async updatePublication(id, patch) {
    const map = {
      pmid: 'pmid', doi: 'doi', title: 'title', authors: 'authors', journal: 'journal',
      year: 'year', month: 'month', volume: 'volume', pages: 'pages',
      type: 'type', status: 'status', source: 'source',
    };
    const row = {};
    Object.keys(patch).forEach(k => { if (map[k]) row[map[k]] = patch[k]; });
    row.updated_at = new Date().toISOString();
    const { error } = await sb().from('publications').update(row).eq('id', id);
    if (error) throw error;
    await refreshAll();
  },

  async deletePublication(id) {
    const { error } = await sb().from('publications').delete().eq('id', id);
    if (error) throw error;
    await refreshAll();
  },

  // ============= NOTES (admin-to-people messages) =============
  // Send one note to each recipient. `recipients` is an array of person IDs.
  async sendNotes({ senderId, recipients, projectId, template, subject, body, channel }) {
    if (!recipients || !recipients.length) throw new Error('No recipients');
    if (!body || !body.trim()) throw new Error('Message body required');
    const rows = recipients.map(rid => ({
      sender_id: senderId || null,
      recipient_id: rid,
      project_id: projectId || null,
      template: template || null,
      subject: subject || null,
      body,
      channel_in_app: channel?.inApp ?? true,
      channel_email:  channel?.email ?? false,
    }));
    const { data, error } = await sb().from('notes').insert(rows).select();
    if (error) throw error;
    return data;
  },

  async listNotesFor(personId) {
    const { data, error } = await sb().from('notes')
      .select('*')
      .or(`recipient_id.eq.${personId},sender_id.eq.${personId}`)
      .order('sent_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return data;
  },

  async markNoteRead(id) {
    const { error } = await sb().from('notes')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async deleteNote(id) {
    const { error } = await sb().from('notes').delete().eq('id', id);
    if (error) throw error;
  },

  // ============= APPROVAL (admin only) =============
  async setApproval(personId, approved) {
    const { error } = await sb().from('people')
      .update({ is_approved: !!approved }).eq('id', personId);
    if (error) throw error;
    await refreshAll();
  },

  async setAdmin(personId, isAdmin) {
    const { error } = await sb().from('people')
      .update({ is_admin: !!isAdmin }).eq('id', personId);
    if (error) throw error;
    await refreshAll();
  },

  // ============= INVITATIONS =============
  // Default consent text shown to invitees. Snapshotted on each invitation
  // so changes to this template don't affect past consents.
  DEFAULT_CONSENT_TEXT: `By accepting this invitation and creating an account on the MFM Research Hub, I consent to:

1. Being listed as a member of the research team on this private internal site.
2. My name, role, and institutional affiliation being shown to other approved team members.
3. My profile being associated with the projects to which I have been added by the principal investigator.

I understand that:
• This consent is recorded with a timestamp and stored as a permanent audit record.
• I can request removal of my profile at any time by contacting the site administrator.
• The site is access-controlled — only approved team members can view its contents.
• No data is published externally without my separate, explicit consent.`,

  async createInvitation({ email, invitedName, invitedRole, invitedTraining, message, consentText, senderId }) {
    if (!email) throw new Error('Email is required');
    const row = {
      email: email.trim().toLowerCase(),
      invited_name: invitedName || null,
      invited_role: invitedRole || 'Collaborator',
      invited_training: invitedTraining || null,
      consent_text: consentText || this.DEFAULT_CONSENT_TEXT,
      message: message || null,
      sent_by: senderId || null,
    };
    const { data, error } = await sb().from('invitations').insert(row).select().single();
    if (error) throw error;
    return data;
  },

  async listInvitations() {
    const { data, error } = await sb().from('invitations')
      .select('*').order('sent_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async revokeInvitation(id) {
    const { error } = await sb().from('invitations')
      .update({ revoked_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  async deleteInvitation(id) {
    const { error } = await sb().from('invitations').delete().eq('id', id);
    if (error) throw error;
  },

  async getInvitationByToken(token) {
    const { data, error } = await sb().from('invitations')
      .select('*').eq('token', token).maybeSingle();
    if (error) throw error;
    return data;
  },

  async acceptInvitation(token) {
    const { data, error } = await sb().rpc('accept_invitation', {
      p_token: token,
      p_user_agent: navigator.userAgent || null,
    });
    if (error) throw error;
    await refreshAll();
    return data; // returns person_id
  },
};
