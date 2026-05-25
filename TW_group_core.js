/**
 * --------------------------------------------------------------------------
 * demoCompany 共享/ 多店合約自動化系統 - 核心引擎
 * --------------------------------------------------------------------------
 */

// ═══════════════════════════════════════════════════════
// 1. 主引擎：掃描試算表，逐群組處理
// ═══════════════════════════════════════════════════════

function runShareEngine(mode, targetType) {
  const cfg    = GROUP_CONFIG[mode];
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const sheet  = ss.getSheetByName(cfg.sheetName);
  const data   = sheet.getDataRange().getValues();
  const headers = data[1];

  const getIdx = (fieldKey) => {
    const overrides = cfg.fieldOverrides || {};
    const colName = overrides[fieldKey] ?? GROUP_FIELDS[fieldKey];
    return colName ? headers.indexOf(colName) : -1;
  };
  const val = (row, fieldKey) => {
    const idx = getIdx(fieldKey);
    return idx !== -1 ? row[idx] : '';
  };

  const startRowNum = sheet.getRange(1, getIdx('pdfUrl') + 1).getValue() || 3;

  let currentDoc     = null;
  let currentShareId = '';
  let urlRowIndex    = 0;
  let groupMode      = { isDoPDF: false, isDoDoc: false };
  let addonRows      = [];

  for (let i = startRowNum - 1; i < data.length; i++) {
    const row     = data[i];
    const shareId = val(row, 'shareId');
    const resto   = val(row, 'resto');
    const isDoPDF = (targetType === 'PDF') && val(row, 'genPDF') === true && val(row, 'pdfUrl') === '';
    const isDoDoc = (targetType === 'DOC') && val(row, 'genDoc') === true && val(row, 'docUrl') === '';

    // ── 新群組開始 ──
    if (shareId !== '' && (isDoPDF || isDoDoc)) {
      if (currentDoc) {
        // 上一群組尚未結束（保險用）
        finalizeGroup(currentDoc, sheet, urlRowIndex, getIdx, cfg, groupMode, addonRows, val, mode);
        currentDoc = null;
        addonRows  = [];
      }

      // 預掃描：此群組是否有加值服務
      let groupHasAddon = false;
      for (let k = i; k < data.length; k++) {
        if (k > i && val(data[k], 'shareId') !== '' && val(data[k], 'resto') !== '') break;
        if (val(data[k], 'depPlan') || val(data[k], 'survey') ||
            val(data[k], 'voice')   || val(data[k], 'coupon')) {
          groupHasAddon = true;
          break;
        }
      }

      currentShareId = shareId;
      urlRowIndex    = i + 1;
      groupMode      = { isDoPDF, isDoDoc };
      addonRows      = [];

      currentDoc = buildGroupDoc(cfg, row, val, groupHasAddon, isDoDoc, mode);
      appendRestoRow(currentDoc.getBody().getTables()[0], row, val, cfg, true);
      addonRows.push(row);
    }
    // ── 同群組後續店家 ──
    else if (shareId === '' && resto !== '' && currentDoc) {
      appendRestoRow(currentDoc.getBody().getTables()[0], row, val, cfg, false);
      addonRows.push(row);
    }
    else {
      continue;
    }

    // ── 判斷群組是否結束 ──
    const nextRow       = data[i + 1];
    const nextShareId   = nextRow ? val(nextRow, 'shareId') : null;
    const nextResto = nextRow ? val(nextRow, 'resto') : ''; // 抓下一行的餐廳名稱
    const isLastInGroup = !nextRow 
                          || (nextShareId === '' && nextResto === '') // 下一行 ID 與 餐廳名都空了（資料結束）
                          || (nextShareId !== '' && nextShareId !== currentShareId); // 出現新的 Share ID

    if (isLastInGroup && currentDoc) {
      finalizeGroup(currentDoc, sheet, urlRowIndex, getIdx, cfg, groupMode, addonRows, val, mode);
      currentDoc     = null;
      currentShareId = '';
      groupMode      = { isDoPDF: false, isDoDoc: false };
      addonRows      = [];
    }

    // 清除生成勾選
    if (isDoPDF) sheet.getRange(i + 1, getIdx('genPDF') + 1).setValue(false);
    if (isDoDoc) sheet.getRange(i + 1, getIdx('genDoc') + 1).setValue(false);
  }
}

