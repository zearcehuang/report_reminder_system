function parseOutlookCsvText(text) {
  if (!text) return [];
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  const rows = [];
  let row = [];
  let curr = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        curr += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push(curr.trim());
      curr = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      row.push(curr.trim());
      if (row.some(cell => cell.length > 0)) rows.push(row);
      row = [];
      curr = '';
    } else {
      curr += c;
    }
  }
  if (curr || row.length > 0) {
    row.push(curr.trim());
    if (row.some(cell => cell.length > 0)) rows.push(row);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.replace(/^["'\s]+|["'\s]+$/g, ''));
  const findHeaderIdx = (names) => {
    return headers.findIndex(h => names.some(n => h.toLowerCase() === n.toLowerCase() || h.includes(n)));
  };

  const fnIdx = findHeaderIdx(['名字', 'First Name']);
  const lnIdx = findHeaderIdx(['姓氏', 'Last Name']);
  const titleNameIdx = findHeaderIdx(['稱謂', 'Suffix']);
  const compIdx = findHeaderIdx(['公司', 'Company']);
  const deptIdx = findHeaderIdx(['部門', 'Department']);
  const jobIdx = findHeaderIdx(['職稱', 'Job Title']);
  const email1Idx = findHeaderIdx(['電子郵件地址', 'E-mail Address', 'Email Address']);
  const email2Idx = findHeaderIdx(['電子郵件 2 地址', 'E-mail 2 Address']);
  const email3Idx = findHeaderIdx(['電子郵件 3 地址', 'E-mail 3 Address']);
  const dispNameIdx = findHeaderIdx(['電子郵件顯示名稱', 'E-mail Display Name']);

  const contacts = [];
  const seenEmails = new Set();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const getVal = (idx) => (idx >= 0 && idx < row.length ? row[idx].replace(/^["'\s]+|["'\s]+$/g, '') : '');

    const firstName = getVal(fnIdx);
    const lastName = getVal(lnIdx);
    const titleName = getVal(titleNameIdx);
    const company = getVal(compIdx);
    const dept = getVal(deptIdx);
    const jobTitle = getVal(jobIdx);
    const emailDispName = getVal(dispNameIdx);

    let email = getVal(email1Idx);
    if (!email || !email.includes('@') || email.startsWith('/o=')) {
      email = getVal(email2Idx);
    }
    if (!email || !email.includes('@') || email.startsWith('/o=')) {
      email = getVal(email3Idx);
    }
    if (!email || !email.includes('@') || email.startsWith('/o=')) {
      const lineStr = row.join(' ');
      const match = lineStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) email = match[0];
    }

    if (!email || !email.includes('@') || email.startsWith('/o=')) continue;
    if (seenEmails.has(email.toLowerCase())) continue;
    seenEmails.add(email.toLowerCase());

    let displayName = '';
    if (lastName || firstName) {
      const isEn = /^[A-Za-z0-9\s._-]+$/.test((lastName + firstName).trim());
      if (isEn) {
        displayName = [firstName, lastName].filter(Boolean).join(' ');
      } else {
        displayName = `${lastName}${firstName}`;
      }
      if (titleName && !displayName.includes(titleName)) {
        displayName += ` ${titleName}`;
      }
    } else if (emailDispName && emailDispName !== email && !emailDispName.startsWith('/o=')) {
      displayName = emailDispName;
    } else {
      displayName = email.split('@')[0];
    }

    const department = dept || company || '通用聯絡人';
    const title = jobTitle || '';

    contacts.push({
      id: `c-${Date.now()}-${r}`,
      name: displayName,
      email: email,
      department: department,
      title: title
    });
  }

  return contacts;
}

module.exports = {
  parseOutlookCsvText
};
