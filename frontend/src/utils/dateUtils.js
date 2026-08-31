/**
 * Utilitários de fuso horário (América/São Paulo - Horário de Brasília) e internacionalização de datas.
 */

export function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  // Se for uma string ISO sem fuso especificado (sem Z e sem offset +/-), assume UTC do backend
  if (typeof dateStr === 'string' && dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
}

export function getTodayBrasiliaDate() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date()); // Retorna "YYYY-MM-DD"
}

export function formatBrasiliaDateTime(dateStr, lang = 'pt') {
  const d = parseDate(dateStr);
  if (!d || isNaN(d.getTime())) return dateStr || '';
  
  return d.toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatBrasiliaTime(dateStr, lang = 'pt') {
  const d = parseDate(dateStr);
  if (!d || isNaN(d.getTime())) return '';
  
  return d.toLocaleTimeString(lang === 'en' ? 'en-US' : 'pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatBrasiliaDate(dateStr, lang = 'pt') {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.length === 10 && dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-');
    return lang === 'en' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
  }
  const d = parseDate(dateStr);
  if (!d || isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
