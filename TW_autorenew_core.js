// ═══════════════════════════════════════════════════════
// 欄位定義
// ═══════════════════════════════════════════════════════
const EMAIL_FIELDS = {
  autoSend:        '無用印自動寄出',
  status:          '無用印Status',
  pdfUrl:          '無用印pdf\n(自動續約用)',
  emailTo:         '無用印寄送Email',
  version:         '無用印寄送版本',
  docId:           'docId',
  company:         '公司名稱',
  resto:           '餐廳名稱',
  oStart:          '原合約起始年',
  oEnd:            '原合約結束日',
  nStart:          '新合約起始',
  nEnd:            '新合約結束',
  taxId:           'taxid',
  place:           '使用店家數',
  payTerm:         '繳款方式',
  bank:            '匯款銀行',
  acc:             '匯款帳號',
  payment:         '年繳總繳款金額\n(自行填寫)',
  amName:          'amname',
  amTitle:         'Title',
  amPhone:         'amphone',
  amMail:          'ammail',
  rsv:             '使用組數',
  fee:             '系統使用費',
  gift:            '贈送組數\n(若無請留白)',
  overage:         '超額費',
  special:         '特殊方案',
  ach:             'ACH 合約書\n(勾選會附件ACH)',
  depPlan:         '訂金方案\n必填',
  depMonthly:      '訂金\n月租費',
  depRate:         '(新)訂金\n抽成費\n*不用填%',
  depAtmRate:      '(新)虛擬帳號訂金\n抽成費\n*不用填%',
  depCreate:       '(新)訂金\n建立費',
  survey:          '問卷\n月租費',
  voice:           '語音\n月租費',
  coupon:          '優惠券',
  atmFunc:         'ATM 功能',
  preOrder:        'Pre-order',
  experience:      'Experience',
  depIsMonthly:    '訂金月繳',
  surveyIsMonthly: '問卷月繳',
  voiceIsMonthly:  '語音月繳',
  couponIsMonthly: '優惠券月繳',
};

const EMAIL_GROUP_FIELDS = {
  autoSend:        '無用印自動寄出',
  status:          '無用印Status',
  pdfUrl:          '無用印pdf\n(自動續約用)',
  emailTo:         '無用印寄送Email',
  version:         '無用印寄送版本',
  docId:           'docId',
  shareId:         'Share ID\n（*必填，一個共享填一次）',
  company:         '公司名稱',
  resto:           '餐廳名稱',
  oStart:          '原合約起始年',
  oEnd:            '原合約結束日',
  nStart:          '新合約起始',
  nEnd:            '新合約結束',
  taxId:           'taxid',
  place:           '共享店家數',
  payTerm:         '繳款方式',
  bank:            '匯款銀行',
  acc:             '匯款帳號',
  paymentAnnual:   '年繳總繳款金額\n(自行填寫)',
  amName:          'amname',
  amTitle:         'Title',
  amPhone:         'amphone',
  amMail:          'ammail',
  usageAnnual:     '使用組數/年',
  usageMonthly:    '使用組數/月',
  feeAnnual:       '系統使用費/年',
  feeMonthly:      '系統使用費/月',
  gift:            '贈送組數\n(若無請留白)',
  giftSum:         '總贈送(勿刪)',
  overage:         '超額費',
  special:         '特殊方案',
  ach:             'ACH 合約書\n(勾選會附件ACH)',
  depPlan:         '訂金方案\n//必填',
  depMonthly:      '訂金\n(月租費)',
  depRate:         '訂金\n抽成費\n(*不用填%)',
  depAtmRate:      '虛擬帳號訂金\n抽成費\n(*不用填%)',
  depCreate:       '訂金\n建立費',
  survey:          '問卷\n(月租費)',
  voice:           '語音\n(月租費)',
  coupon:          '優惠券',
  atmFunc:         '訂金\nATM 功能',
  preOrder:        '訂金\nPre-order',
  experience:      '訂金\nExperience',
  depIsMonthly:    '訂金月繳',
  surveyIsMonthly: '問卷月繳',
  voiceIsMonthly:  '語音月繳',
  couponIsMonthly: '優惠券月繳',
  // 附件一欄位
  nStart:          '新合約起始',
  nEnd:            '新合約結束',
  usageAnnual:     '使用組數/年',
  usageMonthly:    '使用組數/月',
  feeAnnual:       '系統使用費/年',
  feeMonthly:      '系統使用費/月',
};