// ═══════════════════════════════════════════════════════
// 2. 文件建立：複製模板，執行所有「第一列已知」的替換
// ═══════════════════════════════════════════════════════

function buildGroupDoc(cfg, row, val, groupHasAddon, isDoDoc, mode) {
  let templateId = cfg.templateId; // 預設用 PDF 模板
  if (isDoDoc && cfg.templateIdForDoc) {
    templateId = cfg.templateIdForDoc; // 如果是產 Doc 且有設定專用模板，則切換
  }
  const newFile = DriveApp.getFileById(templateId).makeCopy();
  const doc     = DocumentApp.openById(newFile.getId());
  const body    = doc.getBody();

  const rowData = {};
  Object.keys(GROUP_FIELDS).forEach(key => { rowData[key] = val(row, key); });

  // 合併共享多店模板
  let typeDesc = '';
  const placeVal = rowData.place || '';
  const shareIdVal = rowData.shareId || '';
  const cycleLabel = cfg.cycleLabel;
  const isMulti = mode.includes('multi');

  if (isMulti) {
    // 【多店】方案
    typeDesc = `${cycleLabel}方案，共 ${placeVal} 間店家`;
  } else {
    // 【共享】方案
    typeDesc = `${cycleLabel}共享方案，下表所列 ${placeVal} 間店家組數共享（Share ID : ${shareIdVal}）`;
  }

  body.replaceText('{{contract_type_desc}}', typeDesc);

  // 基本欄位
  performShareBasicReplacement(body, rowData);
  // 特殊方案
  performShareSpecialPlanReplacement(body, rowData.special);
  // 付款條款
  performSharePaymentReplacement(body, rowData);
  // 加值服務有無（附件二標題 & 主文說明）
  if (groupHasAddon) {
    body.replaceText('{{noaddon}}', 'text...');
    body.replaceText('{{附件二}}',  '附件二、text...');
  } else {
    body.replaceText('{{noaddon}}', '無');
    body.replaceText('{{附件二}}',  '');
  }

  return doc;
}

// ═══════════════════════════════════════════════════════
// 3. 主方案表格：填入每間店家的方案列
// ═══════════════════════════════════════════════════════

function appendRestoRow(table, row, val, cfg, isFirst) {
  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    if (dateVal instanceof Date) return Utilities.formatDate(dateVal, 'GMT+8', 'yyyy-MM-dd');
    return dateVal;
  };

  let tr;
  if (isFirst) {
    tr = table.getRow(1);
    const giftSum = val(row, 'giftSum');
    table.replaceText('{{change}}', (!giftSum || giftSum == 0) ? '繳款週期' : '贈送組數(組)/年');
  } else {
    tr = table.appendTableRow();
    while (tr.getNumCells() < cfg.numCells) tr.appendTableCell('');
  }

  const giftSum     = val(row, 'giftSum');
  const giftDisplay = (!giftSum || giftSum == 0) ? '年繳' : (val(row, 'gift') || '');

  let col = 0;
  tr.getCell(col++).setText(val(row, 'resto'));
  tr.getCell(col++).setText(formatDate(val(row, 'nStart')));
  tr.getCell(col++).setText(formatDate(val(row, 'nEnd')));
  tr.getCell(col++).setText(val(row, cfg.usageKey));
  if (cfg.hasGift) tr.getCell(col++).setText(giftDisplay);
  tr.getCell(col++).setText(val(row, cfg.feeKey));
  tr.getCell(col++).setText(val(row, 'overage'));
}

// ═══════════════════════════════════════════════════════
// 4. 完成群組：加值服務 → 存檔 → ACH合併 → 輸出PDF/Doc → 回填連結
// ═══════════════════════════════════════════════════════

