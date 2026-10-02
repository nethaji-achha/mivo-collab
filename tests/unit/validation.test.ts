import { RegisterSchema, LoginSchema, CreateMeetingSchema, ScheduleMeetingSchema } from '../../packages/validation/src';

describe('Validation Schemas Unit Tests', () => {
  test('validates valid user registration payload', () => {
    const validData = {
      email: 'alex@mivo.collab',
      password: 'Password123!',
      name: 'Alex Rivera',
      organizationName: 'HyperDevelopers',
    };
    const result = RegisterSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects short passwords', () => {
    const invalidData = {
      email: 'alex@mivo.collab',
      password: 'short',
      name: 'Alex Rivera',
    };
    const result = RegisterSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  test('validates valid meeting creation payload', () => {
    const validData = {
      title: 'Sprint Architecture Sync',
      type: 'instant',
      configuration: {
        waitingRoom: false,
        allowScreenShare: true,
        allowChat: true,
      },
    };
    const result = CreateMeetingSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('validates schedule meeting payload', () => {
    const validSchedule = {
      title: 'Quarterly Planning',
      date: '2026-10-01',
      startTime: '10:00',
      endTime: '11:00',
      participants: ['sarah@hyperdevs.io', 'liam@hyperdevs.io'],
      recurrence: 'weekly',
      waitingRoom: true,
      muteOnEntry: true,
      recordingEnabled: true,
    };
    const result = ScheduleMeetingSchema.safeParse(validSchedule);
    expect(result.success).toBe(true);
  });
});