// ═══════════════════════════════════════════════════════
// 引擎設定
// ═══════════════════════════════════════════════════════
const EMAIL_CONFIG = {
  annual: {
    sheetName:  '年繳',
    template1:  'html email body1',
    template2:  'html email body2',
    term:       '年',
    paymentFn:  (d) => d.payment ? '乙方需依甲方之指示完成付款新台幣 ' + d.payment + ' 元。' : '',
    hasGift:    true,
    isShare:    false,
    isMonthly:  false,
  },
  monthly: {
    sheetName:  '月繳',
    template1:  'html email body1',
    template2:  'html email body2',
    term:       '月',
    paymentFn:  (d) => '',
    hasGift:    false,
    isShare:    false,
    isMonthly:  true,
  },
};

const EMAIL_GROUP_CONFIG = {
  annual: {
    sheetName:  '年繳共享',
    template1:  'Share plan html email body1',
    template2:  'Share plan html email body2',
    term:       '年',
    usageKey:   'usageAnnual',
    feeKey:     'feeAnnual',
    paymentFn:  (d) => d.paymentAnnual ? '乙方需依甲方之指示完成付款新台幣 ' + d.paymentAnnual + ' 元。' : '',
    hasGift:    true,
    isShare:    true,
    isMonthly:  false,
    fieldOverrides: {},
  },
  monthly: {
    sheetName:  '月繳共享',
    template1:  'Share plan html email body1',
    template2:  'Share plan html email body2',
    term:       '月',
    usageKey:   'usageMonthly',
    feeKey:     'feeMonthly',
    paymentFn:  (d) => '',
    hasGift:    false,
    isShare:    true,
    isMonthly:  true,
    fieldOverrides: {},
  },
  annualMulti: {
    sheetName:  '年繳多店',
    template1:  'Share plan html email body1',
    template2:  'Share plan html email body2',
    term:       '年',
    usageKey:   'usageAnnual',
    feeKey:     'feeAnnual',
    paymentFn:  (d) => d.paymentAnnual ? '乙方需依甲方之指示完成付款新台幣 ' + d.paymentAnnual + ' 元。' : '',
    hasGift:    true,
    isShare:    false,
    isMonthly:  false,
    fieldOverrides: {
      shareId: 'Company Name\n（*必填，一份合約填一次）',
      place:   '店家數',
    },
  },
  monthlyMulti: {
    sheetName:  '月繳多店',
    template1:  'Share plan html email body1',
    template2:  'Share plan html email body2',
    term:       '月',
    usageKey:   'usageMonthly',
    feeKey:     'feeMonthly',
    paymentFn:  (d) => '',
    hasGift:    false,
    isShare:    false,
    isMonthly:  true,
    fieldOverrides: {
      shareId: 'Company Name\n（*必填，一份合約填一次）',
      place:   '店家數',
    },
  },
};

// ═══════════════════════════════════════════════════════
// 主引擎：單店
// ═══════════════════════════════════════════════════════
function runSingleEmailEngine(mode) {
  const cfg     = EMAIL_CONFIG[mode];
  const sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(cfg.sheetName);
  const data    = sheet.getDataRange().getValues();
  const headers = data[1];
  const getIdx  = (f) => {
    const col = (cfg.fieldOverrides || {})[f] ?? EMAIL_FIELDS[f];
    return col ? headers.indexOf(col) : -1;
  };
  const docIdIdx = headers.indexOf('docId');
  const startRow = sheet.getRange(1, getIdx('status') + 1).getValue() || 3;

  for (let i = startRow - 1; i < data.length; i++) {
    const row = data[i];
    if (row[getIdx('autoSend')] !== true) continue;
    if (row[getIdx('status')]) continue;
    const pdfID = _getPDFIdFromUrl(row[getIdx('pdfUrl')]);
    if (!pdfID) continue;

    const rowData = _buildRowData(row, getIdx, EMAIL_FIELDS);
    if (docIdIdx !== -1) rowData.docId = row[docIdIdx];

    const contract    = _buildContract(rowData, cfg);
    const specialPlan = { text: _buildSpecialPlanText(rowData.special) };
    const paymentTerm = { text: _buildPaymentTermText(rowData) };
    const addon       = _buildSingleAddon(rowData, cfg);
    const addonTable  = (!cfg.isMonthly && rowData.docId && addon.hasMonthlyItem)
      ? _buildSingleDocTable(rowData.docId)
      : '';

    _sendEmail({
      cfg, sheet, rowNum: i + 1, getIdx, pdfID, rowData,
      templateData: { contract, specialPlan, paymentTerm, addon, addonTable },
    });
  }
}

