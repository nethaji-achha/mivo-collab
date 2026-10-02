/**
 * @mivo/types
 * Core domain contracts, real-time events, RTC interfaces, and API types
 * Mivo Collab — Connect • Collaborate • Communicate
 */

// ==========================================
// User & Auth
// ==========================================

export type UserRole = 'individual' | 'host' | 'org_admin' | 'enterprise_admin';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultMicMuted: boolean;
  defaultCamMuted: boolean;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  hdVideo: boolean;
  emailNotifications: boolean;
  soundAlerts: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  timezone: string;
  role: UserRole;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

// ==========================================
// Organizations & Memberships
// ==========================================

export type OrgMemberRole = 'owner' | 'admin' | 'member' | 'guest';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  logoUrl?: string | null;
  plan: BillingPlanTier;
  subscriptionStatus: SubscriptionStatus;
  maxMembers: number;
  settings: {
    allowGuestInvites: boolean;
    requireWaitingRoom: boolean;
    recordingsEnabled: boolean;
    aiFeaturesEnabled: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrgMember {
  id: string;
  organizationId: string;
  userId: string;
  user: User;
  role: OrgMemberRole;
  status: 'active' | 'invited' | 'suspended';
  invitedEmail?: string;
  joinedAt: string;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt: string;
}

// ==========================================
// Multi-Product & Multi-Team Lifecycle Architecture
// ==========================================

export type ProductStatus = 'active' | 'planning' | 'beta' | 'archived';
export type ProductRole =
  | 'product_lead'
  | 'tech_lead'
  | 'designer'
  | 'engineer'
  | 'qa_specialist'
  | 'devops_lead'
  | 'growth_pm'
  | 'marketer';

export interface ProductMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: ProductRole;
  title: string;
  assignedTeamId?: string;
  assignedTeamName?: string;
  joinedAt: string;
}

export interface ProductTeam {
  id: string;
  productId: string;
  name: string;
  description: string;
  leadName: string;
  leadRole: string;
  membersCount: number;
  currentSprint: string;
  activeStageId: number;
  color: string;
}

export interface ProductLifecycleTask {
  id: string;
  text: string;
  completed: boolean;
  assigneeName?: string;
  assigneeAvatar?: string;
  dueDate?: string;
}

export interface ProductLifecycleStage {
  id: number;
  name: string;
  category: 'Discovery' | 'Strategy' | 'Execution' | 'Scale';
  status: 'completed' | 'in-progress' | 'next-up' | 'locked';
  lead: string;
  leadRole: string;
  avatarColor: string;
  description: string;
  workDone: ProductLifecycleTask[];
  workNext: ProductLifecycleTask[];
  exitCriteria: string;
  estimatedDuration: string;
  resourceLinks?: { title: string; url: string; type: 'doc' | 'design' | 'code' | 'metric' }[];
}

export interface ProductChatMessage {
  id: string;
  productId: string;
  teamId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  senderRole?: string;
  content: string;
  isSystemAnnouncement?: boolean;
  stageTag?: string; // e.g. "PRD", "UX/UI", "Architecture"
  reactions?: Record<string, string[]>; // emoji -> array of user names
  createdAt: string;
}

export interface CompanyProduct {
  id: string;
  organizationId: string;
  name: string;
  tagline: string;
  description: string;
  iconName: string; // e.g. 'Video', 'Bot', 'Layout', 'Smartphone', 'ShieldCheck'
  colorScheme: string; // e.g. 'from-cyan-500 to-blue-600'
  status: ProductStatus;
  currentStageId: number;
  stages: ProductLifecycleStage[];
  teams: ProductTeam[];
  members: ProductMember[];
  targetLaunchDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  tagline: string;
  description: string;
  iconName?: string;
  colorScheme?: string;
  targetLaunchDate?: string;
  initialTeams?: { name: string; description: string; leadName: string; leadRole: string; color: string }[];
}

export interface CreateProductTeamRequest {
  name: string;
  description: string;
  leadName: string;
  leadRole: string;
  currentSprint?: string;
  color?: string;
}

export interface AddProductMemberRequest {
  userId?: string;
  name: string;
  email: string;
  role: ProductRole;
  title: string;
  assignedTeamId?: string;
}

