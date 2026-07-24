/**
 * @file messageGrouping.test.js
 * @description Unit tests for groupChatMessages utility function.
 */

import { describe, it, expect } from 'vitest';
import { groupChatMessages } from './messageGrouping';

describe('groupChatMessages', () => {
  it('returns empty array when messages is null or empty', () => {
    expect(groupChatMessages(null, 'user-1', null)).toEqual([]);
    expect(groupChatMessages([], 'user-1', null)).toEqual([]);
  });

  it('inserts date dividers for Today and Yesterday', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const msgs = [
      { id: '1', user_id: 'user-1', content: 'Hi', created_at: yesterday.toISOString() },
      { id: '2', user_id: 'user-2', content: 'Hello', created_at: now.toISOString() },
    ];

    const result = groupChatMessages(msgs, 'user-1', null);

    expect(result[0]).toEqual({ type: 'date', label: 'Yesterday' });
    expect(result[1].type).toEqual('single');
    expect(result[1].data.id).toEqual('1');

    expect(result[2]).toEqual({ type: 'date', label: 'Today' });
    expect(result[3].type).toEqual('single');
    expect(result[3].data.id).toEqual('2');
  });

  it('hides header for consecutive messages from same user within 2 minutes', () => {
    const now = new Date();
    const msg1 = { id: '1', user_id: 'user-1', content: 'Msg 1', created_at: now.toISOString() };
    const msg2 = {
      id: '2',
      user_id: 'user-1',
      content: 'Msg 2',
      created_at: new Date(now.getTime() + 30000).toISOString(),
    };

    const result = groupChatMessages([msg1, msg2], 'user-1', null);

    // [0]: date, [1]: msg1 (hideHeader: false), [2]: msg2 (hideHeader: true)
    expect(result[1].hideHeader).toBe(false);
    expect(result[2].hideHeader).toBe(true);
  });

  it('groups consecutive media messages within 15 seconds into media_group', () => {
    const now = new Date();
    const media1 = {
      id: '1',
      user_id: 'user-1',
      media_type: 'image',
      created_at: now.toISOString(),
    };
    const media2 = {
      id: '2',
      user_id: 'user-1',
      media_type: 'image',
      created_at: new Date(now.getTime() + 5000).toISOString(),
    };

    const result = groupChatMessages([media1, media2], 'user-1', null);

    expect(result[1].type).toBe('media_group');
    expect(result[1].messages).toHaveLength(2);
  });

  it('inserts unread_divider before first unread message from partner', () => {
    const past = new Date(Date.now() - 3600000);
    const unreadTime = new Date(Date.now() - 60000);

    const msgs = [
      { id: '1', user_id: 'user-1', content: 'Old', created_at: past.toISOString() },
      {
        id: '2',
        user_id: 'user-2',
        content: 'Unread partner msg',
        created_at: unreadTime.toISOString(),
      },
    ];

    const lastRead = new Date(Date.now() - 120000).toISOString();
    const result = groupChatMessages(msgs, 'user-1', lastRead);

    const unreadDivider = result.find((r) => r.type === 'unread_divider');
    expect(unreadDivider).toBeDefined();
    expect(unreadDivider.count).toBe(1);
  });
});