// ═══════════════════════════════════════════════════════
// 主引擎：多店 / 共享
// ═══════════════════════════════════════════════════════
function runGroupEmailEngine(mode) {
  const cfg     = EMAIL_GROUP_CONFIG[mode];
  const sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(cfg.sheetName);
  const data    = sheet.getDataRange().getValues();
  const headers = data[1];
  const getIdx  = (f) => {
    const col = (cfg.fieldOverrides || {})[f] ?? EMAIL_GROUP_FIELDS[f];
    return col ? headers.indexOf(col) : -1;
  };
  const val      = (row, f) => { const i = getIdx(f); return i !== -1 ? row[i] : ''; };
  const startRow = sheet.getRange(1, getIdx('status') + 1).getValue() || 3;

  let currentShareId = '';
  let urlRowIndex    = 0;
  let firstRow       = null;
  let groupRows      = [];

  for (let i = startRow - 1; i < data.length; i++) {
    const row      = data[i];
    const shareId  = val(row, 'shareId');
    const resto    = val(row, 'resto');
    const autoSend = val(row, 'autoSend') === true || val(row, 'autoSend') === 'TRUE';
    const status   = val(row, 'status');

    if (shareId !== '' && autoSend && !status) {
      if (firstRow) _processGroupEmail(cfg, sheet, firstRow, groupRows, urlRowIndex, getIdx, val);
      currentShareId = shareId;
      urlRowIndex    = i + 1;
      firstRow       = row;
      groupRows      = [row];
    } else if (shareId === '' && resto !== '' && firstRow) {
      groupRows.push(row);
    } else {
      continue;
    }

    const nextRow     = data[i + 1];
    const nextShareId = nextRow ? val(nextRow, 'shareId') : null;
    const nextResto   = nextRow ? val(nextRow, 'resto')   : '';
    const isLast = !nextRow
      || (nextShareId === '' && nextResto === '')
      || (nextShareId !== '' && nextShareId !== currentShareId);

    if (isLast && firstRow) {
      _processGroupEmail(cfg, sheet, firstRow, groupRows, urlRowIndex, getIdx, val);
      currentShareId = '';
      firstRow       = null;
      groupRows      = [];
    }
  }
}

function _processGroupEmail(cfg, sheet, firstRow, groupRows, urlRowIndex, getIdx, val) {
  if (val(firstRow, 'status')) return;
  const pdfID = _getPDFIdFromUrl(val(firstRow, 'pdfUrl'));
  if (!pdfID) return;

  const allRowData = groupRows.map(row => _buildRowData(row, getIdx, EMAIL_GROUP_FIELDS));
  const rowData    = allRowData[0];

  const contract    = _buildContract(rowData, cfg);
  const specialPlan = { text: _buildSpecialPlanText(rowData.special) };
  const paymentTerm = { text: _buildPaymentTermText(rowData) };

  // 附件一：直接從 sheet 資料生成
  const restoTable = _buildGroupRestoTable(allRowData, cfg);

  // 加值服務：條文 + 各自的表格一起打包
  const addon = _buildGroupAddon(allRowData, cfg);

  _sendEmail({
    cfg, sheet, rowNum: urlRowIndex, getIdx, pdfID, rowData,
    templateData: { contract, specialPlan, paymentTerm, addon, restoTable },
  });
}

// ═══════════════════════════════════════════════════════
// 共用組裝
// ═══════════════════════════════════════════════════════
function _buildRowData(row, getIdx, fieldsDef) {
  const d = {};
  Object.keys(fieldsDef).forEach(key => {
    const i = getIdx(key);
    d[key] = i !== -1 ? row[i] : '';
  });
  return d;
}

