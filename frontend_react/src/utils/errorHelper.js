/**
 * Extract user-friendly error message from API error response
 * @param {unknown} error - Error object from API call
 * @returns {string} User-friendly error message
 */
export function extractErrorMessage(error) {
  // Check if it's a fetch response error with JSON data
  if (error && typeof error === 'object') {
    // If error has a message property directly (from authService)
    if (error.message && typeof error.message === 'string') {
      return error.message;
    }
    
    // If error has response data (axios-style)
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (data.message) {
        return data.message;
      }
    }
    
    // If error has data property directly
    if (error.data && error.data.message) {
      return error.data.message;
    }
  }
  
  // Network error or unknown error
  return 'Unable to reach the server. Please try again.';
}
