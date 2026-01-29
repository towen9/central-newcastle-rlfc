// Offline caching utilities for Game Day Pass and Membership

export const OfflineCache = {
  // Cache game day pass
  cacheGameDayPass: (entryId, entry, event) => {
    try {
      const cacheData = {
        entry,
        event,
        cachedAt: new Date().toISOString()
      };
      localStorage.setItem(`gameday_pass_${entryId}`, JSON.stringify(cacheData));
      
      // Also cache the QR code image
      if (entry?.pass_qr_code) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${entry.pass_qr_code}`;
        fetch(qrUrl).then(response => response.blob()).then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            localStorage.setItem(`gameday_qr_${entryId}`, reader.result);
          };
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.error('Error caching game day pass:', error);
    }
  },

  // Get cached game day pass
  getCachedGameDayPass: (entryId) => {
    try {
      const cached = localStorage.getItem(`gameday_pass_${entryId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  },

  // Get cached QR code
  getCachedQR: (entryId) => {
    try {
      return localStorage.getItem(`gameday_qr_${entryId}`);
    } catch (error) {
      return null;
    }
  },

  // Cache membership data
  cacheMembership: (userId, membership, user) => {
    try {
      const cacheData = {
        membership,
        user,
        cachedAt: new Date().toISOString()
      };
      localStorage.setItem(`membership_${userId}`, JSON.stringify(cacheData));
      
      // Cache membership QR
      if (membership?.qr_code_id) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${membership.qr_code_id}`;
        fetch(qrUrl).then(response => response.blob()).then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            localStorage.setItem(`membership_qr_${userId}`, reader.result);
          };
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.error('Error caching membership:', error);
    }
  },

  // Get cached membership
  getCachedMembership: (userId) => {
    try {
      const cached = localStorage.getItem(`membership_${userId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  },

  // Get cached membership QR
  getCachedMembershipQR: (userId) => {
    try {
      return localStorage.getItem(`membership_qr_${userId}`);
    } catch (error) {
      return null;
    }
  },

  // Clear expired game day passes
  clearExpiredPasses: () => {
    try {
      const keys = Object.keys(localStorage);
      const now = new Date();
      
      keys.forEach(key => {
        if (key.startsWith('gameday_pass_')) {
          const cached = localStorage.getItem(key);
          if (cached) {
            const data = JSON.parse(cached);
            const cachedDate = new Date(data.cachedAt);
            // Remove if cached more than 2 days ago
            if ((now - cachedDate) / (1000 * 60 * 60 * 24) > 2) {
              localStorage.removeItem(key);
              const entryId = key.replace('gameday_pass_', '');
              localStorage.removeItem(`gameday_qr_${entryId}`);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error clearing expired passes:', error);
    }
  }
};