function _buildContract(d, cfg) {
  const fmt = (date) => date ? Utilities.formatDate(new Date(date), 'GMT+0800', 'yyyy-MM-dd') : '';
  return {
    name:       d.company,
    resto:      d.resto,
    oEndDate:   fmt(d.oEnd),
    nStartDate: fmt(d.nStart),
    nEndDate:   fmt(d.nEnd),
    oStartYear: d.oStart,
    term:       cfg.term,
    usage:      d.rsv || d[cfg.usageKey],
    fee:        d.fee || d[cfg.feeKey],
    overage:    d.overage,
    payment:    cfg.paymentFn ? cfg.paymentFn(d) : '',
    amName:     d.amName,
    amTitle:    d.amTitle,
    amPhone:    d.amPhone,
    amMail:     d.amMail,
    taxId:      d.taxId,
    place:      d.place,
    gift:       cfg.hasGift ? (d.gift || '') : '',
    ...(cfg.isShare ? {
      shareId:   d.shareId,
      sharePlan: '共享',
      shareNote: '組數共享（Share ID :' + d.shareId + '）',
    } : {}),
  };
}

function _sendEmail({ cfg, sheet, rowNum, getIdx, pdfID, rowData, templateData }) {
  const templFile = rowData.version === '第一次寄送' ? cfg.template1 : cfg.template2;
  const templ     = HtmlService.createTemplateFromFile(templFile);
  Object.keys(templateData).forEach(key => { templ[key] = templateData[key]; });
  const message = templ.evaluate().getContent();
  const file    = DriveApp.getFileById(pdfID);
  const subject = 'demoCompany｜' + (cfg.isShare ? rowData.company : rowData.resto) + '  訂候位系統續約通知書 - 2026';

  MailApp.sendEmail({
    to:          rowData.emailTo,
    replyTo:     rowData.amMail + ',demoCompany-csm-team@demoCompany.tw',
    subject,
    htmlBody:    message,
    attachments: [file],
    name:        'demoCompany客戶經營團隊',
  });
  const now = new Date();
  sheet.getRange(rowNum, getIdx('status')   + 1).setValue(now);
  sheet.getRange(rowNum, getIdx('autoSend') + 1).setValue(false);
}

// ═══════════════════════════════════════════════════════
// 附件一：多店餐廳列表（直接從 sheet 生成）
// ═══════════════════════════════════════════════════════
function _buildGroupRestoTable(allRowData, cfg) {
  const fmt     = (date) => date ? Utilities.formatDate(new Date(date), 'GMT+0800', 'yyyy-MM-dd') : '';
  const usageKey = cfg.usageKey || 'usageAnnual';
  const feeKey   = cfg.feeKey   || 'feeAnnual';
  const hasGift  = cfg.hasGift;

  const headers = hasGift
    ? ['餐廳名稱', '合約起始日', '合約結束日', `購買組數(組)/${cfg.term}`, `贈送組數(組)/年`, `系統費 (元)/${cfg.term}`, '超額每組單價(元)']
    : ['餐廳名稱', '合約起始日', '合約結束日', `購買組數(組)/${cfg.term}`, `系統費 (元)/${cfg.term}`, '超額每組單價(元)'];

  let h = `<table border="1" style="border-collapse:collapse;width:100%;margin:10px 0 20px 0;font-family:Arial,sans-serif;font-size:12px;">`;
  h += '<tr>' + headers.map(col =>
    `<th style="padding:6px;border:1px solid #333;text-align:left;font-weight:bold;">${col}</th>`
  ).join('') + '</tr>';

  allRowData.forEach(d => {
    const usage = d[usageKey] || '';
    const fee   = d[feeKey]   || '';
    const cells = hasGift
      ? [d.resto, fmt(d.nStart), fmt(d.nEnd), usage, d.gift || '', fee, d.overage || '']
      : [d.resto, fmt(d.nStart), fmt(d.nEnd), usage, fee, d.overage || ''];
    h += '<tr>' + cells.map(c =>
      `<td style="padding:6px;border:1px solid #333;text-align:left;">${c}</td>`
    ).join('') + '</tr>';
  });

  return h + '</table>';
}

