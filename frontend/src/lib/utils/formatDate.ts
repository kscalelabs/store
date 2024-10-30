import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
  formatDistanceToNow,
} from "date-fns";

export const formatTimeSince = (date: Date): string => {
  const now = new Date();
  const daysAgo = differenceInDays(now, date);
  const hoursAgo = differenceInHours(now, date);
  const minutesAgo = differenceInMinutes(now, date);

  if (daysAgo > 7) {
    return format(date, "MMMM d, yyyy");
  } else if (daysAgo > 0) {
    return formatDistanceToNow(date, { addSuffix: true });
  } else if (hoursAgo > 0) {
    return `${hoursAgo} ${hoursAgo > 1 ? "hours" : "hour"} ago`;
  } else {
    return `${minutesAgo} ${minutesAgo === 1 ? "minute" : "minutes"} ago`;
  }
};

export const formatDate = (date: Date): string => {
  return format(date, "MMMM d, yyyy");
};
