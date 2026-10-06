/**
 * @file NotificationDrawer.jsx
 * @description Quick-access notification drawer for the Lover-HQ Top Navigation Bar.
 * Displays recent alerts, partner updates, fridge additions, and game invitations.
 *
 * Implements:
 * - Aggregate Read acknowledgement on open with granular unread visual distinctions.
 * - Subtle tint distinction for unread items fading smoothly to read state.
 * - Smooth transition when clearing alerts.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Heart, MessageCircle, Gamepad2, Sparkles, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * @typedef {Object} NotificationItem
 * @property {string} id - Unique identifier
 * @property {string} title - Notification title
 * @property {string} message - Notification description
 * @property {'chat'|'fridge'|'game'|'presence'} type - Category
 * @property {string} timestamp - Human readable timestamp
 * @property {boolean} [isUnread] - Whether notification is unread
 * @property {string} [link] - Optional destination route
 */

/**
 * Notification Drawer component for top navigation bar.
 *
 * @param {object} props - Component props
 * @param {boolean} props.isOpen - Whether drawer is open
 * @param {Function} props.onClose - Dismiss handler
 * @param {Array<NotificationItem>} props.notifications - List of alerts
 * @param {Function} props.onClear - Clear alerts callback
 * @returns {React.ReactElement}
 */
export function NotificationDrawer({ isOpen, onClose, notifications = [], onClear }) {
  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'chat':
        return <MessageCircle className="w-4 h-4 text-sky-400" />;
      case 'fridge':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'game':
        return <Gamepad2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Heart className="w-4 h-4 text-rose-400" />;
    }
  };

  const handleNotificationClick = (item) => {
    if (item.link) {
      navigate(item.link);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
          />

          {/* Drawer Menu */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 right-4 sm:right-6 w-80 sm:w-96 max-h-[80vh] bg-surface/95 border border-surface-border rounded-3xl shadow-2xl backdrop-blur-2xl z-[75] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-main">Alerts & Updates</h3>
                  <p className="text-[10px] text-text-muted">Recent shared moments</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={onClear}
                    className="text-[11px] font-semibold text-text-muted hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                    title="Mark all as read"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-surface-border/50 text-text-muted hover:text-text-main transition-colors cursor-pointer"
                  aria-label="Close notification panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {notifications.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-surface-border/40 flex items-center justify-center text-text-muted mb-2">
                    <Heart className="w-6 h-6 stroke-1" />
                  </div>
                  <p className="text-xs font-semibold text-text-main">All caught up</p>
                  <p className="text-[11px] text-text-muted mt-1">
                    No new alerts right now. Enjoy your moments together.
                  </p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex gap-3 items-start ${
                      item.isUnread
                        ? 'bg-sky-500/10 border-sky-500/30 hover:bg-sky-500/15'
                        : 'bg-surface-border/20 hover:bg-surface-border/40 border-surface-border/60'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-surface/80 border border-surface-border shrink-0 mt-0.5">
                      {getNotificationIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {item.isUnread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-text-main truncate">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-text-muted shrink-0 font-medium">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2">
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