// ═══════════════════════════════════════════════════════
// 加值服務：單店
// ═══════════════════════════════════════════════════════
function _buildSingleAddon(d, cfg) {
  const empty = {
    hasAny: false, hasMonthlyItem: false, monthlyTotal: 0,
    depositText: '', surveyText: '', voiceText: '', couponText: '',
    refundRule: '', cardPolicy: '', b2cNotice: '',
  };
  if (!d.depPlan && !d.survey && !d.voice && !d.coupon) return empty;

  const templateMap = loadTemplateMap();
  const isChecked   = (v) => v === true || String(v).toUpperCase() === 'TRUE';
  const flags       = _buildFlags(d);

  let depositText = '';
  if (d.depPlan) {
    if (d.depPlan.includes('B2C')) {
      ['B2C_header','B2C_fee','B2C_nofee','B2C_create','B2C_specialbuy','B2C_buy'].forEach(k => {
        const tpl = templateMap[k];
        if (tpl && shouldIncludeB2CPart(k, d)) depositText += interpolate(tpl.text, d, flags);
      });
    } else {
      const tpl = templateMap[resolveKey(d.depPlan, d)];
      if (tpl) depositText = interpolate(tpl.text, d, flags);
    }
  }

  const surveyText = (d.survey && templateMap['survey']) ? interpolate(templateMap['survey'].text, d, flags) : '';
  const voiceText  = (d.voice  && templateMap['voice'])  ? interpolate(templateMap['voice'].text,  d, flags) : '';
  const couponText = (d.coupon && templateMap['coupon']) ? interpolate(templateMap['coupon'].text, d, flags) : '';

  let monthlyTotal = 0;
  if (d.depPlan && (isChecked(d.depIsMonthly) || Number(d.depMonthly) > 0)) monthlyTotal += Number(d.depMonthly || 0);
  if (d.voice   && isChecked(d.voiceIsMonthly))  monthlyTotal += Number(d.voice  || 0);
  if (d.survey  && isChecked(d.surveyIsMonthly)) monthlyTotal += Number(d.survey || 0);

  const hasMonthlyItem = cfg.isMonthly ? false : monthlyTotal > 0;
  const { refundRule, cardPolicy, b2cNotice } = _buildPolicyText(d.depPlan);

  return {
    hasAny: true, hasMonthlyItem, monthlyTotal,
    depositText, surveyText, voiceText, couponText,
    refundRule, cardPolicy, b2cNotice,
  };
}

