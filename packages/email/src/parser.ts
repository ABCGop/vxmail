export interface ParsedSearchQuery {
  rawQuery: string;
  from?: string;
  to?: string;
  subject?: string;
  hasAttachment?: boolean;
  isUnread?: boolean;
  isStarred?: boolean;
  isImportant?: boolean;
  inFolder?: string;
  label?: string;
  afterDate?: Date;
  beforeDate?: Date;
  textTokens: string[];
}

/**
 * Parses a Gmail-style query string into structured filter fields.
 * Example: `from:support@vxmusic.in has:attachment is:unread urgent update`
 */
export function parseEmailSearchQuery(queryString: string): ParsedSearchQuery {
  const result: ParsedSearchQuery = {
    rawQuery: queryString,
    textTokens: [],
  };

  if (!queryString || typeof queryString !== "string") {
    return result;
  }

  // Regex to match key:value, key:"quoted value", or standalone words / phrases
  const tokenRegex = /(?:([a-zA-Z-]+):(?:"([^"]+)"|([^\s]+)))|(?:"([^"]+)"|([^\s]+))/g;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(queryString)) !== null) {
    const key = match[1]?.toLowerCase();
    const quotedValue = match[2];
    const plainValue = match[3];
    const val = quotedValue !== undefined ? quotedValue : plainValue;

    const freeQuoted = match[4];
    const freeWord = match[5];

    if (key && val !== undefined) {
      switch (key) {
        case "from":
          result.from = val.toLowerCase();
          break;
        case "to":
          result.to = val.toLowerCase();
          break;
        case "subject":
          result.subject = val;
          break;
        case "has":
          if (val.toLowerCase() === "attachment" || val.toLowerCase() === "attachments") {
            result.hasAttachment = true;
          }
          break;
        case "is": {
          const v = val.toLowerCase();
          if (v === "unread") result.isUnread = true;
          if (v === "read") result.isUnread = false;
          if (v === "starred") result.isStarred = true;
          if (v === "important") result.isImportant = true;
          break;
        }
        case "in":
          result.inFolder = val.toLowerCase();
          break;
        case "label":
          result.label = val;
          break;
        case "after": {
          const d = new Date(val);
          if (!isNaN(d.getTime())) result.afterDate = d;
          break;
        }
        case "before": {
          const d = new Date(val);
          if (!isNaN(d.getTime())) result.beforeDate = d;
          break;
        }
        default:
          result.textTokens.push(`${key}:${val}`);
          break;
      }
    } else {
      const freeText = freeQuoted !== undefined ? freeQuoted : freeWord;
      if (freeText) {
        result.textTokens.push(freeText);
      }
    }
  }

  return result;
}
