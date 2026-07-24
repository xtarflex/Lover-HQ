/**
 * @file messageGrouping.js
 * @description Helper utility that transforms raw chat messages into structured groups:
 * - Date dividers ("Today", "Yesterday", or formatted weekday/date banners)
 * - Unread message dividers ("N Unread Messages")
 * - Media groups (clustering consecutive photos/videos within 15 seconds)
 * - Header hiding (collapsing repeated sender headers within 2 minutes)
 */

/**
 * Transforms an array of messages into formatted render groups for MessageList.
 *
 * @param {Array} messages - List of message objects.
 * @param {string} userId - Current user's ID.
 * @param {string|null} lastReadTimestamp - ISO timestamp of when the user last opened the chat.
 * @returns {Array} List of grouped items with structure { type, label, data, messages, count, hideHeader }.
 */
export function groupChatMessages(messages, userId, lastReadTimestamp) {
  if (!messages || messages.length === 0) return [];

  const groups = [];
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayString = today.toDateString();
  const yesterdayString = yesterday.toDateString();

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const lastReadDate = lastReadTimestamp ? new Date(lastReadTimestamp) : null;
  const partnerUnreadMessages = messages.filter(
    (m) =>
      m.user_id !== userId &&
      lastReadDate &&
      new Date(m.created_at || Date.now()).getTime() > lastReadDate.getTime()
  );
  const unreadCount = partnerUnreadMessages.length;
  let hasInsertedUnreadDivider = false;

  let lastDateLabel = '';
  let prevMsg = null;
  let prevMsgTime = 0;

  messages.forEach((msg) => {
    const date = new Date(msg.created_at || Date.now());
    const msgTime = date.getTime();

    let label = '';
    const dateString = date.toDateString();
    if (dateString === todayString) {
      label = 'Today';
    } else if (dateString === yesterdayString) {
      label = 'Yesterday';
    } else {
      label = dateFormatter.format(date);
    }

    let isFirstMessageOfDay = false;
    if (label !== lastDateLabel) {
      groups.push({ type: 'date', label });
      lastDateLabel = label;
      isFirstMessageOfDay = true;
    }

    // Inject unread messages divider right before the first unread message from partner
    if (
      unreadCount > 0 &&
      !hasInsertedUnreadDivider &&
      partnerUnreadMessages[0] &&
      msg.id === partnerUnreadMessages[0].id
    ) {
      groups.push({ type: 'unread_divider', count: unreadCount });
      hasInsertedUnreadDivider = true;
    }

    // Check if we can couple this image/video with the previous image/video message
    let coupled = false;
    if (
      (msg.media_type === 'image' || msg.media_type === 'video') &&
      prevMsg &&
      (prevMsg.media_type === 'image' || prevMsg.media_type === 'video') &&
      prevMsg.user_id === msg.user_id
    ) {
      const diffTime = (msgTime - prevMsgTime) / 1000;
      if (diffTime < 15) {
        const lastGroupIdx = groups.length - 1;
        if (lastGroupIdx >= 0) {
          const lastGroup = groups[lastGroupIdx];
          if (lastGroup.type === 'media_group') {
            lastGroup.messages.push(msg);
            coupled = true;
          } else if (lastGroup.type === 'single' && lastGroup.data?.id === prevMsg.id) {
            groups[lastGroupIdx] = {
              type: 'media_group',
              messages: [prevMsg, msg],
              user_id: msg.user_id,
              hideHeader: lastGroup.hideHeader,
            };
            coupled = true;
          }
        }
      }
    }

    if (!coupled) {
      let hideHeader = false;
      if (!isFirstMessageOfDay && prevMsg) {
        const diffTime = (msgTime - prevMsgTime) / 1000;
        if (prevMsg.user_id === msg.user_id && diffTime < 120) {
          hideHeader = true;
        }
      }
      groups.push({ type: 'single', data: msg, hideHeader });
    }

    prevMsg = msg;
    prevMsgTime = msgTime;
  });

  return groups;
}
