import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
  organizationName: z.string().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  timezone: z.string().optional(),
  preferences: z
    .object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      defaultMicMuted: z.boolean().optional(),
      defaultCamMuted: z.boolean().optional(),
      noiseSuppression: z.boolean().optional(),
      echoCancellation: z.boolean().optional(),
      hdVideo: z.boolean().optional(),
      emailNotifications: z.boolean().optional(),
      soundAlerts: z.boolean().optional(),
    })
    .optional(),
});

export const CreateMeetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required').max(120),
  description: z.string().max(500).optional(),
  type: z.enum(['instant', 'scheduled', 'recurring', 'persistent_room']).default('instant'),
  scheduledStartTime: z.string().datetime().optional().nullable(),
  scheduledEndTime: z.string().datetime().optional().nullable(),
  configuration: z
    .object({
      waitingRoom: z.boolean().optional().default(false),
      allowScreenShare: z.boolean().optional().default(true),
      allowChat: z.boolean().optional().default(true),
      muteOnEntry: z.boolean().optional().default(false),
      videoOnEntry: z.boolean().optional().default(true),
      requireAuth: z.boolean().optional().default(false),
      recordingEnabled: z.boolean().optional().default(false),
      aiTranscription: z.boolean().optional().default(true),
    })
    .optional(),
});

export type CreateMeetingInput = z.infer<typeof CreateMeetingSchema>;

export const ScheduleMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  description: z.string().max(500).optional(),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  participants: z.array(z.string().email()).optional().default([]),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
  waitingRoom: z.boolean().default(false),
  muteOnEntry: z.boolean().default(false),
  recordingEnabled: z.boolean().default(false),
});

export type ScheduleMeetingInput = z.infer<typeof ScheduleMeetingSchema>;

export const JoinMeetingSchema = z.object({
  publicMeetingId: z.string().min(3, 'Invalid meeting ID format'),
  displayName: z.string().min(1, 'Display name is required').max(60),
  avatarUrl: z.string().optional().nullable(),
  passcode: z.string().optional(),
});

export const SendMessageSchema = z.object({
  meetingId: z.string().min(1),
  content: z.string().min(1, 'Message cannot be empty').max(2000),
  recipientId: z.string().optional().nullable(),
});

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes')
    .optional(),
});

export const InviteMemberSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'member', 'guest']).default('member'),
  teamId: z.string().optional(),
});

export const CreateTeamSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(300).optional(),
});

export const BillingCheckoutSchema = z.object({
  planId: z.enum(['pro', 'business', 'enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']),
  provider: z.enum(['stripe', 'razorpay']).default('stripe'),
  organizationId: z.string().optional(),
});

export const CreateChannelSchema = z.object({
  name: z
    .string()
    .min(2, 'Channel name must be at least 2 characters')
    .max(50)
    .regex(/^[a-z0-9-_]+$/, 'Channel name can only contain lowercase letters, numbers, hyphens, and underscores'),
  description: z.string().max(250).optional(),
  topic: z.string().max(100).optional(),
  isPrivate: z.boolean().default(false),
});

export const SendTeamMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
        size: z.string(),
        type: z.string(),
      })
    )
    .optional(),
  codeSnippet: z
    .object({
      code: z.string(),
      language: z.string(),
    })
    .optional(),
  meetingInvite: z
    .object({
      meetingId: z.string(),
      title: z.string(),
      status: z.enum(['active', 'ended']),
      startedByName: z.string(),
    })
    .optional(),
});

export const ReactMessageSchema = z.object({
  emoji: z.string().min(1).max(10),
});

