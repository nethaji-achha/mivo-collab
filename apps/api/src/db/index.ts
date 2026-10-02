import {
  User,
  Organization,
  OrgMember,
  Team,
  Meeting,
  ChatMessage,
  NotificationItem,
  Subscription,
  Invoice,
  AuditLog,
  ChatChannel,
  TeamMessage,
  TeammatePresence,
  Poll,
  PollResponse,
  PollResult,
  PollResultOption,
  PollOption,
  CreatePollRequest,
  CompanyProduct,
  ProductTeam,
  ProductMember,
  ProductLifecycleStage,
  ProductLifecycleTask,
  ProductChatMessage,
  CreateProductRequest,
  CreateProductTeamRequest,
  AddProductMemberRequest,
  SendProductMessageRequest,
} from '@mivo/types';
import { BILLING_PLANS, DEFAULT_MEETING_CONFIG, DEFAULT_USER_PREFERENCES } from '@mivo/config';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

// Seed demo users and data
const passwordHash = bcrypt.hashSync('Password123!', 10);

export class DatabaseStore {
  private static instance: DatabaseStore;

  public users: Map<string, User & { passwordHash: string }> = new Map();
  public organizations: Map<string, Organization> = new Map();
  public orgMembers: Map<string, OrgMember> = new Map();
  public teams: Map<string, Team> = new Map();
  public meetings: Map<string, Meeting> = new Map();
  public messages: Map<string, ChatMessage[]> = new Map(); // meetingId -> messages
  public notifications: Map<string, NotificationItem[]> = new Map(); // userId -> notifications
  public subscriptions: Map<string, Subscription> = new Map(); // orgId -> subscription
  public invoices: Map<string, Invoice[]> = new Map(); // orgId -> invoices
  public auditLogs: AuditLog[] = [];
  public channels: Map<string, ChatChannel> = new Map();
  public teamMessages: TeamMessage[] = [];
  public userPresences: Map<string, { status: 'online' | 'in_meeting' | 'busy' | 'offline'; customStatus?: string; lastSeen: string }> = new Map();
  public polls: Map<string, Poll> = new Map(); // pollId -> Poll
  public pollResponses: Map<string, PollResponse[]> = new Map(); // pollId -> PollResponse[]
  public products: Map<string, CompanyProduct> = new Map(); // productId -> CompanyProduct
  public productMessages: Map<string, ProductChatMessage[]> = new Map(); // productId -> ProductChatMessage[]

  private constructor() {
    this.seedInitialData();
  }

  public static getInstance(): DatabaseStore {
    if (!DatabaseStore.instance) {
      DatabaseStore.instance = new DatabaseStore();
    }
    return DatabaseStore.instance;
  }

