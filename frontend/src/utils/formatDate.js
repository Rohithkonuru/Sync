import { formatDistanceToNow } from 'date-fns';

export const formatRelativeDate = (dateValue) => {
  if (!dateValue) return '';
  try {
    return formatDistanceToNow(new Date(dateValue), { addSuffix: true });
  } catch {
    return '';
  }
};
