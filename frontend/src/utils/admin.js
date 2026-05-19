/**
 * Admin utilities - Check if a user is an admin
 */

// Get admin emails from environment variable or config
// Format: comma-separated list like "admin1@example.com,admin2@example.com"
const getAdminEmails = () => {
  const envAdmins = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  if (envAdmins) {
    return envAdmins.split(',').map((email) => email.trim().toLowerCase());
  }
  // Default admin email - you can change this
  return [];
};

const ADMIN_EMAILS = getAdminEmails();

/**
 * Check if a user is an admin based on their email
 * @param {Object} user - Firebase user object
 * @returns {boolean} - True if user is an admin
 */
export const isAdmin = (user) => {
  if (!user || !user.email) {
    return false;
  }

  const userEmail = user.email.toLowerCase().trim();
  return ADMIN_EMAILS.includes(userEmail);
};

/**
 * Check if a user is the host of a specific party.
 * Use this on event pages instead of isAdmin() — each customer should only
 * have admin power over their own party, not every party on the platform.
 *
 * @param {Object} user       - Firebase user object
 * @param {string} hostEmail  - The party.host.email value from Django
 * @returns {boolean}
 */
export const isPartyHost = (user, hostEmail) => {
  if (!user?.email || !hostEmail) return false;
  return user.email.toLowerCase().trim() === hostEmail.toLowerCase().trim();
};

/**
 * Hook to check admin status (can be extended to check with backend)
 * @param {Object} user - Firebase user object
 * @returns {Object} - { isAdmin: boolean, checking: boolean }
 */
export const useAdminStatus = (user) => ({
    isAdmin: isAdmin(user),
    checking: false,
  });