  private seedInitialData() {
    // 1. Seed Demo User 1: Alex Rivera (Individual / Host)
    const user1: User & { passwordHash: string } = {
      id: 'usr_demo_alex',
      email: 'alex@mivo.collab',
      name: 'Alex Rivera',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      timezone: 'America/New_York',
      role: 'host',
      preferences: { ...DEFAULT_USER_PREFERENCES },
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      passwordHash,
    };
    this.users.set(user1.id, user1);

    // 2. Seed Demo User 2: Sarah Chen (Org Admin at Acme Global)
    const user2: User & { passwordHash: string } = {
      id: 'usr_demo_sarah',
      email: 'sarah@hyperdevs.io',
      name: 'Sarah Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      timezone: 'Asia/Kolkata',
      role: 'org_admin',
      preferences: { ...DEFAULT_USER_PREFERENCES },
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      passwordHash,
    };
    this.users.set(user2.id, user2);

    // 3. Seed Demo User 3: Liam Smith (Developer / Member)
    const user3: User & { passwordHash: string } = {
      id: 'usr_demo_liam',
      email: 'liam@hyperdevs.io',
      name: 'Liam Smith',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      timezone: 'Europe/London',
      role: 'individual',
      preferences: { ...DEFAULT_USER_PREFERENCES },
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      passwordHash,
    };
    this.users.set(user3.id, user3);

    // 4. Seed Demo User 4: Maya Patel (Lead UX/UI Designer)
    const user4: User & { passwordHash: string } = {
      id: 'usr_demo_maya',
      email: 'maya@hyperdevs.io',
      name: 'Maya Patel',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      timezone: 'America/San_Francisco',
      role: 'individual',
      preferences: { ...DEFAULT_USER_PREFERENCES },
      createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      passwordHash,
    };
    this.users.set(user4.id, user4);

    // 5. Seed Demo User 5: David Kim (Senior SFU Media Engineer)
    const user5: User & { passwordHash: string } = {
      id: 'usr_demo_david',
      email: 'david@hyperdevs.io',
      name: 'David Kim',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      timezone: 'Asia/Seoul',
      role: 'individual',
      preferences: { ...DEFAULT_USER_PREFERENCES },
      createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      passwordHash,
    };
    this.users.set(user5.id, user5);

    // 6. Seed Demo User 6: Elena Rostova (VP of Product)
    const user6: User & { passwordHash: string } = {
      id: 'usr_demo_elena',
      email: 'elena@hyperdevs.io',
      name: 'Elena Rostova',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      timezone: 'Europe/Berlin',
      role: 'org_admin',
      preferences: { ...DEFAULT_USER_PREFERENCES },
      createdAt: new Date(Date.now() - 50 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      passwordHash,
    };
    this.users.set(user6.id, user6);

    // 7. Seed Demo User 7: Marcus Johnson (Cloud Infrastructure)
    const user7: User & { passwordHash: string } = {
      id: 'usr_demo_marcus',
      email: 'marcus@hyperdevs.io',
      name: 'Marcus Johnson',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      timezone: 'America/Chicago',
      role: 'individual',
      preferences: { ...DEFAULT_USER_PREFERENCES },
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      passwordHash,
    };
    this.users.set(user7.id, user7);

    // 8. Seed Demo User 8: Sophia Wang (Full-Stack Engineer)
    const user8: User & { passwordHash: string } = {
      id: 'usr_demo_sophia',
      email: 'sophia@hyperdevs.io',
      name: 'Sophia Wang',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      timezone: 'Asia/Singapore',
      role: 'individual',
      preferences: { ...DEFAULT_USER_PREFERENCES },
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      passwordHash,
    };
    this.users.set(user8.id, user8);

    // Seed Demo Organization: HyperDevelopers Lab
    const org1: Organization = {
      id: 'org_hyper_lab',
      name: 'HyperDevelopers Global',
      slug: 'hyperdevelopers',
      ownerId: user2.id,
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      plan: 'business',
      subscriptionStatus: 'active',
      maxMembers: 100,
      settings: {
        allowGuestInvites: true,
        requireWaitingRoom: false,
        recordingsEnabled: true,
        aiFeaturesEnabled: true,
      },
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.organizations.set(org1.id, org1);

    // Org Memberships
    this.orgMembers.set('mem_1', {
      id: 'mem_1',
      organizationId: org1.id,
      userId: user2.id,
      user: user2,
      role: 'owner',
      status: 'active',
      joinedAt: org1.createdAt,
    });
    this.orgMembers.set('mem_2', {
      id: 'mem_2',
      organizationId: org1.id,
      userId: user3.id,
      user: user3,
      role: 'member',
      status: 'active',
      joinedAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    });
    this.orgMembers.set('mem_3', {
      id: 'mem_3',
      organizationId: org1.id,
      userId: user4.id,
      user: user4,
      role: 'member',
      status: 'active',
      joinedAt: new Date(Date.now() - 35 * 86400000).toISOString(),
    });
    this.orgMembers.set('mem_4', {
      id: 'mem_4',
      organizationId: org1.id,
      userId: user5.id,
      user: user5,
      role: 'member',
      status: 'active',
      joinedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    });
    this.orgMembers.set('mem_5', {
      id: 'mem_5',
      organizationId: org1.id,
      userId: user6.id,
      user: user6,
      role: 'admin',
      status: 'active',
      joinedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    });
    this.orgMembers.set('mem_6', {
      id: 'mem_6',
      organizationId: org1.id,
      userId: user7.id,
      user: user7,
      role: 'member',
      status: 'active',
      joinedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    });
    this.orgMembers.set('mem_7', {
      id: 'mem_7',
      organizationId: org1.id,
      userId: user8.id,
      user: user8,
      role: 'member',
      status: 'active',
      joinedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    });

    // Teams
    const team1: Team = {
      id: 'team_core_eng',
      organizationId: org1.id,
      name: 'Core Engineering & SFU',
      description: 'Real-time media engine & client applications squad',
      memberCount: 8,
      createdAt: org1.createdAt,
    };
    this.teams.set(team1.id, team1);

    const team2: Team = {
      id: 'team_product_design',
      organizationId: org1.id,
      name: 'Product & Design',
      description: 'UX/UI design systems, design tokens and accessibility',
      memberCount: 4,
      createdAt: org1.createdAt,
    };
    this.teams.set(team2.id, team2);

    // Seed Demo Meetings
    const now = Date.now();

    // 1. Featured Public Instant Room
    const publicRoom: Meeting = {
      id: 'mtg_public_demo',
      publicMeetingId: 'mivo-collab-hq',
      title: 'Mivo Collab Showcase & Open Room',
      description: 'Live interactive room for testing high-definition audio, video, and screen sharing',
      hostId: user1.id,
      hostName: user1.name,
      hostAvatar: user1.avatarUrl,
      organizationId: org1.id,
      type: 'persistent_room',
      status: 'live',
      scheduledStartTime: new Date(now - 15 * 60000).toISOString(),
      actualStartTime: new Date(now - 15 * 60000).toISOString(),
      configuration: {
        ...DEFAULT_MEETING_CONFIG,
        allowScreenShare: true,
        allowChat: true,
        aiTranscription: true,
      },
      participantCount: 3,
      createdAt: new Date(now - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.meetings.set(publicRoom.id, publicRoom);

    // 2. Upcoming Scheduled Meeting
    const upcomingMeeting: Meeting = {
      id: 'mtg_upcoming_weekly',
      publicMeetingId: 'mivo-weekly-sync',
      title: 'Engineering Architecture & SFU Sprint Sync',
      description: 'Reviewing adaptive bitrate, TURN fallback telemetry, and Next.js App Router performance',
      hostId: user2.id,
      hostName: user2.name,
      hostAvatar: user2.avatarUrl,
      organizationId: org1.id,
      type: 'scheduled',
      status: 'scheduled',
      scheduledStartTime: new Date(now + 2 * 3600000).toISOString(),
      scheduledEndTime: new Date(now + 3 * 3600000).toISOString(),
      configuration: {
        ...DEFAULT_MEETING_CONFIG,
        waitingRoom: false,
        aiTranscription: true,
        recordingEnabled: true,
      },
      participantCount: 0,
      createdAt: new Date(now - 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.meetings.set(upcomingMeeting.id, upcomingMeeting);

    // 3. Past Meeting History (Ended)
    const pastMeeting: Meeting = {
      id: 'mtg_past_sprint',
      publicMeetingId: 'mivo-sprint-review',
      title: 'Q3 Product Roadmap & UX Design Review',
      description: 'Finalizing glassmorphic components, audio visualizer, and keyboard accessibility',
      hostId: user1.id,
      hostName: user1.name,
      hostAvatar: user1.avatarUrl,
      organizationId: org1.id,
      type: 'scheduled',
      status: 'ended',
      scheduledStartTime: new Date(now - 26 * 3600000).toISOString(),
      actualStartTime: new Date(now - 26 * 3600000).toISOString(),
      actualEndTime: new Date(now - 25 * 3600000).toISOString(),
      durationSeconds: 3600,
      configuration: {
        ...DEFAULT_MEETING_CONFIG,
      },
      participantCount: 12,
      createdAt: new Date(now - 28 * 3600000).toISOString(),
      updatedAt: new Date(now - 25 * 3600000).toISOString(),
    };
    this.meetings.set(pastMeeting.id, pastMeeting);

    // Seed Demo Messages in public room
    this.messages.set(publicRoom.id, [
      {
        id: 'msg_1',
        meetingId: publicRoom.id,
        senderId: user2.id,
        senderName: user2.name,
        senderAvatar: user2.avatarUrl,
        content: 'Welcome to Mivo Collab! Audio & video quality is crystal clear.',
        createdAt: new Date(now - 10 * 60000).toISOString(),
      },
      {
        id: 'msg_2',
        meetingId: publicRoom.id,
        senderId: user1.id,
        senderName: user1.name,
        senderAvatar: user1.avatarUrl,
        content: 'Screen sharing is enabled with 60fps HD presentation mode.',
        createdAt: new Date(now - 5 * 60000).toISOString(),
      },
    ]);

    // Seed Demo Notifications for Alex
    this.notifications.set(user1.id, [
      {
        id: 'notif_1',
        userId: user1.id,
        type: 'meeting_invite',
        title: 'Meeting Invitation',
        message: 'Sarah Chen invited you to "Engineering Architecture & SFU Sprint Sync"',
        data: { meetingId: upcomingMeeting.publicMeetingId },
        read: false,
        createdAt: new Date(now - 30 * 60000).toISOString(),
      },
      {
        id: 'notif_2',
        userId: user1.id,
        type: 'system_alert',
        title: 'Mivo Collab v1.0 Launched',
        message: 'Welcome to Mivo Collab! Connect • Collaborate • Communicate.',
        read: true,
        createdAt: new Date(now - 86400000).toISOString(),
      },
    ]);

    // Seed Subscription for HyperDevelopers
    const sub: Subscription = {
      id: 'sub_hyper_biz',
      organizationId: org1.id,
      provider: 'stripe',
      providerSubscriptionId: 'sub_live_mivo_892348',
      plan: 'business',
      status: 'active',
      currentPeriodStart: new Date(now - 15 * 86400000).toISOString(),
      currentPeriodEnd: new Date(now + 15 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
      renewalDate: new Date(now + 15 * 86400000).toISOString(),
    };
    this.subscriptions.set(org1.id, sub);

    // Seed Invoices
    this.invoices.set(org1.id, [
      {
        id: 'inv_2026_09',
        organizationId: org1.id,
        amount: 28,
        currency: 'USD',
        status: 'paid',
        invoicePdfUrl: '#',
        date: new Date(now - 15 * 86400000).toISOString(),
      },
      {
        id: 'inv_2026_08',
        organizationId: org1.id,
        amount: 28,
        currency: 'USD',
        status: 'paid',
        invoicePdfUrl: '#',
        date: new Date(now - 45 * 86400000).toISOString(),
      },
    ]);

    // Seed Audit Logs
    this.auditLogs.push(
      {
        id: 'aud_1',
        organizationId: org1.id,
        actorId: user2.id,
        actorName: user2.name,
        actorEmail: user2.email,
        action: 'auth.login',
        targetType: 'User',
        targetId: user2.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
        createdAt: new Date(now - 2 * 3600000).toISOString(),
      },
      {
        id: 'aud_2',
        organizationId: org1.id,
        actorId: user2.id,
        actorName: user2.name,
        actorEmail: user2.email,
        action: 'meeting.create',
        targetType: 'Meeting',
        targetId: upcomingMeeting.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
        metadata: { title: upcomingMeeting.title, publicMeetingId: upcomingMeeting.publicMeetingId },
        createdAt: new Date(now - 1 * 3600000).toISOString(),
      }
    );

    // ==========================================
    // Seed Team & Office Channels
    // ==========================================
    const channelGeneral: ChatChannel = {
      id: 'chan_general',
      organizationId: org1.id,
      name: 'general',
      description: 'Company-wide announcements, team updates, and cross-functional sync',
      topic: 'Welcome to Mivo Collab Office Space 🚀',
      isPrivate: false,
      memberCount: 12,
      createdAt: new Date(now - 30 * 86400000).toISOString(),
    };
    this.channels.set(channelGeneral.id, channelGeneral);

    const channelEngineering: ChatChannel = {
      id: 'chan_engineering',
      organizationId: org1.id,
      name: 'engineering',
      description: 'WebRTC SFU architecture, Next.js optimization, CI/CD and bug tracking',
      topic: 'Live video SFU, low latency & audio codecs ⚡',
      isPrivate: false,
      memberCount: 8,
      createdAt: new Date(now - 30 * 86400000).toISOString(),
    };
    this.channels.set(channelEngineering.id, channelEngineering);

    const channelDesign: ChatChannel = {
      id: 'chan_design',
      organizationId: org1.id,
      name: 'design-squad',
      description: 'Design system tokens, UX prototypes, interactive UI components and design reviews',
      topic: 'Dark glassmorphism, micro-animations & layout hierarchy ✨',
      isPrivate: false,
      memberCount: 5,
      createdAt: new Date(now - 25 * 86400000).toISOString(),
    };
    this.channels.set(channelDesign.id, channelDesign);

    const channelWatercooler: ChatChannel = {
      id: 'chan_watercooler',
      organizationId: org1.id,
      name: 'watercooler-breakroom',
      description: 'Casual office chatter, coffee breaks, memes, lunch coordination, and weekend plans',
      topic: 'Coffee breaks & office banter ☕🍕🎮',
      isPrivate: false,
      memberCount: 15,
      createdAt: new Date(now - 20 * 86400000).toISOString(),
    };
    this.channels.set(channelWatercooler.id, channelWatercooler);

    const channelProduct: ChatChannel = {
      id: 'chan_product_apollo',
      organizationId: org1.id,
      name: 'project-apollo',
      description: 'Sprint planning and roadmap execution for next-gen collaboration features',
      topic: 'Apollo Q4 deliverables & milestones 🎯',
      isPrivate: false,
      memberCount: 6,
      createdAt: new Date(now - 10 * 86400000).toISOString(),
    };
    this.channels.set(channelProduct.id, channelProduct);

    // ==========================================
    // Seed Team Messages (Channel & Direct)
    // ==========================================
    this.teamMessages = [
      // #general
      {
        id: 'tmsg_gen_1',
        organizationId: org1.id,
        channelId: 'chan_general',
        senderId: user2.id,
        senderName: user2.name,
        senderAvatar: user2.avatarUrl,
        senderRole: 'Org Admin',
        content: 'Good morning team! 🚀 The new Mivo Collab team & office workspace is live. You can now chat in office channels, direct message colleagues, share snippets, and launch 1-click video calls anytime.',
        reactions: { '🚀': [user1.id, user3.id], '🎉': [user2.id] },
        createdAt: new Date(now - 3 * 3600000).toISOString(),
      },
      {
        id: 'tmsg_gen_2',
        organizationId: org1.id,
        channelId: 'chan_general',
        senderId: user1.id,
        senderName: user1.name,
        senderAvatar: user1.avatarUrl,
        senderRole: 'Host / Platform',
        content: 'Excited for this! WebRTC media server, simulated stream fallbacks, and real-time Socket.IO signaling are working seamlessly.',
        reactions: { '🔥': [user2.id, user3.id], '👏': [user1.id] },
        createdAt: new Date(now - 2.5 * 3600000).toISOString(),
      },
      {
        id: 'tmsg_gen_3',
        organizationId: org1.id,
        channelId: 'chan_general',
        senderId: user3.id,
        senderName: user3.name,
        senderAvatar: user3.avatarUrl,
        senderRole: 'Senior Engineer',
        content: 'Screen sharing test at 60fps was ultra smooth. Ping me if anyone wants to do a quick 1-on-1 huddle today!',
        reactions: { '👍': [user2.id] },
        createdAt: new Date(now - 2 * 3600000).toISOString(),
      },

      // #engineering
      {
        id: 'tmsg_eng_1',
        organizationId: org1.id,
        channelId: 'chan_engineering',
        senderId: user3.id,
        senderName: user3.name,
        senderAvatar: user3.avatarUrl,
        senderRole: 'Senior Engineer',
        content: 'Here is the helper function for auto-reconnecting WebRTC ICE candidates when switching networks:',
        codeSnippet: {
          language: 'typescript',
          code: `export async function restartIceNegotiation(pc: RTCPeerConnection) {\n  const offer = await pc.createOffer({ iceRestart: true });\n  await pc.setLocalDescription(offer);\n  return offer;\n}`,
        },
        reactions: { '💡': [user1.id, user2.id] },
        createdAt: new Date(now - 4 * 3600000).toISOString(),
      },
      {
        id: 'tmsg_eng_2',
        organizationId: org1.id,
        channelId: 'chan_engineering',
        senderId: user1.id,
        senderName: user1.name,
        senderAvatar: user1.avatarUrl,
        senderRole: 'Host / Platform',
        content: 'Looks super clean Liam. Just verified that audio analysers continue computing volume levels seamlessly during ICE restarts.',
        reactions: { '🙌': [user3.id] },
        createdAt: new Date(now - 3.2 * 3600000).toISOString(),
      },

      // #watercooler-breakroom
      {
        id: 'tmsg_wc_1',
        organizationId: org1.id,
        channelId: 'chan_watercooler',
        senderId: user2.id,
        senderName: user2.name,
        senderAvatar: user2.avatarUrl,
        senderRole: 'Org Admin',
        content: 'Hey everyone! ☕ Lunch sync at 1:00 PM today? Who wants to join the group order for artisan sandwiches and smoothies?',
        reactions: { '🥪': [user1.id, user3.id], '🙋‍♂️': [user3.id] },
        createdAt: new Date(now - 1.5 * 3600000).toISOString(),
      },
      {
        id: 'tmsg_wc_2',
        organizationId: org1.id,
        channelId: 'chan_watercooler',
        senderId: user3.id,
        senderName: user3.name,
        senderAvatar: user3.avatarUrl,
        senderRole: 'Senior Engineer',
        content: 'Count me in! The sourdough pesto chicken sandwich was amazing last week 🤤',
        reactions: { '💯': [user2.id] },
        createdAt: new Date(now - 1.2 * 3600000).toISOString(),
      },
      {
        id: 'tmsg_wc_3',
        organizationId: org1.id,
        channelId: 'chan_watercooler',
        senderId: user1.id,
        senderName: user1.name,
        senderAvatar: user1.avatarUrl,
        senderRole: 'Host / Platform',
        content: 'I am in too! I will grab a cold brew coffee along with it.',
        reactions: { '☕': [user2.id, user3.id] },
        createdAt: new Date(now - 1 * 3600000).toISOString(),
      },

      // Direct Messages: Sarah Chen <-> Alex Rivera (1-on-1 Personal Office Chat)
      {
        id: 'tmsg_dm_1',
        organizationId: org1.id,
        senderId: user2.id, // Sarah
        senderName: user2.name,
        senderAvatar: user2.avatarUrl,
        directRecipientId: user1.id, // Alex
        content: 'Hi Alex! Do you have 5 minutes to review the organization billing tiers and our new team chat layout?',
        reactions: { '👍': [user1.id] },
        createdAt: new Date(now - 50 * 60000).toISOString(),
      },
      {
        id: 'tmsg_dm_2',
        organizationId: org1.id,
        senderId: user1.id, // Alex
        senderName: user1.name,
        senderAvatar: user1.avatarUrl,
        directRecipientId: user2.id, // Sarah
        content: 'Hi Sarah! Absolutely. Let us hop on a quick 1-on-1 video call right now.',
        meetingInvite: {
          meetingId: 'mivo-collab-hq',
          title: 'Quick 1-on-1 Sync: Sarah & Alex',
          status: 'active',
          startedByName: user1.name,
        },
        reactions: { '🔥': [user2.id] },
        createdAt: new Date(now - 35 * 60000).toISOString(),
      },
      {
        id: 'tmsg_dm_3',
        organizationId: org1.id,
        senderId: user2.id, // Sarah
        senderName: user2.name,
        senderAvatar: user2.avatarUrl,
        directRecipientId: user1.id, // Alex
        content: 'Awesome, joining now!',
        reactions: { '🚀': [user1.id] },
        createdAt: new Date(now - 30 * 60000).toISOString(),
      },

      // Direct Messages: Liam Smith <-> Alex Rivera (1-on-1 Personal Office Chat)
      {
        id: 'tmsg_dm_4',
        organizationId: org1.id,
        senderId: user3.id, // Liam
        senderName: user3.name,
        senderAvatar: user3.avatarUrl,
        directRecipientId: user1.id, // Alex
        content: 'Hey Alex, I just tested the new in-office personal chat with audio notification sounds. Everything responds instantly!',
        reactions: { '⚡': [user1.id] },
        createdAt: new Date(now - 20 * 60000).toISOString(),
      },
      {
        id: 'tmsg_dm_5',
        organizationId: org1.id,
        senderId: user1.id, // Alex
        senderName: user1.name,
        senderAvatar: user1.avatarUrl,
        directRecipientId: user3.id, // Liam
        content: 'That is great to hear! Let us keep adding features for file previews and code formatting.',
        reactions: { '❤️': [user3.id] },
        createdAt: new Date(now - 10 * 60000).toISOString(),
      },

      // Direct Messages: Maya Patel <-> Alex Rivera
      {
        id: 'tmsg_dm_6',
        organizationId: org1.id,
        senderId: user4.id, // Maya
        senderName: user4.name,
        senderAvatar: user4.avatarUrl,
        directRecipientId: user1.id, // Alex
        content: 'Hi Alex! Just uploaded the new glassmorphic UI kit for our meeting lobby. Love the dark mode palette ✨',
        reactions: { '🎨': [user1.id], '❤️': [user1.id] },
        createdAt: new Date(now - 45 * 60000).toISOString(),
      },
      {
        id: 'tmsg_dm_7',
        organizationId: org1.id,
        senderId: user1.id, // Alex
        senderName: user1.name,
        senderAvatar: user1.avatarUrl,
        directRecipientId: user4.id, // Maya
        content: 'Hey Maya! The new gradients and micro-animations look gorgeous. Let us integrate them into the screen share grid.',
        reactions: { '🙌': [user4.id] },
        createdAt: new Date(now - 25 * 60000).toISOString(),
      },

      // Direct Messages: David Kim <-> Alex Rivera
      {
        id: 'tmsg_dm_8',
        organizationId: org1.id,
        senderId: user5.id, // David
        senderName: user5.name,
        senderAvatar: user5.avatarUrl,
        directRecipientId: user1.id, // Alex
        content: 'Alex, media bandwidth telemetry is looking steady at sub-50ms latency across multi-party calls.',
        reactions: { '⚡': [user1.id], '🚀': [user1.id] },
        createdAt: new Date(now - 15 * 60000).toISOString(),
      },

      // Direct Messages: Elena Rostova <-> Alex Rivera
      {
        id: 'tmsg_dm_9',
        organizationId: org1.id,
        senderId: user6.id, // Elena
        senderName: user6.name,
        senderAvatar: user6.avatarUrl,
        directRecipientId: user1.id, // Alex
        content: 'Hi Alex! Q4 roadmap review is scheduled for tomorrow. Let us sync on the new team chat and enterprise security tiers.',
        reactions: { '👍': [user1.id] },
        createdAt: new Date(now - 5 * 60000).toISOString(),
      },
    ];

    // Seed Presences
    this.userPresences.set(user1.id, { status: 'online', customStatus: '🚀 Building Mivo Collab', lastSeen: new Date().toISOString() });
    this.userPresences.set(user2.id, { status: 'online', customStatus: '✨ Leading Product & Design', lastSeen: new Date().toISOString() });
    this.userPresences.set(user3.id, { status: 'in_meeting', customStatus: '🎧 Debugging WebRTC Media Tracks', lastSeen: new Date().toISOString() });
    this.userPresences.set(user4.id, { status: 'online', customStatus: '🎨 Refining Design Tokens & UI', lastSeen: new Date().toISOString() });
    this.userPresences.set(user5.id, { status: 'online', customStatus: '⚡ Optimizing SFU Low-Latency Codecs', lastSeen: new Date().toISOString() });
    this.userPresences.set(user6.id, { status: 'in_meeting', customStatus: '📊 Executive SaaS Sync', lastSeen: new Date().toISOString() });
    this.userPresences.set(user7.id, { status: 'busy', customStatus: '🐳 Deploying Docker Media Cluster', lastSeen: new Date().toISOString() });
    this.userPresences.set(user8.id, { status: 'online', customStatus: '💻 Next.js App Router Squad', lastSeen: new Date().toISOString() });

    // Seed Sample Poll 1: Active in Demo Room
    const poll1: Poll = {
      id: 'poll_seed_1',
      meetingId: 'mivo-demo-room',
      hostId: user1.id,
      hostName: user1.name,
      question: 'Which feature should we prioritize next for Mivo Collab?',
      options: [
        { id: 'opt_1', text: 'Screen Sharing & Annotations' },
        { id: 'opt_2', text: 'File & Media Sharing' },
        { id: 'opt_3', text: 'Real-time Interactive Whiteboard' },
        { id: 'opt_4', text: 'AI Meeting Assistant & Summaries' },
      ],
      pollType: 'single',
      isAnonymous: false,
      allowResponseChange: true,
      showResultsToParticipants: true,
      status: 'active',
      createdAt: new Date(now - 30 * 60000).toISOString(),
      startedAt: new Date(now - 25 * 60000).toISOString(),
      closedAt: null,
    };
    this.polls.set(poll1.id, poll1);

    this.pollResponses.set(poll1.id, [
      {
        id: 'resp_1',
        pollId: poll1.id,
        meetingId: 'mivo-demo-room',
        participantId: user2.id,
        participantName: user2.name,
        selectedOptionIds: ['opt_1'],
        submittedAt: new Date(now - 20 * 60000).toISOString(),
        updatedAt: new Date(now - 20 * 60000).toISOString(),
      },
      {
        id: 'resp_2',
        pollId: poll1.id,
        meetingId: 'mivo-demo-room',
        participantId: user3.id,
        participantName: user3.name,
        selectedOptionIds: ['opt_4'],
        submittedAt: new Date(now - 18 * 60000).toISOString(),
        updatedAt: new Date(now - 18 * 60000).toISOString(),
      },
      {
        id: 'resp_3',
        pollId: poll1.id,
        meetingId: 'mivo-demo-room',
        participantId: user4.id,
        participantName: user4.name,
        selectedOptionIds: ['opt_1'],
        submittedAt: new Date(now - 15 * 60000).toISOString(),
        updatedAt: new Date(now - 15 * 60000).toISOString(),
      },
    ]);

    // 12. Seed Products & Multi-Team Horizontal Lifecycle Timelines
    this.seedInitialProducts();
  }

  // ==========================================
  // Host-Controlled Polling Store Methods
  // ==========================================

  public createPoll(data: {
    meetingId: string;
    hostId: string;
    hostName?: string;
    question: string;
    options: string[];
    pollType: 'single' | 'multiple';
    isAnonymous?: boolean;
    allowResponseChange?: boolean;
    showResultsToParticipants?: boolean;
  }): Poll {
    const pollId = `poll_${nanoid(10)}`;
    const pollOptions: PollOption[] = data.options.map((optText) => ({
      id: `opt_${nanoid(6)}`,
      text: optText.trim(),
    }));

    const newPoll: Poll = {
      id: pollId,
      meetingId: data.meetingId,
      hostId: data.hostId,
      hostName: data.hostName || 'Meeting Host',
      question: data.question.trim(),
      options: pollOptions,
      pollType: data.pollType || 'single',
      isAnonymous: Boolean(data.isAnonymous),
      allowResponseChange: data.allowResponseChange !== undefined ? data.allowResponseChange : true,
      showResultsToParticipants: Boolean(data.showResultsToParticipants),
      status: 'draft',
      createdAt: new Date().toISOString(),
      startedAt: null,
      closedAt: null,
    };

    this.polls.set(pollId, newPoll);
    this.pollResponses.set(pollId, []);
    return newPoll;
  }

  public startPoll(pollId: string, hostId: string, fallbackData?: any): Poll | null {
    let poll = this.polls.get(pollId);
    if (!poll && fallbackData && (fallbackData.question || fallbackData.options)) {
      const pollOptions: PollOption[] = Array.isArray(fallbackData.options)
        ? fallbackData.options.map((opt: any) =>
            typeof opt === 'string'
              ? { id: `opt_${nanoid(6)}`, text: opt.trim() }
              : { id: opt.id || `opt_${nanoid(6)}`, text: (opt.text || '').trim() }
          )
        : [];

      poll = {
        id: pollId,
        meetingId: fallbackData.meetingId || '',
        hostId: fallbackData.hostId || hostId,
        hostName: fallbackData.hostName || 'Meeting Host',
        question: (fallbackData.question || '').trim(),
        options: pollOptions,
        pollType: fallbackData.pollType || 'single',
        isAnonymous: Boolean(fallbackData.isAnonymous),
        allowResponseChange: fallbackData.allowResponseChange !== undefined ? fallbackData.allowResponseChange : true,
        showResultsToParticipants: Boolean(fallbackData.showResultsToParticipants),
        status: 'draft',
        createdAt: fallbackData.createdAt || new Date().toISOString(),
        startedAt: null,
        closedAt: null,
      };
      this.polls.set(pollId, poll);
      this.pollResponses.set(pollId, []);
    }
    if (!poll) return null;

    poll.status = 'active';
    poll.startedAt = new Date().toISOString();
    return poll;
  }

  public closePoll(pollId: string, hostId: string): Poll | null {
    const poll = this.polls.get(pollId);
    if (!poll) return null;
    poll.status = 'closed';
    poll.closedAt = new Date().toISOString();
    return poll;
  }

  public reopenPoll(pollId: string, hostId: string): Poll | null {
    const poll = this.polls.get(pollId);
    if (!poll) return null;
    poll.status = 'active';
    poll.closedAt = null;
    return poll;
  }

  public deletePoll(pollId: string, hostId: string): boolean {
    const poll = this.polls.get(pollId);
    if (!poll) return false;
    this.polls.delete(pollId);
    this.pollResponses.delete(pollId);
    return true;
  }

  public togglePollResultsVisibility(pollId: string, hostId: string, showResultsToParticipants: boolean): Poll | null {
    const poll = this.polls.get(pollId);
    if (!poll) return null;
    poll.showResultsToParticipants = showResultsToParticipants;
    return poll;
  }

  public recordPollResponse(
    pollId: string,
    participantId: string,
    participantName: string,
    selectedOptionIds: string[]
  ): { success: boolean; response?: PollResponse; error?: string } {
    const poll = this.polls.get(pollId);
    if (!poll) {
      return { success: false, error: 'Poll not found' };
    }

    if (poll.status !== 'active') {
      return { success: false, error: 'This poll is currently closed and not accepting responses' };
    }

    // Validate valid options
    const validOptionIds = new Set(poll.options.map((o) => o.id));
    for (const optId of selectedOptionIds) {
      if (!validOptionIds.has(optId)) {
        return { success: false, error: 'Invalid option selected' };
      }
    }

    if (poll.pollType === 'single' && selectedOptionIds.length > 1) {
      return { success: false, error: 'Single-choice poll only permits 1 selected option' };
    }

    if (selectedOptionIds.length === 0) {
      return { success: false, error: 'Please select at least one option' };
    }

    let responses = this.pollResponses.get(pollId) || [];
    const existingIndex = responses.findIndex((r) => r.participantId === participantId);

    if (existingIndex >= 0) {
      if (!poll.allowResponseChange) {
        return { success: false, error: 'The host does not allow modifying submitted responses' };
      }
      // Update existing response
      responses[existingIndex].selectedOptionIds = selectedOptionIds;
      responses[existingIndex].updatedAt = new Date().toISOString();
      responses[existingIndex].participantName = participantName || responses[existingIndex].participantName;
      this.pollResponses.set(pollId, responses);
      return { success: true, response: responses[existingIndex] };
    }

    // New response
    const newResponse: PollResponse = {
      id: `resp_${nanoid(10)}`,
      pollId,
      meetingId: poll.meetingId,
      participantId,
      participantName: participantName || 'Participant',
      selectedOptionIds,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    responses.push(newResponse);
    this.pollResponses.set(pollId, responses);
    return { success: true, response: newResponse };
  }

  public getMeetingPolls(meetingId: string, isHost: boolean, participantId?: string): Poll[] {
    const list: Poll[] = [];
    for (const poll of this.polls.values()) {
      if (poll.meetingId === meetingId) {
        const responses = this.pollResponses.get(poll.id) || [];
        const userResp = participantId ? responses.find((r) => r.participantId === participantId) : undefined;

        // Clone poll to attach per-user metadata
        const enrichedPoll: Poll = {
          ...poll,
          totalResponses: responses.length,
          userResponded: Boolean(userResp),
          userSelectedOptionIds: userResp?.selectedOptionIds || [],
        };

        if (isHost) {
          // Host sees all polls (drafts, active, closed)
          list.push(enrichedPoll);
        } else {
          // Participants only see active polls or closed polls with results shared
          if (poll.status === 'active' || (poll.status === 'closed' && poll.showResultsToParticipants)) {
            list.push(enrichedPoll);
          }
        }
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getPollResults(pollId: string, isHost: boolean, participantCount = 1): PollResult | null {
    const poll = this.polls.get(pollId);
    if (!poll) return null;

    // If not host and results visibility is disabled, return null
    if (!isHost && !poll.showResultsToParticipants) {
      return null;
    }

    const responses = this.pollResponses.get(pollId) || [];
    const totalResponses = responses.length;

    // Count votes per option
    const voteCounts: Record<string, number> = {};
    const voterMap: Record<string, string[]> = {};

    poll.options.forEach((opt) => {
      voteCounts[opt.id] = 0;
      voterMap[opt.id] = [];
    });

    responses.forEach((resp) => {
      resp.selectedOptionIds.forEach((optId) => {
        if (voteCounts[optId] !== undefined) {
          voteCounts[optId]++;
          if (isHost && !poll.isAnonymous) {
            voterMap[optId].push(resp.participantName);
          }
        }
      });
    });

    const resultOptions: PollResultOption[] = poll.options.map((opt) => {
      const count = voteCounts[opt.id] || 0;
      const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
      return {
        id: opt.id,
        text: opt.text,
        votesCount: count,
        percentage: pct,
        voterNames: isHost && !poll.isAnonymous ? voterMap[opt.id] : undefined,
      };
    });

    const safeParticipantCount = Math.max(participantCount, totalResponses, 1);
    const responseRate = Math.min(100, Math.round((totalResponses / safeParticipantCount) * 100));

    return {
      poll: {
        ...poll,
        totalResponses,
      },
      totalResponses,
      participantCount: safeParticipantCount,
      responseRate,
      options: resultOptions,
      responses: isHost && !poll.isAnonymous ? responses : undefined,
    };
  }

  public exportPollResults(pollId: string, hostId: string) {
    const poll = this.polls.get(pollId);
    if (!poll) return null;

    const responses = this.pollResponses.get(pollId) || [];
    const results = this.getPollResults(pollId, true, responses.length);
    if (!results) return null;

    return {
      pollId: poll.id,
      meetingId: poll.meetingId,
      question: poll.question,
      pollType: poll.pollType,
      isAnonymous: poll.isAnonymous,
      status: poll.status,
      startedAt: poll.startedAt,
      closedAt: poll.closedAt,
      totalResponses: results.totalResponses,
      optionsSummary: results.options.map((o) => ({
        optionText: o.text,
        votes: o.votesCount,
        percentage: `${o.percentage}%`,
      })),
      detailedResponses:
        !poll.isAnonymous
          ? responses.map((r) => ({
              participantName: r.participantName,
              selectedOptions: r.selectedOptionIds
                .map((id) => poll.options.find((o) => o.id === id)?.text || id),
              submittedAt: r.submittedAt,
            }))
          : undefined,
    };
  }

  // ==========================================
  // Product & Multi-Team Lifecycle Methods
  // ==========================================

  private generateDefaultLifecycleStages(
    activeStageId: number,
    productName: string,
    productLead: string,
    techLead: string,
    designer: string
  ): ProductLifecycleStage[] {
    const stageDefinitions: {
      id: number;
      name: string;
      category: 'Discovery' | 'Strategy' | 'Execution' | 'Scale';
      lead: string;
      leadRole: string;
      avatarColor: string;
      description: string;
      duration: string;
      workDoneDefault: string[];
      workNextDefault: string[];
      exitCriteria: string;
      resourceLinks?: { title: string; url: string; type: 'doc' | 'design' | 'code' | 'metric' }[];
    }[] = [
      {
        id: 1,
        name: 'Problem',
        category: 'Discovery',
        lead: productLead,
        leadRole: 'Product Lead',
        avatarColor: 'bg-rose-500',
        description: `Define target audience friction, use-cases, and value proposition for ${productName}.`,
        duration: '1-2 Weeks',
        workDoneDefault: [
          'Conducted 15+ stakeholder and user discovery interviews',
          'Identified primary pain points and workflow bottlenecks',
          'Documented problem hypothesis and business sponsor approval',
        ],
        workNextDefault: ['Synthesize findings into competitive gap analysis'],
        exitCriteria: 'Problem statement signed off by product executive',
        resourceLinks: [{ title: `${productName} Discovery Brief`, url: '#', type: 'doc' }],
      },
      {
        id: 2,
        name: 'Research',
        category: 'Discovery',
        lead: productLead,
        leadRole: 'UX Researcher',
        avatarColor: 'bg-amber-500',
        description: 'Deep competitor teardown, TAM/SAM sizing, and technology capability benchmarking.',
        duration: '2 Weeks',
        workDoneDefault: [
          'Benchmarked top 4 industry market solutions on feature parity',
          'Surveyed target buyer personas and willingness-to-pay triggers',
          'Compiled technical feasibility and API integration matrix',
        ],
        workNextDefault: ['Run cross-functional design sprint ideation workshop'],
        exitCriteria: 'Market opportunity research deck approved',
        resourceLinks: [{ title: 'Market Sizing & Competitor Tear-Down', url: '#', type: 'metric' }],
      },
      {
        id: 3,
        name: 'Ideation',
        category: 'Discovery',
        lead: designer,
        leadRole: 'Lead Designer',
        avatarColor: 'bg-emerald-500',
        description: 'Cross-functional brainstorming, user journey mapping, and value vs. effort matrix.',
        duration: '1 Week',
        workDoneDefault: [
          'Held 3-day rapid ideation whiteboard sprint',
          'Sketched 20+ solution concept flows and interaction maps',
          'Prioritized core capability backlog using Impact/Effort scoring',
        ],
        workNextDefault: ['Package top 2 prototype concepts for live user validation'],
        exitCriteria: 'Core solution architecture selected for prototype validation',
        resourceLinks: [{ title: 'Design Sprint Whiteboard Concept', url: '#', type: 'design' }],
      },
      {
        id: 4,
        name: 'Validation',
        category: 'Discovery',
        lead: productLead,
        leadRole: 'Growth PM',
        avatarColor: 'bg-cyan-500',
        description: 'Smoke test prototypes, early access waitlist, and buyer commitment signals.',
        duration: '1-2 Weeks',
        workDoneDefault: [
          'Deployed interactive click-through prototype to 12 pilot users',
          'Collected 350+ customer waitlist signups on teaser portal',
          'Achieved >80% positive task completion rate in usability tests',
        ],
        workNextDefault: ['Draft formal PRD specification with tech and design pods'],
        exitCriteria: 'Validation benchmark > 75% positive intent met',
        resourceLinks: [{ title: 'Validation Usability & Conversion Report', url: '#', type: 'metric' }],
      },
      {
        id: 5,
        name: 'PRD',
        category: 'Strategy',
        lead: productLead,
        leadRole: 'Product Manager',
        avatarColor: 'bg-indigo-500',
        description: 'Master Product Requirements Document specifying functional scope, SLA criteria, and edge-cases.',
        duration: '2 Weeks',
        workDoneDefault: [
          'Drafted comprehensive user stories, acceptance criteria, and constraints',
          'Specified non-functional performance benchmarks and security requirements',
          'Defined North Star metrics, retention milestones, and release gates',
        ],
        workNextDefault: ['Review monetization strategy and unit economics'],
        exitCriteria: 'PRD signed off by Tech Lead, Design Lead & Security',
        resourceLinks: [{ title: `${productName} Master PRD Spec v1.0`, url: '#', type: 'doc' }],
      },
      {
        id: 6,
        name: 'Business Model',
        category: 'Strategy',
        lead: 'Finance & Strategy',
        leadRole: 'Strategy Lead',
        avatarColor: 'bg-purple-500',
        description: 'Unit economics, pricing model (Tiered/Usage), cloud infra hosting costs, and gross margins.',
        duration: '1 Week',
        workDoneDefault: [
          'Modeled cloud compute, SFU bandwidth, and LLM inference cost structures',
          'Formulated subscription pricing tiers and enterprise add-ons',
          'Built financial forecast and CAC/LTV breakeven model',
        ],
        workNextDefault: ['Align technical architecture with infrastructure budget'],
        exitCriteria: 'Gross margin model > 75% approved by finance',
        resourceLinks: [{ title: 'Financial & Unit Cost Model', url: '#', type: 'metric' }],
      },
      {
        id: 7,
        name: 'Architecture',
        category: 'Strategy',
        lead: techLead,
        leadRole: 'Chief Architect',
        avatarColor: 'bg-blue-500',
        description: 'Distributed system design, data schemas, API contracts, caching mesh, and failover topologies.',
        duration: '2 Weeks',
        workDoneDefault: [
          'Designed microservice architecture, Fastify REST APIs and WebSocket mesh',
          'Modeled PostgreSQL relational schemas, indexing, and migration pipelines',
          'Authored WebRTC SFU signaling protocol and Redis Pub/Sub events',
        ],
        workNextDefault: ['Hand off UI component tokens and frontend contracts to design team'],
        exitCriteria: 'System Architecture Document (SAD) signed off by Engineering Council',
        resourceLinks: [{ title: 'System Architecture & Data Flow Diagram', url: '#', type: 'code' }],
      },
      {
        id: 8,
        name: 'UX/UI',
        category: 'Strategy',
        lead: designer,
        leadRole: 'Lead UI/UX Designer',
        avatarColor: 'bg-emerald-500',
        description: 'High-fidelity design system, Figma component libraries, responsive viewports, and accessibility.',
        duration: '2-3 Weeks',
        workDoneDefault: [
          'Engineered dark-mode design system with curated HSL color tokens',
          'Completed high-fidelity Figma components, controls, and panel drawers',
          'Designed interactive prototypes for desktop, tablet, and mobile breakpoints',
        ],
        workNextDefault: [
          'Finalize touch gestures and responsive mobile breakpoints',
          'Export design tokens and Tailwind utility classes for engineers',
          'Conduct design review and accessibility WCAG 2.1 compliance audit',
        ],
        exitCriteria: 'Design token export and interactive prototype approved',
        resourceLinks: [
          { title: 'Figma High-Fidelity UI Prototype', url: '#', type: 'design' },
          { title: 'Design System Token Guidelines', url: '#', type: 'design' },
        ],
      },
      {
        id: 9,
        name: 'MVP',
        category: 'Execution',
        lead: techLead,
        leadRole: 'Engineering Lead',
        avatarColor: 'bg-violet-500',
        description: 'Sprint engineering: scaffolding, real-time sync, auth integration, core features, and APIs.',
        duration: '3-4 Weeks',
        workDoneDefault: [
          'Scaffolded TurboRepo monorepo workspace & Tailwind design bridge',
          'Setup database schema migrations, JWT auth, and API routes',
        ],
        workNextDefault: [
          'Connect real-time Socket.IO chat backend & room channels',
          'Implement core feature pipelines and client state synchronization',
          'Setup continuous integration automated build verification',
        ],
        exitCriteria: 'Full user session functional end-to-end without blockers',
        resourceLinks: [{ title: 'GitHub Sprint Backlog & Monorepo', url: '#', type: 'code' }],
      },
      {
        id: 10,
        name: 'Testing',
        category: 'Execution',
        lead: 'QA & Security',
        leadRole: 'QA Lead',
        avatarColor: 'bg-teal-500',
        description: 'E2E test automation, load testing, chaos engineering, security audits, and bug triage.',
        duration: '2 Weeks',
        workDoneDefault: [],
        workNextDefault: [
          'Write Playwright E2E automated test suites for user workflows',
          'Execute stress load tests simulating 1,000+ concurrent active sessions',
          'Conduct vulnerability penetration scan and API rate-limiting review',
        ],
        exitCriteria: 'Zero P0/P1 bugs in staging and >80% test code coverage',
        resourceLinks: [{ title: 'QA Test Matrix & Automation Suite', url: '#', type: 'code' }],
      },
      {
        id: 11,
        name: 'Beta',
        category: 'Execution',
        lead: productLead,
        leadRole: 'Release Manager',
        avatarColor: 'bg-pink-500',
        description: 'Private customer beta cohort, telemetry telemetry dashboards, user feedback loops, and bug fixing.',
        duration: '3 Weeks',
        workDoneDefault: [],
        workNextDefault: [
          'Onboard 100 pilot enterprise organizations into private beta cohort',
          'Deploy Datadog/Sentry live telemetry tracking error rates and latency',
          'Host weekly feedback triage and rapid refinement releases',
        ],
        exitCriteria: 'Beta NPS > 50 and verified 99.9% session stability',
        resourceLinks: [],
      },
      {
        id: 12,
        name: 'Production',
        category: 'Execution',
        lead: 'DevOps & SRE',
        leadRole: 'Site Reliability',
        avatarColor: 'bg-indigo-600',
        description: 'Multi-region cloud deployment, autoscaling Kubernetes clusters, SSL certificates, and failover.',
        duration: '1-2 Weeks',
        workDoneDefault: [],
        workNextDefault: [
          'Deploy production Kubernetes clusters with multi-AZ redundancy',
          'Configure Prometheus alerts, PagerDuty on-call, and backup snapshots',
          'Execute automated disaster recovery and chaos failover drills',
        ],
        exitCriteria: 'Production security checklist verified & 99.99% uptime ready',
        resourceLinks: [],
      },
      {
        id: 13,
        name: 'Launch',
        category: 'Scale',
        lead: 'Marketing & PR',
        leadRole: 'Go-To-Market Lead',
        avatarColor: 'bg-orange-500',
        description: 'Public release campaign, Product Hunt launch, press releases, onboarding sequences, and demos.',
        duration: '1 Week',
        workDoneDefault: [],
        workNextDefault: [
          'Execute Product Hunt and tech media launch campaign',
          'Send personalized onboarding drip to 10k+ pre-registered waitlist',
          'Staff 24/7 customer support live channel and documentation portal',
        ],
        exitCriteria: '1,000+ active organizations onboarded in Week 1',
        resourceLinks: [],
      },
      {
        id: 14,
        name: 'Growth',
        category: 'Scale',
        lead: 'Growth PM',
        leadRole: 'Growth & Monetization',
        avatarColor: 'bg-lime-500',
        description: 'Conversion rate optimization, viral team invite loops, referral rewards, and paid channels.',
        duration: 'Ongoing',
        workDoneDefault: [],
        workNextDefault: [
          'Optimize onboarding conversion funnel to reduce drop-offs',
          'Implement viral in-app teammate invitation incentives',
          'Analyze cohort retention curves and expand Enterprise sales pipeline',
        ],
        exitCriteria: 'Achieve >15% Month-over-Month organic user growth',
        resourceLinks: [],
      },
      {
        id: 15,
        name: 'Continuous Improvement',
        category: 'Scale',
        lead: 'Core Engineering',
        leadRole: 'All Teams',
        avatarColor: 'bg-sky-500',
        description: 'Bi-weekly sprint releases, community feature voting, performance optimization, and scale.',
        duration: 'Ongoing',
        workDoneDefault: [],
        workNextDefault: [
          'Weekly customer feedback review and backlog grooming sessions',
          'Bi-weekly release cycles with automated zero-downtime rolling deploys',
          'Continuously refactor performance bottlenecks identified in APM traces',
        ],
        exitCriteria: 'Sub-15 minute automated rollback and 99.99% uptime SLA',
        resourceLinks: [],
      },
    ];

    return stageDefinitions.map((def) => {
      let status: 'completed' | 'in-progress' | 'next-up' | 'locked';
      if (def.id < activeStageId) {
        status = 'completed';
      } else if (def.id === activeStageId) {
        status = 'in-progress';
      } else if (def.id === activeStageId + 1) {
        status = 'next-up';
      } else {
        status = 'locked';
      }

      const isPast = def.id < activeStageId;
      const isCurrent = def.id === activeStageId;

      const workDone: ProductLifecycleTask[] = def.workDoneDefault.map((text, i) => ({
        id: `task_${def.id}_done_${i}`,
        text,
        completed: true,
        assigneeName: def.lead,
      }));

      const workNext: ProductLifecycleTask[] = def.workNextDefault.map((text, i) => ({
        id: `task_${def.id}_next_${i}`,
        text,
        completed: isPast,
        assigneeName: def.lead,
      }));

      return {
        id: def.id,
        name: def.name,
        category: def.category,
        status,
        lead: def.lead,
        leadRole: def.leadRole,
        avatarColor: def.avatarColor,
        description: def.description,
        workDone,
        workNext,
        exitCriteria: def.exitCriteria,
        estimatedDuration: def.duration,
        resourceLinks: def.resourceLinks || [],
      };
    });
  }

  private seedInitialProducts() {
    const org1Id = 'org_demo_1';
    const now = Date.now();

    // 1. PRODUCT 1: Mivo Video Cloud (Real-time Video & SFU)
    const prod1Id = 'prod_video_cloud';
    const prod1Teams: ProductTeam[] = [
      {
        id: 'team_media_sfu',
        productId: prod1Id,
        name: 'Core SFU & Media Engine',
        description: 'Selective forwarding unit, WebRTC simulcast, and low-latency audio/video mesh.',
        leadName: 'Marcus Brody',
        leadRole: 'Tech Lead',
        membersCount: 4,
        currentSprint: 'Sprint 24: Adaptive Bitrate & Noise Shield',
        activeStageId: 8,
        color: 'from-cyan-500 to-blue-600',
      },
      {
        id: 'team_web_ui',
        productId: prod1Id,
        name: 'Web Experience & Controls',
        description: 'Next.js frontend, interactive meeting control bar, and collaborative drawers.',
        leadName: 'David Kim',
        leadRole: 'Lead Designer',
        membersCount: 3,
        currentSprint: 'Sprint 24: Glassmorphic UX & Polls Panel',
        activeStageId: 8,
        color: 'from-emerald-500 to-teal-600',
      },
      {
        id: 'team_sre_mesh',
        productId: prod1Id,
        name: 'Cloud Mesh & SRE',
        description: 'Global multi-region relay nodes, Redis pub/sub, and DTLS-SRTP encryption.',
        leadName: 'Elena Rostova',
        leadRole: 'DevOps Lead',
        membersCount: 2,
        currentSprint: 'Sprint 24: EU Edge Node Deployment',
        activeStageId: 8,
        color: 'from-indigo-500 to-purple-600',
      },
    ];

    const prod1Members: ProductMember[] = [
      {
        id: 'pmem_1',
        userId: 'usr_demo_alex',
        name: 'Alex Rivera',
        email: 'alex@mivo.collab',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'product_lead',
        title: 'VP of Product',
        assignedTeamId: 'team_web_ui',
        assignedTeamName: 'Web Experience & Controls',
        joinedAt: new Date(now - 60 * 86400000).toISOString(),
      },
      {
        id: 'pmem_2',
        userId: 'usr_demo_sarah',
        name: 'Sarah Chen',
        email: 'sarah@hyperdevs.io',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: 'tech_lead',
        title: 'Chief Architect',
        assignedTeamId: 'team_media_sfu',
        assignedTeamName: 'Core SFU & Media Engine',
        joinedAt: new Date(now - 60 * 86400000).toISOString(),
      },
      {
        id: 'pmem_3',
        userId: 'usr_demo_liam',
        name: 'David Kim',
        email: 'david@hyperdevs.io',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        role: 'designer',
        title: 'Lead Product Designer',
        assignedTeamId: 'team_web_ui',
        assignedTeamName: 'Web Experience & Controls',
        joinedAt: new Date(now - 45 * 86400000).toISOString(),
      },
      {
        id: 'pmem_4',
        userId: 'usr_demo_marcus',
        name: 'Marcus Brody',
        email: 'marcus@hyperdevs.io',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        role: 'engineer',
        title: 'Senior WebRTC Engineer',
        assignedTeamId: 'team_media_sfu',
        assignedTeamName: 'Core SFU & Media Engine',
        joinedAt: new Date(now - 30 * 86400000).toISOString(),
      },
      {
        id: 'pmem_5',
        userId: 'usr_demo_elena',
        name: 'Elena Rostova',
        email: 'elena@hyperdevs.io',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        role: 'devops_lead',
        title: 'Infrastructure & SRE Lead',
        assignedTeamId: 'team_sre_mesh',
        assignedTeamName: 'Cloud Mesh & SRE',
        joinedAt: new Date(now - 30 * 86400000).toISOString(),
      },
    ];

    const prod1: CompanyProduct = {
      id: prod1Id,
      organizationId: org1Id,
      name: 'Mivo Video Cloud',
      tagline: 'Ultra Low-Latency Global SFU Video & Screen Mesh',
      description: 'Enterprise-grade WebRTC selective forwarding unit with adaptive simulcast, noise cancellation, and DTLS-SRTP security.',
      iconName: 'Video',
      colorScheme: 'from-cyan-500 to-blue-600',
      status: 'active',
      currentStageId: 8, // UX/UI in progress
      stages: this.generateDefaultLifecycleStages(8, 'Mivo Video Cloud', 'Alex Rivera', 'Sarah Chen', 'David Kim'),
      teams: prod1Teams,
      members: prod1Members,
      targetLaunchDate: '2026-11-15',
      createdAt: new Date(now - 90 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.products.set(prod1.id, prod1);

    this.productMessages.set(prod1.id, [
      {
        id: 'pmsg_1',
        productId: prod1.id,
        teamId: 'team_media_sfu',
        senderId: 'usr_demo_sarah',
        senderName: 'Sarah Chen',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        senderRole: 'Chief Architect',
        content: '🚀 Completed SFU simulcast relay pipeline! Latency is holding under 48ms across our US-East relay nodes.',
        stageTag: 'Architecture',
        reactions: { '🔥': ['Alex Rivera', 'Marcus Brody'], '👍': ['David Kim'] },
        createdAt: new Date(now - 4 * 3600000).toISOString(),
      },
      {
        id: 'pmsg_2',
        productId: prod1.id,
        teamId: 'team_web_ui',
        senderId: 'usr_demo_liam',
        senderName: 'David Kim',
        senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        senderRole: 'Lead Designer',
        content: '🎨 Updated UX/UI tokens for meeting control bar and host-controlled live polls panel. Ready for final review.',
        stageTag: 'UX/UI',
        reactions: { '🎉': ['Sarah Chen', 'Alex Rivera'] },
        createdAt: new Date(now - 2 * 3600000).toISOString(),
      },
      {
        id: 'pmsg_3',
        productId: prod1.id,
        senderId: 'usr_demo_alex',
        senderName: 'Alex Rivera',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        senderRole: 'VP of Product',
        content: 'Great progress team! Once UX/UI review is complete, we will promote the pipeline to Stage 9: MVP build.',
        stageTag: 'UX/UI',
        reactions: { '🚀': ['Sarah Chen', 'Elena Rostova', 'David Kim'] },
        createdAt: new Date(now - 45 * 60000).toISOString(),
      },
    ]);

    // 2. PRODUCT 2: Mivo AI Copilot (Speech-to-Text & Summaries)
    const prod2Id = 'prod_ai_copilot';
    const prod2Teams: ProductTeam[] = [
      {
        id: 'team_ai_speech',
        productId: prod2Id,
        name: 'Speech AI & Transcriptions',
        description: 'Multi-lingual Whisper model pipeline, streaming audio chunking, and real-time diarization.',
        leadName: 'Dr. Aris Vance',
        leadRole: 'ML Lead',
        membersCount: 3,
        currentSprint: 'Sprint 12: Sub-second Stream Diarization',
        activeStageId: 5,
        color: 'from-violet-500 to-purple-600',
      },
      {
        id: 'team_ai_summary',
        productId: prod2Id,
        name: 'Semantic Synthesis & Insights',
        description: 'Automated executive summary generator, action items extractor, and semantic topic tagging.',
        leadName: 'Sarah Chen',
        leadRole: 'Tech Lead',
        membersCount: 3,
        currentSprint: 'Sprint 12: Action Item Accuracy Score',
        activeStageId: 5,
        color: 'from-pink-500 to-rose-600',
      },
    ];

    const prod2: CompanyProduct = {
      id: prod2Id,
      organizationId: org1Id,
      name: 'Mivo AI Copilot',
      tagline: 'Real-Time Speech-to-Text & Action Item Intelligence',
      description: 'Whisper & LLM-powered live transcription, meeting summaries, smart follow-ups, and automated semantic knowledge items.',
      iconName: 'Bot',
      colorScheme: 'from-violet-500 to-purple-600',
      status: 'active',
      currentStageId: 5, // PRD in progress
      stages: this.generateDefaultLifecycleStages(5, 'Mivo AI Copilot', 'Alex Rivera', 'Dr. Aris Vance', 'David Kim'),
      teams: prod2Teams,
      members: prod1Members.slice(0, 4),
      targetLaunchDate: '2026-12-01',
      createdAt: new Date(now - 60 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.products.set(prod2.id, prod2);

    this.productMessages.set(prod2.id, [
      {
        id: 'pmsg_201',
        productId: prod2.id,
        senderId: 'usr_demo_sarah',
        senderName: 'Sarah Chen',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        senderRole: 'Chief Architect',
        content: '💡 Finalized PRD latency budget: Streaming transcription must display within 300ms of speaker utterance.',
        stageTag: 'PRD',
        reactions: { '🎯': ['Alex Rivera'] },
        createdAt: new Date(now - 6 * 3600000).toISOString(),
      },
    ]);

    // 3. PRODUCT 3: Mivo Whiteboard & Canvas
    const prod3Id = 'prod_whiteboard';
    const prod3Teams: ProductTeam[] = [
      {
        id: 'team_canvas_engine',
        productId: prod3Id,
        name: 'Canvas Engine & WebGL',
        description: '60fps infinite spatial canvas, vector shapes, stylus smoothing, and multi-cursor rendering.',
        leadName: 'Liam Smith',
        leadRole: 'Lead Engineer',
        membersCount: 3,
        currentSprint: 'Sprint 6: CRDT Multiplayer Conflict Resolution',
        activeStageId: 3,
        color: 'from-emerald-500 to-teal-600',
      },
    ];

    const prod3: CompanyProduct = {
      id: prod3Id,
      organizationId: org1Id,
      name: 'Mivo Whiteboard & Canvas',
      tagline: 'Infinite Multiplayer Spatial Whiteboard & Wireframing',
      description: 'Real-time collaborative canvas with zero-latency vector rendering, CRDT synchronization, and spatial audio breakout zones.',
      iconName: 'Layout',
      colorScheme: 'from-emerald-500 to-teal-600',
      status: 'planning',
      currentStageId: 3, // Ideation in progress
      stages: this.generateDefaultLifecycleStages(3, 'Mivo Whiteboard', 'Alex Rivera', 'Liam Smith', 'David Kim'),
      teams: prod3Teams,
      members: prod1Members.slice(1, 4),
      targetLaunchDate: '2027-01-15',
      createdAt: new Date(now - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.products.set(prod3.id, prod3);

    this.productMessages.set(prod3.id, [
      {
        id: 'pmsg_301',
        productId: prod3.id,
        senderId: 'usr_demo_liam',
        senderName: 'Liam Smith',
        senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        senderRole: 'Lead Engineer',
        content: '🎨 Completed ideation workshop on spatial audio zones within the whiteboard canvas.',
        stageTag: 'Ideation',
        reactions: { '💡': ['David Kim', 'Alex Rivera'] },
        createdAt: new Date(now - 12 * 3600000).toISOString(),
      },
    ]);

    // 4. PRODUCT 4: Mivo Mobile & Embedded SDK
    const prod4Id = 'prod_mobile_sdk';
    const prod4Teams: ProductTeam[] = [
      {
        id: 'team_mobile_native',
        productId: prod4Id,
        name: 'Native iOS & Android Pod',
        description: 'Swift and Kotlin native modules with CallKit, Picture-in-Picture, and hardware encoder bindings.',
        leadName: 'Priya Sharma',
        leadRole: 'Mobile Lead',
        membersCount: 2,
        currentSprint: 'Sprint 2: CallKit Background Audio',
        activeStageId: 1,
        color: 'from-amber-500 to-orange-600',
      },
    ];

    const prod4: CompanyProduct = {
      id: prod4Id,
      organizationId: org1Id,
      name: 'Mivo Mobile SDK',
      tagline: 'iOS & Android Native WebRTC Client & Embeddable Kit',
      description: 'Cross-platform native mobile library for embedding high-definition audio/video calls with background Picture-in-Picture.',
      iconName: 'Smartphone',
      colorScheme: 'from-amber-500 to-orange-600',
      status: 'planning',
      currentStageId: 1, // Problem stage in progress
      stages: this.generateDefaultLifecycleStages(1, 'Mivo Mobile SDK', 'Alex Rivera', 'Priya Sharma', 'David Kim'),
      teams: prod4Teams,
      members: prod1Members.slice(0, 3),
      targetLaunchDate: '2027-02-28',
      createdAt: new Date(now - 15 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.products.set(prod4.id, prod4);

    this.productMessages.set(prod4.id, [
      {
        id: 'pmsg_401',
        productId: prod4.id,
        senderId: 'usr_demo_alex',
        senderName: 'Alex Rivera',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        senderRole: 'VP of Product',
        content: '📱 Starting user interviews with mobile developer partners to define SDK API interfaces.',
        stageTag: 'Problem',
        reactions: { '🚀': ['Sarah Chen'] },
        createdAt: new Date(now - 1 * 3600000).toISOString(),
      },
    ]);
  }

  // ==========================================
  // Public Product Store Methods
  // ==========================================

  public getProducts(organizationId?: string): CompanyProduct[] {
    const list = Array.from(this.products.values());
    if (organizationId) {
      return list.filter((p) => p.organizationId === organizationId);
    }
    return list;
  }

  public getProductById(productId: string): CompanyProduct | null {
    return this.products.get(productId) || null;
  }

  public createProduct(data: CreateProductRequest & { organizationId?: string }): CompanyProduct {
    const productId = `prod_${nanoid(10)}`;
    const now = new Date().toISOString();
    const orgId = data.organizationId || 'org_demo_1';

    const teams: ProductTeam[] = (data.initialTeams || [
      {
        name: 'Core Squad',
        description: 'Core product engineering and delivery team',
        leadName: 'Alex Rivera',
        leadRole: 'Product Lead',
        color: 'from-cyan-500 to-blue-600',
      },
    ]).map((t, idx) => ({
      id: `team_${nanoid(8)}`,
      productId,
      name: t.name,
      description: t.description,
      leadName: t.leadName,
      leadRole: t.leadRole,
      membersCount: 3,
      currentSprint: 'Sprint 1: Problem & Discovery Sprint',
      activeStageId: 1,
      color: t.color || 'from-cyan-500 to-blue-600',
    }));

    const stages = this.generateDefaultLifecycleStages(
      1,
      data.name,
      teams[0]?.leadName || 'Alex Rivera',
      'Sarah Chen',
      'David Kim'
    );

    const newProduct: CompanyProduct = {
      id: productId,
      organizationId: orgId,
      name: data.name.trim(),
      tagline: (data.tagline || '').trim(),
      description: (data.description || '').trim(),
      iconName: data.iconName || 'Layers',
      colorScheme: data.colorScheme || 'from-mivo-500 to-cyan-500',
      status: 'active',
      currentStageId: 1,
      stages,
      teams,
      members: [
        {
          id: `pmem_${nanoid(6)}`,
          userId: 'usr_demo_alex',
          name: 'Alex Rivera',
          email: 'alex@mivo.collab',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: 'product_lead',
          title: 'Product Lead',
          assignedTeamId: teams[0]?.id,
          assignedTeamName: teams[0]?.name,
          joinedAt: now,
        },
      ],
      targetLaunchDate: data.targetLaunchDate,
      createdAt: now,
      updatedAt: now,
    };

    this.products.set(productId, newProduct);
    this.productMessages.set(productId, [
      {
        id: `pmsg_${nanoid(8)}`,
        productId,
        senderId: 'sys',
        senderName: 'Mivo System Bot',
        senderRole: 'Platform Assistant',
        content: `🎉 Product **${newProduct.name}** initialized with 15-stage lifecycle timeline! Active Stage: **1. Problem Discovery**.`,
        isSystemAnnouncement: true,
        stageTag: 'Problem',
        createdAt: now,
      },
    ]);

    return newProduct;
  }

  public updateProductStage(
    productId: string,
    stageId: number,
    update: Partial<ProductLifecycleStage>
  ): CompanyProduct | null {
    const product = this.products.get(productId);
    if (!product) return null;

    product.stages = product.stages.map((st) => (st.id === stageId ? { ...st, ...update } : st));
    product.updatedAt = new Date().toISOString();
    return product;
  }

  public advanceProductStage(productId: string): CompanyProduct | null {
    const product = this.products.get(productId);
    if (!product) return null;

    const currentIdx = product.stages.findIndex((s) => s.status === 'in-progress');
    if (currentIdx === -1 || currentIdx === product.stages.length - 1) return product;

    const completedStage = product.stages[currentIdx];
    const nextStage = product.stages[currentIdx + 1];

    product.stages[currentIdx].status = 'completed';
    product.stages[currentIdx + 1].status = 'in-progress';
    if (currentIdx + 2 < product.stages.length) {
      product.stages[currentIdx + 2].status = 'next-up';
    }

    product.currentStageId = nextStage.id;
    product.updatedAt = new Date().toISOString();

    // Broadcast system message in product conversation
    const messages = this.productMessages.get(productId) || [];
    messages.push({
      id: `pmsg_${nanoid(8)}`,
      productId,
      senderId: 'sys',
      senderName: 'Mivo Stage Bot',
      senderRole: 'Workflow Automation',
      content: `🏆 **Stage Gate Promoted!** Stage #${completedStage.id} (**${completedStage.name}**) has been completed. The squad is now focused on Stage #${nextStage.id} (**${nextStage.name}**).`,
      isSystemAnnouncement: true,
      stageTag: nextStage.name,
      createdAt: new Date().toISOString(),
    });
    this.productMessages.set(productId, messages);

    return product;
  }

  public toggleProductTask(
    productId: string,
    stageId: number,
    section: 'workDone' | 'workNext',
    taskId: string
  ): CompanyProduct | null {
    const product = this.products.get(productId);
    if (!product) return null;

    product.stages = product.stages.map((st) => {
      if (st.id !== stageId) return st;
      return {
        ...st,
        [section]: st[section].map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
      };
    });

    product.updatedAt = new Date().toISOString();
    return product;
  }

  public addProductTask(
    productId: string,
    stageId: number,
    section: 'workDone' | 'workNext',
    text: string,
    assigneeName?: string
  ): CompanyProduct | null {
    const product = this.products.get(productId);
    if (!product) return null;

    const newTask: ProductLifecycleTask = {
      id: `task_${stageId}_${nanoid(6)}`,
      text: text.trim(),
      completed: section === 'workDone',
      assigneeName: assigneeName || 'Team Member',
    };

    product.stages = product.stages.map((st) => {
      if (st.id !== stageId) return st;
      return {
        ...st,
        [section]: [...st[section], newTask],
      };
    });

    product.updatedAt = new Date().toISOString();
    return product;
  }

  public deleteProductTask(
    productId: string,
    stageId: number,
    section: 'workDone' | 'workNext',
    taskId: string
  ): CompanyProduct | null {
    const product = this.products.get(productId);
    if (!product) return null;

    product.stages = product.stages.map((st) => {
      if (st.id !== stageId) return st;
      return {
        ...st,
        [section]: st[section].filter((t) => t.id !== taskId),
      };
    });

    product.updatedAt = new Date().toISOString();
    return product;
  }

  public getProductMessages(productId: string): ProductChatMessage[] {
    return this.productMessages.get(productId) || [];
  }

  public sendProductMessage(
    productId: string,
    message: {
      senderId: string;
      senderName: string;
      senderAvatar?: string | null;
      senderRole?: string;
      content: string;
      teamId?: string;
      stageTag?: string;
    }
  ): ProductChatMessage {
    const messages = this.productMessages.get(productId) || [];
    const newMsg: ProductChatMessage = {
      id: `pmsg_${nanoid(10)}`,
      productId,
      teamId: message.teamId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderAvatar: message.senderAvatar,
      senderRole: message.senderRole || 'Team Member',
      content: message.content.trim(),
      stageTag: message.stageTag,
      createdAt: new Date().toISOString(),
    };

    messages.push(newMsg);
    this.productMessages.set(productId, messages);
    return newMsg;
  }

  public addProductMember(productId: string, member: AddProductMemberRequest): CompanyProduct | null {
    const product = this.products.get(productId);
    if (!product) return null;

    const team = product.teams.find((t) => t.id === member.assignedTeamId);

    const newMember: ProductMember = {
      id: `pmem_${nanoid(8)}`,
      userId: member.userId || `usr_${nanoid(6)}`,
      name: member.name.trim(),
      email: member.email.trim(),
      role: member.role,
      title: member.title.trim(),
      assignedTeamId: member.assignedTeamId,
      assignedTeamName: team ? team.name : undefined,
      joinedAt: new Date().toISOString(),
    };

    product.members.push(newMember);
    if (team) {
      team.membersCount = (team.membersCount || 0) + 1;
    }
    product.updatedAt = new Date().toISOString();
    return product;
  }

  public addProductTeam(productId: string, team: CreateProductTeamRequest): CompanyProduct | null {
    const product = this.products.get(productId);
    if (!product) return null;

    const newTeam: ProductTeam = {
      id: `team_${nanoid(8)}`,
      productId,
      name: team.name.trim(),
      description: team.description.trim(),
      leadName: team.leadName.trim(),
      leadRole: team.leadRole.trim(),
      membersCount: 1,
      currentSprint: team.currentSprint || 'Sprint 1: Kickoff',
      activeStageId: product.currentStageId,
      color: team.color || 'from-mivo-500 to-cyan-500',
    };

    product.teams.push(newTeam);
    product.updatedAt = new Date().toISOString();
    return product;
  }
}



