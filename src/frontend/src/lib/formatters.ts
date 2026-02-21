/**
 * Formats a timestamp (in nanoseconds) to a human-readable date string
 */
export function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1000000);
  return date.toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Formats weight from storage format (weight * 100) to display format with 2 decimal places
 */
export function formatWeight(weight: bigint): string {
  return (Number(weight) / 100).toFixed(2);
}

/**
 * Converts a date string to nanoseconds timestamp for backend storage
 * @param dateString - Date string in ISO format (YYYY-MM-DD)
 * @returns Nanoseconds timestamp as bigint, or 0n if empty/invalid
 */
export function dateToNanoseconds(dateString: string): bigint {
  if (!dateString || dateString.trim() === '') {
    console.log('dateToNanoseconds: Empty date string, returning 0n');
    return BigInt(0);
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error('dateToNanoseconds: Invalid date string:', dateString);
      return BigInt(0);
    }
    
    const nanoseconds = BigInt(date.getTime()) * BigInt(1_000_000);
    console.log(`dateToNanoseconds: ${dateString} -> ${nanoseconds}n (${date.toISOString()})`);
    return nanoseconds;
  } catch (error) {
    console.error('dateToNanoseconds: Error converting date:', dateString, error);
    return BigInt(0);
  }
}

/**
 * Converts currency amount to bigint cents for backend storage
 * @param value - Currency value as string (e.g., "123.45")
 * @returns Amount in cents as bigint
 */
export function currencyToBigIntCents(value: string): bigint {
  if (!value || value.trim() === '') {
    console.log('currencyToBigIntCents: Empty value, returning 0n');
    return BigInt(0);
  }
  
  try {
    const num = parseFloat(value);
    if (isNaN(num)) {
      console.error('currencyToBigIntCents: Invalid number:', value);
      return BigInt(0);
    }
    
    const cents = BigInt(Math.round(num * 100));
    console.log(`currencyToBigIntCents: ${value} -> ${cents}n (${num} * 100)`);
    return cents;
  } catch (error) {
    console.error('currencyToBigIntCents: Error converting currency:', value, error);
    return BigInt(0);
  }
}

/**
 * Sanitizes and converts weight value to bigint for backend storage
 * Handles empty strings, null, undefined, and non-numeric input
 * @param value - Weight value as string (e.g., "12.34")
 * @returns Weight as bigint (rounded to nearest integer)
 */
export function sanitizeWeight(value: string): bigint {
  if (!value || value.trim() === '') {
    console.log('sanitizeWeight: Empty value, returning 0n');
    return BigInt(0);
  }
  
  try {
    // Remove any non-numeric characters except decimal point and minus sign
    const cleaned = value.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    
    if (isNaN(num)) {
      console.error('sanitizeWeight: Invalid number after cleaning:', value, '->', cleaned);
      return BigInt(0);
    }
    
    if (num < 0) {
      console.warn('sanitizeWeight: Negative weight detected, using absolute value:', num);
      const weight = BigInt(Math.round(Math.abs(num)));
      console.log(`sanitizeWeight: ${value} -> ${weight}n (abs)`);
      return weight;
    }
    
    const weight = BigInt(Math.round(num));
    console.log(`sanitizeWeight: ${value} -> ${weight}n`);
    return weight;
  } catch (error) {
    console.error('sanitizeWeight: Error converting weight:', value, error);
    return BigInt(0);
  }
}

/**
 * Validates that a bigint value is within a reasonable range
 * @param value - The bigint value to validate
 * @param fieldName - Name of the field for logging
 * @param min - Minimum allowed value (default: 0)
 * @param max - Maximum allowed value (default: Number.MAX_SAFE_INTEGER)
 * @returns true if valid, false otherwise
 */
export function validateBigIntRange(
  value: bigint,
  fieldName: string,
  min: bigint = BigInt(0),
  max: bigint = BigInt(Number.MAX_SAFE_INTEGER)
): boolean {
  if (value < min || value > max) {
    console.error(`validateBigIntRange: ${fieldName} out of range: ${value}n (min: ${min}n, max: ${max}n)`);
    return false;
  }
  console.log(`validateBigIntRange: ${fieldName} = ${value}n ✓`);
  return true;
}

/**
 * Formats backend error messages into user-friendly text
 * Extracts error details from trapped backend calls and common error patterns
 * @param error - The error object from the backend
 * @param defaultMessage - Default message if no specific pattern is matched
 * @returns User-friendly error message
 */
export function formatBackendError(error: any, defaultMessage: string = 'An error occurred. Please try again.'): string {
  if (!error) return defaultMessage;
  
  // Extract error message from various error formats
  let errorMsg = '';
  
  if (typeof error === 'string') {
    errorMsg = error;
  } else if (error.message) {
    errorMsg = error.message;
  } else if (error.toString) {
    errorMsg = error.toString();
  }
  
  console.log('formatBackendError: Raw error message:', errorMsg);
  
  // Common backend trap patterns
  if (errorMsg.includes('Unauthorized')) {
    if (errorMsg.includes('Only users can')) {
      return 'You must be logged in to perform this action. Please log in and try again.';
    }
    return 'You do not have permission to perform this action. Please log in.';
  }
  
  if (errorMsg.includes('not found')) {
    if (errorMsg.includes('Order')) {
      return 'Order not found. It may have been deleted or does not exist.';
    }
    if (errorMsg.includes('Repair order')) {
      return 'Repair order not found. It may have been deleted or does not exist.';
    }
    if (errorMsg.includes('Service')) {
      return 'Service not found. It may have been deleted or does not exist.';
    }
    return 'The requested item was not found.';
  }
  
  if (errorMsg.includes('not available') || errorMsg.includes('actor not available')) {
    return 'Connection to backend failed. Please refresh the page and try again.';
  }
  
  if (errorMsg.includes('validation') || errorMsg.includes('required') || errorMsg.includes('invalid')) {
    return 'Please check all required fields and ensure they contain valid data.';
  }
  
  if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // If we have a specific error message from the backend, use it
  if (errorMsg && errorMsg.length > 0 && errorMsg !== '[object Object]') {
    // Clean up the error message
    const cleanMsg = errorMsg
      .replace(/^Error:\s*/i, '')
      .replace(/^Reject text:\s*/i, '')
      .replace(/Call was rejected:\s*/i, '')
      .trim();
    
    if (cleanMsg.length > 0 && cleanMsg.length < 200) {
      return cleanMsg;
    }
  }
  
  return defaultMessage;
}