// ═══════════════════════════════════════════════════════
// 加值服務：多店（條文 + 表格一起打包，每個 group 各自成段）
// ═══════════════════════════════════════════════════════
function _buildGroupAddon(allRowData, cfg) {
  const empty = {
    hasAny: false, monthlyTotal: 0,
    sectionsHtml: '',
    refundRule: '', cardPolicy: '', b2cNotice: '',
  };
  const hasAny = allRowData.some(d => d.depPlan || d.survey || d.voice || d.coupon);
  if (!hasAny) return empty;

  const templateMap = loadTemplateMap();
  const isChecked   = (v) => v === true || String(v).toUpperCase() === 'TRUE';
  const fmt         = (date) => date ? Utilities.formatDate(new Date(date), 'GMT+0800', 'yyyy-MM-dd') : '';

  // 生成加值服務表格 HTML
  function makeAddonTable(rows) {
    if (rows.length === 0) return '';
    let h = `<table border="1" style="border-collapse:collapse;width:100%;margin:8px 0 20px 0;font-family:Arial,sans-serif;font-size:12px;">`;
    h += `<tr>
      <th style="padding:6px;border:1px solid #333;font-weight:bold;">餐廳名稱</th>
      <th style="padding:6px;border:1px solid #333;font-weight:bold;">起始日期</th>
      <th style="padding:6px;border:1px solid #333;font-weight:bold;">結束日期</th>
      <th style="padding:6px;border:1px solid #333;font-weight:bold;">繳費週期</th>
      <th style="padding:6px;border:1px solid #333;font-weight:bold;">費用</th>
    </tr>`;
    rows.forEach(r => {
      h += `<tr>
        <td style="padding:6px;border:1px solid #333;">${r.name}</td>
        <td style="padding:6px;border:1px solid #333;">${r.start}</td>
        <td style="padding:6px;border:1px solid #333;">${r.end}</td>
        <td style="padding:6px;border:1px solid #333;">${r.period}</td>
        <td style="padding:6px;border:1px solid #333;">${r.fee}</td>
      </tr>`;
    });
    return h + '</table>';
  }

  function groupByWithTable(keyFn, textFn, rowFn) {
    const map = new Map();
    allRowData.forEach(d => {
      const key = keyFn(d);
      if (!key) return;
      if (!map.has(key)) map.set(key, { text: textFn(d), tableRows: [] });
      const tr = rowFn(d);
      if (tr) map.get(key).tableRows.push(tr);
    });
    return [...map.values()];
  }

  // ── 訂金 ──
  const depGroups = groupByWithTable(
    (d) => d.depPlan ? [d.depPlan, d.depMonthly, d.depRate, d.depAtmRate, d.depCreate].join('|') : null,
    (d) => {
      const flags = _buildFlags(d);
      let text = '';
      if (d.depPlan.includes('B2C')) {
        ['B2C_header','B2C_fee','B2C_nofee','B2C_create','B2C_specialbuy','B2C_buy'].forEach(k => {
          const tpl = templateMap[k];
          if (tpl && shouldIncludeB2CPart(k, d)) text += interpolate(tpl.text, d, flags);
        });
      } else {
        const tpl = templateMap[resolveKey(d.depPlan, d)];
        if (tpl) text = interpolate(tpl.text, d, flags);
      }
      return text;
    },
    (d) => {
      if (!d.depPlan) return null;
      const isMonthly = cfg.isMonthly || isChecked(d.depIsMonthly);
      const monthly   = Number(d.depMonthly || 0);
      return {
        name:   d.resto,
        start:  fmt(d.nStart),
        end:    fmt(d.nEnd),
        period: isMonthly ? '月繳' : '年繳',
        fee:    `NT$${(isMonthly ? monthly : monthly * 12).toLocaleString()}`,
      };
    }
  );

  // ── 問卷 ──
  const surveyGroups = groupByWithTable(
    (d) => (d.survey && d.survey != '0') ? String(d.survey) : null,
    (d) => {
      const tpl = templateMap['survey'];
      return tpl ? interpolate(templateMap['survey'].text, d, _buildFlags(d)) : '';
    },
    (d) => {
      if (!d.survey || d.survey == '0') return null;
      const isMonthly = cfg.isMonthly || isChecked(d.surveyIsMonthly);
      const monthly   = Number(d.survey || 0);
      return {
        name:   d.resto,
        start:  fmt(d.nStart),
        end:    fmt(d.nEnd),
        period: isMonthly ? '月繳' : '年繳',
        fee:    `NT$${(isMonthly ? monthly : monthly * 12).toLocaleString()}`,
      };
    }
  );

  // ── 語音 ──
  const voiceGroups = groupByWithTable(
    (d) => (d.voice && d.voice != '0') ? String(d.voice) : null,
    (d) => {
      const tpl = templateMap['voice'];
      return tpl ? interpolate(templateMap['voice'].text, d, _buildFlags(d)) : '';
    },
    (d) => {
      if (!d.voice || d.voice == '0') return null;
      const isMonthly = cfg.isMonthly || isChecked(d.voiceIsMonthly);
      const monthly   = Number(d.voice || 0);
      return {
        name:   d.resto,
        start:  fmt(d.nStart),
        end:    fmt(d.nEnd),
        period: isMonthly ? '月繳' : '年繳',
        fee:    `NT$${(isMonthly ? monthly : monthly * 12).toLocaleString()}`,
      };
    }
  );

  // ── 優惠券 ──
  const couponTableRows = [];
  let couponText = '';
  allRowData.forEach(d => {
    const cv = d.coupon;
    if (!(cv === true || cv === 'TRUE' || (cv !== '' && cv != '0'))) return;
    if (!couponText) {
      const tpl = templateMap['coupon'];
      couponText = tpl ? interpolate(tpl.text, d, _buildFlags(d)) : '';
    }
    const isMonthly = isChecked(d.couponIsMonthly);
    couponTableRows.push({
      name:   d.resto,
      start:  fmt(d.nStart),
      end:    fmt(d.nEnd),
      period: isMonthly ? '月繳' : '年繳',
      fee:    `NT$${isMonthly ? '300' : '3,600'}`,
    });
  });

  let hasB2C = false, hasNonB2C = false, hasB2BTransfer = false;
  allRowData.forEach(d => {
    if (!d.depPlan) return;
    if (d.depPlan.includes('B2C')) { hasB2C = true; }
    else { hasNonB2C = true; if (d.depPlan === 'B2B 轉帳') hasB2BTransfer = true; }
  });
  
  const REFUND_RULE = 'rule...<br>';
  const CARD_POLICY = 'policy...';
  const B2C_NOTICE  = '&nbsp;&nbsp;notice...<br>';
  
  let refundRule = '', cardPolicy = '', b2cNotice = '';
  if (hasB2C) b2cNotice = B2C_NOTICE;
  if (hasNonB2C && !hasB2BTransfer) { refundRule = REFUND_RULE; cardPolicy = CARD_POLICY; }
  else if (hasB2BTransfer) refundRule = REFUND_RULE;
  // ═══════════════════════════════════════════════════════

  // 組合 sectionsHtml
  let sectionsHtml = '';

  // 1. 訂金區塊（條文 + 表格 + Policy）
  if (depGroups.length > 0) {
    sectionsHtml += '<div style="margin-bottom: 15px;">';
    depGroups.forEach(g => {
      sectionsHtml += `<div style="margin-bottom: 8px;">${g.text}</div>`;
      sectionsHtml += makeAddonTable(g.tableRows);
    });
    
    // Policy 緊跟在訂金表格下方，維持緊湊
    if (b2cNotice)  sectionsHtml += `<div style="margin-top: 8px; margin-bottom: 4px;">${b2cNotice}</div>`;
    if (cardPolicy) sectionsHtml += `<div style="margin-top: 8px; margin-bottom: 4px;">${cardPolicy}</div>`;
    if (refundRule) sectionsHtml += `<div style="margin-top: 8px; margin-bottom: 4px;">${refundRule}</div>`;
    sectionsHtml += '</div>';
  }

  // 2. 滿意度問卷區塊（獨立一整段，推開上邊距）
  if (surveyGroups.length > 0) {
    surveyGroups.forEach(g => {
      sectionsHtml += `<div style="margin-top: 20px; margin-bottom: 8px;">${g.text}</div>`;
      sectionsHtml += makeAddonTable(g.tableRows);
    });
  }

  // 3. 語音小幫手區塊（獨立一整段，推開上邊距）
  if (voiceGroups.length > 0) {
    voiceGroups.forEach(g => {
      sectionsHtml += `<div style="margin-top: 20px; margin-bottom: 8px;">${g.text}</div>`;
      sectionsHtml += makeAddonTable(g.tableRows);
    });
  }

  // 4. 優惠券區塊（獨立一整段，推開上邊距，絕對不再跟語音擠在同一行！）
  if (couponText) {
    sectionsHtml += `<div style="margin-top: 20px; margin-bottom: 8px;">${couponText}</div>`;
    sectionsHtml += makeAddonTable(couponTableRows);
  }

  // ── 月繳加總 ──
  let monthlyTotal = 0;
  allRowData.forEach(d => {
    if (d.depPlan && (cfg.isMonthly || isChecked(d.depIsMonthly))) monthlyTotal += Number(d.depMonthly || 0);
    if (d.voice   && (cfg.isMonthly || isChecked(d.voiceIsMonthly)))  monthlyTotal += Number(d.voice  || 0);
    if (d.survey  && (cfg.isMonthly || isChecked(d.surveyIsMonthly))) monthlyTotal += Number(d.survey || 0);
    const cv = d.coupon;
    if ((cv === true || cv === 'TRUE' || (cv !== '' && cv != '0')) && isChecked(d.couponIsMonthly)) monthlyTotal += 300;
  });

  return {
    hasAny: true, monthlyTotal, sectionsHtml,
  };
}