function finalizeGroup(doc, sheet, urlRowIndex, getIdx, cfg, groupMode, addonRows, val, mode) {
  const body = doc.getBody();

  // 加值服務條文 + 附件二表格
  performShareServiceReplacement(body, addonRows, val, cfg);

  // 存檔
  doc.saveAndClose();
  const docId    = doc.getId();

  // 取得檔案物件
  const fileObj = DriveApp.getFileById(docId);
  
  // 一次讀整列，之後從陣列取值
  const urlRow = sheet.getRange(urlRowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  const company    = urlRow[getIdx('company')];
  const achChecked = urlRow[getIdx('ach')];
  const baseName = company + cfg.fileSuffix;

  // d. ACH 合併（如有勾選）
  if (achChecked === true) {
    mergeDocumentAppend(docId, 'TEMPLATE_DOC_ID');
  }

  // e. 輸出 PDF
  if (groupMode.isDoPDF) {
    const pdfBlob = DriveApp.getFileById(docId).getAs('application/pdf');
    const folder  = DriveApp.getFolderById('FOLDER_ID');
    const pdfFile = folder.createFile(pdfBlob).setName(baseName + '.pdf');
    
    sheet.getRange(urlRowIndex, getIdx('pdfUrl') + 1).setValue(pdfFile.getUrl());

    // 判斷是否為自動續約 (nostamp)
    const isNostamp = mode.includes('nostamp');
    
    if (isNostamp) {
      // 模式包含 nostamp：保留 Doc 檔，並填入 ID 供 Email 引擎抓取表格
      sheet.getRange(urlRowIndex, getIdx('doc') + 1).setValue(docId);
    } else {
      // 一般模式：產完 PDF 後，直接刪除暫存的 Doc 檔
      fileObj.setTrashed(true);
    }
    
    sheet.getRange(urlRowIndex, getIdx('genPDF') + 1).setValue(false);
  }

  // f. 輸出 Doc
  if (groupMode.isDoDoc) {
    fileObj.setName(baseName);
    sheet.getRange(urlRowIndex, getIdx('docUrl') + 1).setValue(fileObj.getUrl());
  }
}

// ═══════════════════════════════════════════════════════
// 5. 文字替換：基本欄位
// ═══════════════════════════════════════════════════════

function performShareBasicReplacement(body, d) {
  const now = new Date();
  const replaceMap = {
    '{{name}}':    d.company,
    '{{place}}':   d.place,
    '{{amname}}':  d.amName,
    '{{amphone}}': d.amPhone,
    '{{ammail}}':  d.amMail,
    '{{taxid}}':   d.taxId,
    '{{ShareID}}': d.shareId,
    '{{y3}}':      (now.getFullYear() - 1911).toString(),
    '{{m3}}':      Utilities.formatDate(now, 'GMT+0800', 'MM'),
    '{{d3}}':      Utilities.formatDate(now, 'GMT+0800', 'dd'),
  };
  for (const key in replaceMap) {
    body.replaceText(key, String(replaceMap[key] ?? ''));
  }
}

// ═══════════════════════════════════════════════════════
// 6. 文字替換：特殊方案
// ═══════════════════════════════════════════════════════

function performShareSpecialPlanReplacement(body, special) {
  const plans = {
    'plan1': 'plan1 text...\n',
    'plan2': 'plan2 text...\n',
    'plan3': 'plan3 text...\n',
    'plan4': 'plan4 text...\n',
  };
  body.replaceText('{{special_plan}}', plans[special] || '');
}

// ═══════════════════════════════════════════════════════
// 7. 文字替換：付款條款
// ═══════════════════════════════════════════════════════

function performSharePaymentReplacement(body, d) {
  const achText = `🅅 ACH terms...`;
  const wireText = `🅅 wire terms...`;
  body.replaceText('{{payment}}',      String(d.paymentAnnual ?? ''));
  body.replaceText('{{payment_term}}', d.payTerm === 'ACH' ? achText : wireText);
}

// ═══════════════════════════════════════════════════════
// 8. 文字替換：加值服務條文 + 附件二表格
// ═══════════════════════════════════════════════════════

function performShareServiceReplacement(body, addonRows, val, cfg) {
  const ALL_PLACEHOLDERS = [
    '{{deposit_plan}}','{{survey}}','{{voice}}','{{coupon}}',
    '{{deposit_rule}}','{{deposit_policy}}','{{deposit_policy_B2C}}',
    '{{addonisMonthly}}','{{addon_year_list}}','{{addon_month_list}}','{{addon_list}}',
    '{{addon_anchor}}'
  ];
  const clearAll = () => ALL_PLACEHOLDERS.forEach(tag => {
    try { body.replaceText(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ''); } catch(e) {}
  });

  const groupHasAddon = addonRows.some(row =>
    val(row, 'depPlan') || val(row, 'survey') || val(row, 'voice') || val(row, 'coupon')
  );
  if (!groupHasAddon) { clearAll(); return; }

  const templateMap    = loadTemplateMap();
  const isMonthlyContract = cfg?.cycleLabel === '月繳';

  // period 判斷：月繳合約全部月繳，否則看各自 checkbox
  const getPeriod = (d, type) => {
    if (isMonthlyContract) return '月繳';
    const checkMap = {
      dep:    d.depIsMonthly,
      survey: d.surveyIsMonthly,
      voice:  d.voiceIsMonthly,
      coupon: d.couponIsMonthly,
    };
    const flag = checkMap[type];
    return (flag === true || flag === 'TRUE') ? '月繳' : '年繳';
  };

  // sig：保留 depMonthly，月費不同就是不同方案
  // 金額晚一點在建表格列時才根據 period 計算
  function buildDepSig(d) {
    return [d.depPlan, d.depMonthly, d.depRate, d.depAtmRate, d.depCreate,
            String(d.atmFunc), String(d.preOrder), String(d.experience)].join('|');
  }

  const depGroups    = new Map(); // sig → { text, rows[] }
  const surveyGroups = new Map();
  const voiceGroups  = new Map();
  const couponRows   = [];
  let   couponText   = '';

  // monthly total 計算（for {{addonisMonthly}} 段落）
  let monthlyTotal = 0;

  addonRows.forEach(row => {
    const d = {};
    Object.keys(GROUP_FIELDS).forEach(key => { d[key] = val(row, key); });
    const restoName = d.addonResto || d.resto;
    if (!restoName) return;

    const flags = {
      atmTxt:   d.atmFunc    ? 'atm text...' : '',
      preTxt:   d.preOrder   ? 'preorder text...' : '',
      expTxt:   d.experience ? 'experience text...' : '',
      typeName: d.depPlan === 'plan type'
        ? 'plan text...'
        : (d.depAtmRate ? 'plan trpe' : 'plan text...')
    };

    // ── 訂金 ──
    if (d.depPlan && d.depPlan != '0') {
      const sig    = buildDepSig(d);
      const period = getPeriod(d, 'dep');
      if (!depGroups.has(sig)) {
        let txt = '';
        if (d.depPlan.includes('B2C')) {
          ['B2C_header','B2C_fee','B2C_nofee','B2C_create','B2C_specialbuy','B2C_buy'].forEach(k => {
            const tpl = templateMap[k];
            if (tpl && shouldIncludeB2CPart(k, d)) txt += interpolate(tpl.text, d, flags, templateMap);
          });
          const b2cPolicyTpl = templateMap['{{deposit_policy_B2C}}'];
          if (b2cPolicyTpl) txt += '\n' + b2cPolicyTpl.text;
        } else {
          const key = resolveKey(d.depPlan, d);
          const tpl = templateMap[key];
          if (tpl) txt = interpolate(tpl.text, d, flags, templateMap, key);
        }
        depGroups.set(sig, { text: txt, rows: [] });
      }
      const monthly = Number(d.depMonthly || 0);
      const fee     = period === '月繳' ? monthly : monthly * 12;
      if (period === '月繳') monthlyTotal += monthly;
      depGroups.get(sig).rows.push({
        name: restoName, start: formatDate(d.nStart), end: formatDate(d.nEnd),
        period, fee: `NT$${fee.toLocaleString()}`,
      });
    }

    // ── 問卷 ──
    if (d.survey && d.survey != '0') {
      const sig    = String(d.survey);
      const period = getPeriod(d, 'survey');
      if (!surveyGroups.has(sig)) {
        const tpl = templateMap['survey'];
        surveyGroups.set(sig, { text: tpl ? interpolate(tpl.text, d, flags, templateMap, 'survey') : '', rows: [] });
      }
      const monthly = Number(d.survey || 0);
      const fee     = period === '月繳' ? monthly : monthly * 12;
      if (period === '月繳') monthlyTotal += monthly;
      surveyGroups.get(sig).rows.push({
        name: restoName, start: formatDate(d.nStart), end: formatDate(d.nEnd),
        period, fee: `NT$${fee.toLocaleString()}`,
      });
    }

    // ── 語音 ──
    if (d.voice && d.voice != '0') {
      const sig    = String(d.voice);
      const period = getPeriod(d, 'voice');
      if (!voiceGroups.has(sig)) {
        const tpl = templateMap['voice'];
        voiceGroups.set(sig, { text: tpl ? interpolate(tpl.text, d, flags, templateMap, 'voice') : '', rows: [] });
      }
      const monthly = Number(d.voice || 0);
      const fee     = period === '月繳' ? monthly : monthly * 12;
      if (period === '月繳') monthlyTotal += monthly;
      voiceGroups.get(sig).rows.push({
        name: restoName, start: formatDate(d.nStart), end: formatDate(d.nEnd),
        period, fee: `NT$${fee.toLocaleString()}`,
      });
    }

    // ── 優惠券（固定年繳 3,600） ──
    const cv = d.coupon;
    if (cv === true || cv === 'TRUE' || (cv !== '' && cv != '0')) {
      if (!couponText) {
        const tpl = templateMap['coupon'];
        couponText = tpl ? interpolate(tpl.text, d, flags) : '';
      }
      
      const period = '年繳';
      const fee = 3600;
      
      couponRows.push({
        name: restoName, 
        start: formatDate(d.nStart), 
        end: formatDate(d.nEnd),
        period, 
        fee: `NT$${fee.toLocaleString()}`,
      });
    }
  });

  // ── {{addonisMonthly}} 月繳總額段落 ──
  body.replaceText('{{addonisMonthly}}', monthlyTotal > 0
    ? `\n🅅月繳：乙方應按月支付新台幣 ${monthlyTotal.toLocaleString()} 元。` : '');

  // ── 找錨點，依序插入條文 + 表格 ──
  let anchorPara = null;
  for (let i = 0; i < body.getNumChildren(); i++) {
    const child = body.getChild(i);
    if (child.getType() === DocumentApp.ElementType.PARAGRAPH &&
        child.asText().getText().includes('{{addon_anchor}}')) {
      child.asText().setText('');
      anchorPara = child;
      break;
    }
  }

  if (!anchorPara) { clearAll(); return; }

  const sections = [];
  depGroups.forEach(g    => sections.push({ text: g.text, rows: g.rows }));
  surveyGroups.forEach(g => sections.push({ text: g.text, rows: g.rows }));
  voiceGroups.forEach(g  => sections.push({ text: g.text, rows: g.rows }));
  if (couponRows.length > 0) sections.push({ text: couponText, rows: couponRows });

  sections.forEach(({ text, rows }) => {
    // 插入條文
    const anchorIdx = body.getChildIndex(anchorPara);
    const textPara = body.insertParagraph(anchorIdx + 1, text);
    textPara.setHeading(DocumentApp.ParagraphHeading.NORMAL);
    textPara.setSpacingAfter(6);
    textPara.editAsText().setFontFamily('Spectral').setFontSize(10);

    // 插入表格（5欄）
    const tableData = [
      ['餐廳名稱', '起始日期', '結束日期', '繳費週期', '費用'],
      ...rows.map(r => [r.name, r.start, r.end, r.period, r.fee])
    ];
    const tableIdx = body.getChildIndex(textPara) + 1;
    const table    = body.insertTable(tableIdx, tableData);

    // 表格樣式
    for (let r = 0; r < table.getNumRows(); r++) {
      const tableRow = table.getRow(r);
      for (let c = 0; c < tableRow.getNumCells(); c++) {
        const cell = tableRow.getCell(c);
        cell.setVerticalAlignment(DocumentApp.VerticalAlignment.CENTER);
        const p = cell.getChild(0).asParagraph();
        p.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
        p.setSpacingBefore(0);
        p.setSpacingAfter(0);
        cell.setPaddingTop(2);
        cell.setPaddingBottom(2);

        // 字體與字號
        const text = p.editAsText();
        text.setFontFamily('Spectral');
        text.setFontSize(10);
        text.setBold(false);

        if (r === 0) {
          cell.setBackgroundColor('#fff2cc');
        }
      }
    }

    anchorPara = table;
  });

  clearAll();
}

// ═══════════════════════════════════════════════════════
// 9. 工具函式
// ═══════════════════════════════════════════════════════

function loadTemplateMap() {
  const sheet = SpreadsheetApp.openById('TEMPLATE_DOC_ID').getSheetByName('加值服務條文');
  const data = sheet.getDataRange().getValues();
  const templateMap = {};

  // 從第二行開始掃描 (跳過標題)
  data.slice(1).forEach(row => {
    const key = row[1]; // 第二欄：Key
    if (!key) return;

    templateMap[key] = {
      type: row[0],    // 第一欄：類型
      text: row[2],    // 第三欄：基礎內文
      // 這裡抓取第四、五欄 (Index 3, 4)，並過濾掉空白的
      links: [row[3], row[4]].filter(link => link && link !== '') 
    };
  });
  return templateMap;
}

function buildAddonSignature(d, type) {
  switch (type) {
    case 'dep':
      return [d.depPlan, d.depMonthly, d.depRate, d.depAtmRate,
              d.depCreate, String(d.atmFunc), String(d.preOrder), String(d.experience)].join('|');
    case 'survey':  return String(d.survey);
    case 'voice':   return String(d.voice);
    case 'coupon':  return 'coupon';
  }
}

function resolveKey(depPlan, d) {
  if (depPlan === 'B2B 預付') return d.depMonthly > 0 ? 'B2B 預付（有月費）' : 'B2B 預付';
  if (depPlan === 'B2B 綁卡') return d.depMonthly > 0 ? 'B2B 綁卡（有月費）' : 'B2B 綁卡';
  if (depPlan === '其他（請產Doc檔修改）') return 'othersB2CB';
  return depPlan;
}

function shouldIncludeB2CPart(key, d) {
  if (key === 'B2C_fee')        return d.depMonthly > 0;
  if (key === 'B2C_nofee')      return !d.depMonthly;
  if (key === 'B2C_create')     return d.depCreate > 0;
  if (key === 'B2C_specialbuy') return d.depAtmRate > 0;
  if (key === 'B2C_buy')        return !d.depAtmRate;
  return true;
}

function fillAddonTable(body, tag, restoList, periodText) {
  const rangeElement = body.findText(tag.replace(/[{}]/g, '\\$&'));
  if (!rangeElement) {
    return;
  }
  const cell  = rangeElement.getElement().getParent().getParent();
  const row   = cell.getParent();
  const table = row.getParent();
  
  if (restoList.length === 0) {
  const periodTag = tag === '{{addon_list}}' ? null
                  : tag.includes('month')    ? '{{addonPeriodM}}'
                  :                            '{{addonPeriodY}}';
  if (periodTag) {
    const escapedTag = periodTag.replace(/[{}]/g, '\\$&');
    const titleElement = body.findText(`加值服務方案－${escapedTag}`);
    if (titleElement) {
      titleElement.getElement().getParent().removeFromParent();
    }
  }
  table.removeFromParent();
  return;
}

  // 2. 替換標題中的週期
  const periodTag = tag === '{{addon_list}}'     ? null
                : tag.includes('month')        ? '{{addonPeriodM}}'
                :                                '{{addonPeriodY}}';
  if (periodTag) body.replaceText(periodTag.replace(/[{}]/g, '\\$&'), periodText);

  // 3. 填入資料
  const templateRow = row;

  restoList.forEach((item, idx) => {
    let currentRow;
    if (idx === 0) {
      currentRow = templateRow;
      body.replaceText(tag.replace(/[{}]/g, '\\$&'), ''); // 清除錨點文字
    } else {
      // 插入新列並複製樣式
      currentRow = table.appendTableRow(templateRow.copy());
    }

    // 填入五欄資料：餐廳、起始、結束、功能、費用
    currentRow.getCell(0).setText(item.name || '');
    currentRow.getCell(1).setText(item.start || '');
    currentRow.getCell(2).setText(item.end || '');
    currentRow.getCell(3).setText(item.service || '');
    currentRow.getCell(4).setText(item.fee || '');

    // 統一格式化：垂直居中、靠左、縮減內邊距
    const numCells = currentRow.getNumCells();
    for (let i = 0; i < numCells; i++) {
      const c = currentRow.getCell(i);
      c.setVerticalAlignment(DocumentApp.VerticalAlignment.CENTER);
      const p = c.getChild(0).asParagraph();
      p.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
      p.setSpacingBefore(0);
      p.setSpacingAfter(0);
      c.setPaddingTop(2);
      c.setPaddingBottom(2);
    }
  });
}

function interpolate(template, d, flags, templateMap, currentKey) {
  if (!template) return '';
  
  let result = template
    // 1. 處理帶有計算式的標籤 ${100 - d.depRate} (支援空格與減法)
    .replace(/\$\{100\s*-\s*d\.depRate\}/g, () => {
      const rate = parseFloat(d.depRate) || 0;
      return (100 - rate);
    })
    .replace(/\$\{100\s*-\s*d\.depAtmRate\}/g, () => {
      const rate = parseFloat(d.depAtmRate) || 0;
      return (100 - rate);
    })
    // 2. 處理標準變數 ${d.xxx}
    .replace(/\$\{d\.(\w+)\}/g, (_, k) => (d[k] !== undefined && d[k] !== '') ? d[k] : '')
    // 3. 處理 Flag 標籤 ${flags.xxx} 或 ${xxx}
    .replace(/\$\{flags\.(\w+)\}/g, (_, k) => flags[k] ?? '')
    .replace(/\$\{(\w+)\}/g, (_, k) => flags[k] ?? d[k] ?? '')
    // 4. 處理換行符號
    .replace(/\\n/g, '\n');

  // --- 聯動替換邏輯 ---
  if (templateMap && currentKey && templateMap[currentKey]) {
    const links = templateMap[currentKey].links || [];
    links.forEach(tag => {
      if (templateMap[tag]) {
        result += '\n' + templateMap[tag].text; 
      }
    });
  }

  return result;
}

function mergeDocumentAppend(baseId, sourceId) {
  const baseDoc    = DocumentApp.openById(baseId);
  const sourceBody = DocumentApp.openById(sourceId).getBody();
  const baseBody   = baseDoc.getBody();
  baseBody.appendPageBreak();
  for (let j = 0; j < sourceBody.getNumChildren(); j++) {
    const element = sourceBody.getChild(j).copy();
    const type    = element.getType();
    if      (type === DocumentApp.ElementType.TABLE)     baseBody.appendTable(element.asTable());
    else if (type === DocumentApp.ElementType.PARAGRAPH) baseBody.appendParagraph(element.asParagraph());
    else if (type === DocumentApp.ElementType.LIST_ITEM) baseBody.appendListItem(element.asListItem());
  }
  baseDoc.saveAndClose();
}

function formatDate(dateVal) {
  if (!dateVal) return '';
  if (dateVal instanceof Date) {
    return Utilities.formatDate(dateVal, 'GMT+8', 'yyyy-MM-dd');
  }
  const d = new Date(dateVal);
  if (!isNaN(d.getTime())) {
    return Utilities.formatDate(d, 'GMT+8', 'yyyy-MM-dd');
  }
  return dateVal; // 若都無法處理則回傳原值
}