export interface SendProductMessageRequest {
  content: string;
  teamId?: string;
  stageTag?: string;
}

// ==========================================
// Meetings
// ==========================================

export type MeetingStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type MeetingType = 'instant' | 'scheduled' | 'recurring' | 'persistent_room';

export interface MeetingConfiguration {
  waitingRoom: boolean;
  allowScreenShare: boolean;
  allowChat: boolean;
  muteOnEntry: boolean;
  videoOnEntry: boolean;
  requireAuth: boolean;
  hostKey?: string;
  recordingEnabled: boolean;
  aiTranscription: boolean;
}

export interface Meeting {
  id: string;
  publicMeetingId: string; // e.g. "mivo-abc-def-xyz"
  title: string;
  description?: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string | null;
  organizationId?: string | null;
  type: MeetingType;
  status: MeetingStatus;
  scheduledStartTime?: string | null;
  scheduledEndTime?: string | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  durationSeconds?: number;
  configuration: MeetingConfiguration;
  participantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userId?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  role: 'host' | 'co_host' | 'participant' | 'guest';
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'reconnecting';
  joinedAt: string;
  leftAt?: string | null;
}

// ==========================================
// Real-time & WebRTC Signaling
// ==========================================

export type ConnectionQualityStatus = 'connecting' | 'connected' | 'reconnecting' | 'poor' | 'disconnected';

export interface RTCPeerSignal {
  targetPeerId: string;
  senderPeerId: string;
  signalType: 'offer' | 'answer' | 'ice-candidate' | 'device-state';
  data: any;
}

export interface DeviceInfo {
  audioInputId?: string;
  audioOutputId?: string;
  videoInputId?: string;
  hasAudioPermission: boolean;
  hasVideoPermission: boolean;
}

export interface PeerMediaState {
  peerId: string;
  userId?: string;
  displayName: string;
  avatarUrl?: string;
  role: 'host' | 'participant' | 'guest';
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  handRaised: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  connectionQuality: ConnectionQualityStatus;
}

// Socket Events Definition
export interface ServerToClientEvents {
  'room:joined': (data: {
    room: Meeting;
    peerId: string;
    isHost: boolean;
    existingParticipants: PeerMediaState[];
  }) => void;
  'participant:joined': (participant: PeerMediaState) => void;
  'participant:left': (data: { peerId: string; reason?: string }) => void;
  'participant:updated': (data: Partial<PeerMediaState> & { peerId: string }) => void;
  'signal:offer': (data: { senderPeerId: string; sdp: any }) => void;
  'signal:answer': (data: { senderPeerId: string; sdp: any }) => void;
  'signal:ice-candidate': (data: { senderPeerId: string; candidate: any }) => void;
  'screen:started': (data: { peerId: string; displayName: string }) => void;
  'screen:stopped': (data: { peerId: string }) => void;
  'chat:message': (message: ChatMessage) => void;
  'host:action': (action: HostActionNotification) => void;
  'meeting:ended': (data: { reason: string }) => void;
  'meeting:reconnecting': (data: { peerId: string }) => void;
  'meeting:connection-quality': (data: { peerId: string; quality: ConnectionQualityStatus }) => void;
  'notification:new': (notification: NotificationItem) => void;
  'chat:channel-message': (data: { channelId: string; message: TeamMessage }) => void;
  'chat:direct-message': (data: { recipientId: string; message: TeamMessage }) => void;
  'chat:reaction': (data: { targetId: string; messageId: string; emoji: string; userId: string; reactions: Record<string, string[]> }) => void;
  'chat:typing': (data: { targetType: string; targetId: string; userName: string; isTyping: boolean }) => void;
  // Polling Events (Server to Client)
  'poll:created': (data: { poll: Poll }) => void;
  'poll:started': (data: { poll: Poll }) => void;
  'poll:updated': (data: { poll: Poll; results?: PollResult }) => void;
  'poll:response-received': (data: { pollId: string; results: PollResult }) => void;
  'poll:closed': (data: { pollId: string; results?: PollResult }) => void;
  'poll:reopened': (data: { poll: Poll }) => void;
  'poll:deleted': (data: { pollId: string }) => void;
  'poll:results-visibility-changed': (data: { pollId: string; showResultsToParticipants: boolean; results?: PollResult }) => void;
}