// ═══════════════════════════════════════════════════════
// Doc 表格抓取（僅單店使用）
// ═══════════════════════════════════════════════════════
function _buildSingleDocTable(docId) {
  try {
    const body = DocumentApp.openById(docId).getBody();
    let tableCount = 0;
    for (let i = 0; i < body.getNumChildren(); i++) {
      const child = body.getChild(i);
      if (child.getType() === DocumentApp.ElementType.TABLE) {
        tableCount++;
        if (tableCount === 2) return _tableToHtml(child.asTable());
      }
    }
  } catch(e) {
    Logger.log('單店 Doc 表格抓取失敗：' + e.toString());
  }
  return '';
}

// ═══════════════════════════════════════════════════════
// 輔助函式
// ═══════════════════════════════════════════════════════
function _buildFlags(d) {
  return {
    atmTxt:   d.atmFunc    ? 'atm text...' : '',
    preTxt:   d.preOrder   ? 'preorder text...' : '',
    expTxt:   d.experience ? 'experience text...' : '',
    typeName: d.depPlan === 'plan type'
      ? 'plan text...'
      : (d.depAtmRate ? 'plan trpe' : 'plan text...')
  };
}

function _buildPolicyText(depPlan) {
  const REFUND_RULE = 'rule...';
  const CARD_POLICY = 'policy...';
  const B2C_NOTICE  = '&nbsp;&nbsp;notice...';
  if (!depPlan) return { refundRule: '', cardPolicy: '', b2cNotice: '' };
  if (depPlan === 'plan type 1' || depPlan === 'plan type 1') return { refundRule: '', cardPolicy: '', b2cNotice: B2C_NOTICE };
  if (depPlan === 'plan type 2')                           return { refundRule: REFUND_RULE, cardPolicy: '', b2cNotice: '' };
  if (depPlan === 'plan type 3' || depPlan === 'plan type 3') return { refundRule: REFUND_RULE, cardPolicy: CARD_POLICY, b2cNotice: '' };
  return { refundRule: '', cardPolicy: '', b2cNotice: '' };
}

