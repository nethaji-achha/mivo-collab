import {
  ApiResponse,
  User,
  Meeting,
  OrgMember,
  Team,
  Organization,
  Subscription,
  Invoice,
  AuditLog,
  NotificationItem,
  BillingPlan,
  ChatChannel,
  TeamMessage,
  TeammatePresence,
  Poll,
  PollResult,
  CreatePollRequest,
  SubmitPollResponseRequest,
  CompanyProduct,
  ProductChatMessage,
  CreateProductRequest,
  CreateProductTeamRequest,
  AddProductMemberRequest,
  SendProductMessageRequest,
} from '@mivo/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('mivo_token');
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('mivo_token', token);
      } else {
        localStorage.removeItem('mivo_token');
      }
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('mivo_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.warn(`[API Client fetch failed on ${endpoint}]:`, err.message);
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: err.message || 'Network connection failed' },
      };
    }
  }

  // Auth
  public async register(payload: any) {
    return this.request<{ user: User; token: string; expiresAt: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async login(payload: any) {
    return this.request<{ user: User; token: string; expiresAt: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async demoLogin(role: 'alex' | 'sarah' | 'liam' = 'alex') {
    return this.request<{ user: User; token: string; expiresAt: string }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  public async getMe() {
    return this.request<{ user: User; organizations: Organization[]; primaryOrg: Organization | null }>('/auth/me');
  }

  public async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  public async resetPassword(payload: any) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async logout() {
    this.setToken(null);
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Profile
  public async getProfile() {
    return this.request<{ user: User; stats: { totalHostedMeetings: number; totalMeetingMinutes: number; organizationsCount: number } }>('/users/profile');
  }

  public async updateProfile(payload: any) {
    return this.request<User>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // Meetings
  public async getMeetings() {
    return this.request<Meeting[]>('/meetings');
  }

  public async createMeeting(payload: any) {
    return this.request<Meeting>('/meetings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async scheduleMeeting(payload: any) {
    return this.request<Meeting>('/meetings/schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getMeetingById(idOrPublicId: string) {
    return this.request<Meeting & { isHost: boolean }>(`/meetings/${idOrPublicId}`);
  }

  public async endMeeting(idOrPublicId: string) {
    return this.request<Meeting>(`/meetings/${idOrPublicId}/end`, {
      method: 'POST',
    });
  }

  public async getMeetingMessages(id: string) {
    return this.request<any[]>(`/meetings/${id}/messages`);
  }

  public async sendMeetingMessage(id: string, payload: any) {
    return this.request<any>(`/meetings/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Organization
  public async getCurrentOrg() {
    return this.request<Organization>('/organizations/current');
  }

  public async getOrgMembers() {
    return this.request<OrgMember[]>('/organizations/current/members');
  }

  public async inviteMember(payload: { email: string; role: string }) {
    return this.request<OrgMember>('/organizations/current/members', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async removeMember(memberId: string) {
    return this.request(`/organizations/current/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  public async getTeams() {
    return this.request<Team[]>('/organizations/current/teams');
  }

  public async createTeam(payload: { name: string; description?: string }) {
    return this.request<Team>('/organizations/current/teams', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Billing
  public async getPlans() {
    return this.request<BillingPlan[]>('/billing/plans');
  }

  public async getSubscription() {
    return this.request<{ subscription: Subscription; plan: BillingPlan; usage: any }>('/billing/subscription');
  }

  public async checkout(payload: { planId: string; billingCycle: 'monthly' | 'yearly'; provider?: string }) {
    return this.request<{ subscription: Subscription; message: string }>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getInvoices() {
    return this.request<Invoice[]>('/billing/invoices');
  }

  // Notifications
  public async getNotifications() {
    return this.request<NotificationItem[]>('/notifications');
  }

  public async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  public async markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'POST',
    });
  }

  // Admin
  public async getAuditLogs(params?: { search?: string; action?: string }) {
    const q = new URLSearchParams(params as any).toString();
    return this.request<AuditLog[]>(`/admin/audit-logs?${q}`);
  }

  public async getSystemStats() {
    return this.request<any>('/admin/system-stats');
  }

  // Team & Office Chat
  public async getChannels() {
    return this.request<ChatChannel[]>('/chat/channels');
  }

  public async createChannel(payload: { name: string; description?: string; topic?: string; isPrivate?: boolean }) {
    return this.request<ChatChannel>('/chat/channels', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getChannelMessages(channelId: string) {
    return this.request<TeamMessage[]>(`/chat/channels/${channelId}/messages`);
  }

  public async sendChannelMessage(channelId: string, payload: { content: string; attachments?: any[]; codeSnippet?: any; meetingInvite?: any }) {
    return this.request<TeamMessage>(`/chat/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getDirectTeammates() {
    return this.request<TeammatePresence[]>('/chat/direct');
  }

  public async getDirectMessages(recipientId: string) {
    return this.request<TeamMessage[]>(`/chat/direct/${recipientId}/messages`);
  }

  public async sendDirectMessage(recipientId: string, payload: { content: string; attachments?: any[]; codeSnippet?: any; meetingInvite?: any }) {
    return this.request<TeamMessage>(`/chat/direct/${recipientId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async startDirectChat(payload: { email: string; name?: string; role?: string }) {
    return this.request<TeammatePresence>('/chat/direct/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async reactToMessage(messageId: string, emoji: string) {
    return this.request<TeamMessage>(`/chat/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  // ==========================================
  // Meeting Polling API Methods
  // ==========================================

  public async getMeetingPolls(meetingId: string, isHost = false, peerId?: string, displayName?: string) {
    const headers: Record<string, string> = {};
    if (isHost) headers['x-mivo-is-host'] = 'true';
    if (peerId) headers['x-mivo-peer-id'] = peerId;
    if (displayName) headers['x-mivo-display-name'] = displayName;

    return this.request<Poll[]>(`/meetings/${meetingId}/polls`, { headers });
  }

  public async createPoll(meetingId: string, payload: CreatePollRequest, isHost = true) {
    return this.request<Poll>(`/meetings/${meetingId}/polls`, {
      method: 'POST',
      headers: { 'x-mivo-is-host': isHost ? 'true' : 'false' },
      body: JSON.stringify(payload),
    });
  }

  public async startPoll(meetingId: string, pollId: string, isHost = true, pollData?: any) {
    return this.request<Poll>(`/meetings/${meetingId}/polls/${pollId}/start`, {
      method: 'POST',
      headers: { 'x-mivo-is-host': isHost ? 'true' : 'false' },
      body: pollData ? JSON.stringify({ poll: pollData }) : undefined,
    });
  }

  public async closePoll(meetingId: string, pollId: string, isHost = true) {
    return this.request<{ poll: Poll; results: PollResult }>(`/meetings/${meetingId}/polls/${pollId}/close`, {
      method: 'POST',
      headers: { 'x-mivo-is-host': isHost ? 'true' : 'false' },
    });
  }

  public async reopenPoll(meetingId: string, pollId: string, isHost = true) {
    return this.request<Poll>(`/meetings/${meetingId}/polls/${pollId}/reopen`, {
      method: 'POST',
      headers: { 'x-mivo-is-host': isHost ? 'true' : 'false' },
    });
  }

  public async deletePoll(meetingId: string, pollId: string, isHost = true) {
    return this.request<{ message: string }>(`/meetings/${meetingId}/polls/${pollId}`, {
      method: 'DELETE',
      headers: { 'x-mivo-is-host': isHost ? 'true' : 'false' },
    });
  }

  public async togglePollResultsVisibility(meetingId: string, pollId: string, showResultsToParticipants: boolean, isHost = true) {
    return this.request<Poll>(`/meetings/${meetingId}/polls/${pollId}/visibility`, {
      method: 'PATCH',
      headers: { 'x-mivo-is-host': isHost ? 'true' : 'false' },
      body: JSON.stringify({ showResultsToParticipants }),
    });
  }

  public async submitPollResponse(
    meetingId: string,
    pollId: string,
    payload: SubmitPollResponseRequest,
    peerId?: string,
    displayName?: string
  ) {
    const headers: Record<string, string> = {};
    if (peerId) headers['x-mivo-peer-id'] = peerId;
    if (displayName) headers['x-mivo-display-name'] = displayName;

    return this.request<{ response: any; results: PollResult | null }>(`/meetings/${meetingId}/polls/${pollId}/respond`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  }

  public async getPollResults(meetingId: string, pollId: string, isHost = false) {
    return this.request<PollResult>(`/meetings/${meetingId}/polls/${pollId}/results`, {
      headers: { 'x-mivo-is-host': isHost ? 'true' : 'false' },
    });
  }

  public async exportPollResults(meetingId: string, pollId: string, format: 'json' | 'csv' = 'json') {
    if (format === 'csv') {
      const token = this.getToken();
      const url = `${API_BASE}/meetings/${meetingId}/polls/${pollId}/export?format=csv`;
      const res = await fetch(url, {
        headers: {
          'x-mivo-is-host': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `poll-${pollId}-results.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return { success: true };
    }

    return this.request<any>(`/meetings/${meetingId}/polls/${pollId}/export?format=json`, {
      headers: { 'x-mivo-is-host': 'true' },
    });
  }

  // ==========================================
  // Multi-Product & Multi-Team Lifecycle Methods
  // ==========================================

  public async getProducts(orgId?: string) {
    const query = orgId ? `?orgId=${orgId}` : '';
    return this.request<CompanyProduct[]>(`/products${query}`);
  }

  public async getProductById(productId: string) {
    return this.request<CompanyProduct>(`/products/${productId}`);
  }

  public async createProduct(payload: CreateProductRequest) {
    return this.request<CompanyProduct>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async advanceProductStage(productId: string) {
    return this.request<CompanyProduct>(`/products/${productId}/stages/advance`, {
      method: 'POST',
    });
  }

  public async toggleProductTask(productId: string, stageId: number, section: 'workDone' | 'workNext', taskId: string) {
    return this.request<CompanyProduct>(`/products/${productId}/tasks/toggle`, {
      method: 'POST',
      body: JSON.stringify({ stageId, section, taskId }),
    });
  }

  public async addProductTask(
    productId: string,
    stageId: number,
    section: 'workDone' | 'workNext',
    text: string,
    assigneeName?: string
  ) {
    return this.request<CompanyProduct>(`/products/${productId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ stageId, section, text, assigneeName }),
    });
  }

  public async deleteProductTask(
    productId: string,
    stageId: number,
    taskId: string,
    section: 'workDone' | 'workNext' = 'workNext'
  ) {
    return this.request<CompanyProduct>(`/products/${productId}/stages/${stageId}/tasks/${taskId}?section=${section}`, {
      method: 'DELETE',
    });
  }

  public async getProductMessages(productId: string) {
    return this.request<ProductChatMessage[]>(`/products/${productId}/messages`);
  }

  public async sendProductMessage(productId: string, payload: SendProductMessageRequest) {
    return this.request<ProductChatMessage>(`/products/${productId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async addProductMember(productId: string, payload: AddProductMemberRequest) {
    return this.request<CompanyProduct>(`/products/${productId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async addProductTeam(productId: string, payload: CreateProductTeamRequest) {
    return this.request<CompanyProduct>(`/products/${productId}/teams`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiClient();