export interface ClientToServerEvents {
  'room:join': (data: {
    publicMeetingId: string;
    displayName: string;
    avatarUrl?: string;
    userId?: string;
    initialAudio: boolean;
    initialVideo: boolean;
    token?: string;
  }) => void;
  'room:leave': () => void;
  'signal:offer': (data: { targetPeerId: string; sdp: any }) => void;
  'signal:answer': (data: { targetPeerId: string; sdp: any }) => void;
  'signal:ice-candidate': (data: { targetPeerId: string; candidate: any }) => void;
  'media:state-change': (data: {
    audioEnabled?: boolean;
    videoEnabled?: boolean;
    screenShareEnabled?: boolean;
    handRaised?: boolean;
  }) => void;
  'media:speaking': (data: { isSpeaking: boolean; audioLevel: number }) => void;
  'chat:send': (data: { content: string; recipientId?: string }) => void;
  'host:mute-participant': (data: { targetPeerId: string }) => void;
  'host:mute-all': () => void;
  'host:remove-participant': (data: { targetPeerId: string; reason?: string }) => void;
  'host:end-meeting': () => void;
  'host:toggle-lock': (data: { locked: boolean }) => void;
  'chat:user-join': (data: { userId: string }) => void;
  'chat:channel-join': (data: { channelId: string; userId: string }) => void;
  'chat:channel-leave': (data: { channelId: string }) => void;
  'chat:channel-message': (data: { channelId: string; message: TeamMessage }) => void;
  'chat:direct-message': (data: { recipientId: string; message: TeamMessage }) => void;
  'chat:typing': (data: { targetType: string; targetId: string; userName: string; isTyping: boolean }) => void;
  'chat:reaction': (data: { targetId: string; messageId: string; emoji: string; userId: string; reactions: Record<string, string[]> }) => void;
  // Polling Events (Client to Server)
  'poll:create': (data: { meetingId: string; poll: CreatePollRequest | Poll }) => void;
  'poll:start': (data: { meetingId: string; pollId: string; poll?: Poll }) => void;
  'poll:respond': (data: { meetingId: string; pollId: string; selectedOptionIds: string[] }) => void;
  'poll:close': (data: { meetingId: string; pollId: string }) => void;
  'poll:reopen': (data: { meetingId: string; pollId: string }) => void;
  'poll:delete': (data: { meetingId: string; pollId: string }) => void;
  'poll:toggle-results-visibility': (data: { meetingId: string; pollId: string; showResultsToParticipants: boolean }) => void;
}

export interface HostActionNotification {
  action: 'muted' | 'removed' | 'promoted' | 'room_locked';
  initiatedBy: string;
  message: string;
}

// ==========================================
// Chat & Messages
// ==========================================

export interface ChatMessage {
  id: string;
  meetingId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  content: string;
  isPrivate?: boolean;
  recipientId?: string | null;
  recipientName?: string | null;
  createdAt: string;
}

export interface ChatChannel {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  topic?: string;
  isPrivate: boolean;
  memberCount: number;
  unreadCount?: number;
  lastMessage?: TeamMessage | null;
  createdAt: string;
}

export interface TeamMessageAttachment {
  name: string;
  url: string;
  size: string;
  type: string;
}

export interface TeamMessageMeetingInvite {
  meetingId: string;
  title: string;
  status: 'active' | 'ended';
  startedByName: string;
}

export interface TeamMessage {
  id: string;
  organizationId: string;
  channelId?: string | null;
  directRecipientId?: string | null;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  senderRole?: string;
  content: string;
  attachments?: TeamMessageAttachment[];
  codeSnippet?: {
    code: string;
    language: string;
  };
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  meetingInvite?: TeamMessageMeetingInvite;
  pinned?: boolean;
  createdAt: string;
}

export interface TeammatePresence {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  status: 'online' | 'in_meeting' | 'busy' | 'offline';
  customStatus?: string;
  lastSeen?: string;
  unreadCount?: number;
  lastMessage?: TeamMessage | null;
}