function _buildSpecialPlanText(special) {
  const plans = {
    'plan 1':   '●&nbsp;&nbsp;plan 1 text...',
    'plan 2':   '●&nbsp;&nbsp;plan 2 text...',
    'plan 3':   '●&nbsp;&nbsp;plan 3 text...',
    'plan 4':   '●&nbsp;&nbsp;plan 4 text...',
  };
  return plans[special] || '';
}

function _buildPaymentTermText(d) {
  const base = d.payTerm === 'ACH'
    ? `ACH terms...` : `wire terms...`;
  return base + `<br>甲方帳號：${d.acc}；銀行別：${d.bank}；戶名：demoCompany。`;
}

function _tableToHtml(tableObj) {
  if (!tableObj) return '';
  let h = `<table border="1" style="border-collapse:collapse;width:100%;margin:10px 0 20px 0;font-family:Arial,sans-serif;font-size:12px;">`;
  for (let r = 0; r < tableObj.getNumRows(); r++) {
    h += '<tr>';
    const row = tableObj.getRow(r);
    for (let c = 0; c < row.getNumCells(); c++) {
      h += `<td style="padding:6px;border:1px solid #333;text-align:left;">${row.getCell(c).getText()}</td>`;
    }
    h += '</tr>';
  }
  return h + '</table>';
}

function _getPDFIdFromUrl(url) {
  const match = /\/d\/([a-zA-Z0-9_-]+)/.exec(url);
  return match ? match[1] : null;
}

// ═══════════════════════════════════════════════════════
// 觸發入口
// ═══════════════════════════════════════════════════════
function triggerAutoEmailAnnual()       { runSingleEmailEngine('annual');       }
function triggerAutoEmailMonthly()      { runSingleEmailEngine('monthly');      }
function triggerAutoEmailAnnualShare()  { runGroupEmailEngine('annual');        }
function triggerAutoEmailMonthlyShare() { runGroupEmailEngine('monthly');       }
function triggerAutoEmailAnnualMulti()  { runGroupEmailEngine('annualMulti');   }
function triggerAutoEmailMonthlyMulti() { runGroupEmailEngine('monthlyMulti');  }
