/* MFM Research Hub — Supabase write layer (Phase 4)
   Helpers that mutate Supabase tables and refresh the in-memory arrays.
   Components call these instead of mutating local React state alone.
*/

const sb = () => window.__sb;

// Refresh data from Supabase after a mutation
const refreshAll = async () => {
  const [peopleRes, projectsRes, membersRes] = await Promise.all([
    sb().from('people').select('*').order('joined', { ascending: true }),
    sb().from('projects').select('*').order('start_date', { ascending: true }),
    sb().from('project_members').select('*'),
  ]);

  if (peopleRes.data) {
    const people = peopleRes.data.map(p => ({
      id: p.id, name: p.name, initials: p.initials, role: p.role, training: p.training,
      email: p.email, color: p.color, joined: p.joined ? p.joined.slice(0, 7) : '',
      focus: p.focus, bio: p.bio, hasPhoto: p.has_photo, hasCV: p.has_cv, pubmedAuthor: p.pubmed_author,
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
    const { error } = await sb().from('progress_updates').insert(row);
    if (error) throw error;
    // Also update project progress field
    if (update.project && typeof update.percent === 'number') {
      await sb().from('projects').update({ progress: update.percent, last_update_date: new Date().toISOString().slice(0, 10) }).eq('id', update.project);
    }
  },

  // ============= TASKS =============
  async updateTaskStatus(taskId, status) {
    const { error } = await sb().from('tasks').update({ status }).eq('id', taskId);
    if (error) throw error;
  },

  // ============= ACTIVITY =============
  async logActivity(projectId, userId, actionType, text, detail) {
    await sb().from('activity_log').insert({
      project_id: projectId, user_id: userId,
      action_type: actionType, text, detail,
    });
  },
};