// ==========================================
// Notifications
// ==========================================

export type NotificationType =
  | 'meeting_invite'
  | 'meeting_reminder'
  | 'meeting_started'
  | 'participant_joined'
  | 'org_invite'
  | 'system_alert'
  | 'recording_ready';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

// ==========================================
// SaaS Billing & Subscriptions
// ==========================================

export type BillingPlanTier = 'free' | 'pro' | 'business' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled' | 'expired';

export interface BillingPlan {
  id: BillingPlanTier;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  maxParticipants: number;
  maxMeetingDurationMinutes: number;
  cloudRecordingHours: number;
  aiTranscription: boolean;
  customBranding: boolean;
  ssoEnabled: boolean;
  slaSupport: boolean;
  features: string[];
}

export interface Subscription {
  id: string;
  organizationId: string;
  provider: 'stripe' | 'razorpay' | 'mock';
  providerSubscriptionId: string;
  plan: BillingPlanTier;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  renewalDate: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  invoicePdfUrl?: string;
  date: string;
}

// ==========================================
// Audit Logs & Security
// ==========================================

export type AuditAction =
  | 'auth.login'
  | 'auth.signup'
  | 'auth.logout'
  | 'auth.password_reset'
  | 'meeting.create'
  | 'meeting.start'
  | 'meeting.end'
  | 'meeting.delete'
  | 'org.member_add'
  | 'org.member_remove'
  | 'org.member_role_update'
  | 'billing.subscription_create'
  | 'billing.subscription_upgrade'
  | 'billing.subscription_cancel'
  | 'security.setting_update';

export interface AuditLog {
  id: string;
  organizationId?: string | null;
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// ==========================================
// API DTOs & Responses
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    totalCount?: number;
    timestamp: string;
  };
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  type?: MeetingType;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  configuration?: Partial<MeetingConfiguration>;
}

export interface ScheduleMeetingRequest extends CreateMeetingRequest {
  scheduledStartTime: string;
  scheduledEndTime: string;
  participants?: string[]; // email addresses
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
}

// ==========================================
// Polling System Types
// ==========================================

export type PollStatus = 'draft' | 'started' | 'active' | 'closed' | 'archived';
export type PollType = 'single' | 'multiple';

export interface PollOption {
  id: string;
  text: string;
  votesCount?: number;
}

export interface Poll {
  id: string;
  meetingId: string;
  hostId: string;
  hostName?: string;
  question: string;
  options: PollOption[];
  pollType: PollType;
  isAnonymous: boolean;
  allowResponseChange: boolean;
  showResultsToParticipants: boolean;
  status: PollStatus;
  createdAt: string;
  startedAt?: string | null;
  closedAt?: string | null;
  totalResponses?: number;
  userResponded?: boolean;
  userSelectedOptionIds?: string[];
}

export interface PollResponse {
  id: string;
  pollId: string;
  meetingId: string;
  participantId: string;
  participantName: string;
  selectedOptionIds: string[];
  submittedAt: string;
  updatedAt: string;
}

export interface PollResultOption {
  id: string;
  text: string;
  votesCount: number;
  percentage: number;
  voterNames?: string[]; // populated only for non-anonymous polls if requester is host
}

export interface PollResult {
  poll: Poll;
  totalResponses: number;
  participantCount: number;
  responseRate: number;
  options: PollResultOption[];
  responses?: PollResponse[]; // host-only & non-anonymous
}

export interface CreatePollRequest {
  question: string;
  options: string[];
  pollType: PollType;
  isAnonymous?: boolean;
  allowResponseChange?: boolean;
  showResultsToParticipants?: boolean;
}

export interface SubmitPollResponseRequest {
  selectedOptionIds: string[];
  participantName?: string;
}

export interface ExportPollResultsResponse {
  pollId: string;
  meetingId: string;
  question: string;
  pollType: PollType;
  isAnonymous: boolean;
  status: PollStatus;
  startedAt: string | null;
  closedAt: string | null;
  totalResponses: number;
  optionsSummary: {
    optionText: string;
    votes: number;
    percentage: string;
  }[];
  detailedResponses?: {
    participantName: string;
    selectedOptions: string[];
    submittedAt: string;
  }[];
}

