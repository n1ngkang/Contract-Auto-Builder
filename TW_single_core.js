/**
 * --------------------------------------------------------------------------
 * demoCompany 合約自動化系統 - 核心引擎
 * --------------------------------------------------------------------------
 */

function runContractEngine(mode, targetType) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const currentConfig = CONFIG[mode];
  const sheet = ss.getSheetByName(currentConfig.sheetName);
  
  // 一次性讀取整張表資料 (效能優化)
  const data = sheet.getDataRange().getValues();
  const headers = data[1]; // 標題在第二列

  // 取得欄位索引工具
  const getColIdx = (fieldKey) => {
    const overrides = currentConfig.fieldOverrides || {};
    const colName = overrides[fieldKey] ?? FIELDS[fieldKey];
    return colName ? headers.indexOf(colName) : -1;
  };

  // ── 新增判斷：目前是否為無用印自動續約模式 (nostamp) ──
  const isNostamp = mode.includes('nostamp');

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    
    // 判斷是否需要處理
    const isDoPDF = (targetType === 'PDF') && row[getColIdx('genPDF')] === true && row[getColIdx('pdfUrlCol')] === "";
    const isDoDoc = (targetType === 'DOC') && row[getColIdx('genDoc')] === true && row[getColIdx('docUrlCol')] === "";

    if (isDoPDF || isDoDoc) {
      Logger.log(`處理 (${currentConfig.sheetName}): ${row[getColIdx('resto')]} ${targetType}`);

      let templateId = currentConfig.templateId; // 預設用 PDF 模板
      if (isDoDoc && currentConfig.templateIdForDoc) {
        templateId = currentConfig.templateIdForDoc; // 如果是產 Doc 且有設定專用模板，則切換
      }

      // 1. 複製對應的模板
      const newFile = DriveApp.getFileById(templateId).makeCopy();
      const doc = DocumentApp.openById(newFile.getId());
      const body = doc.getBody();

      // 2. 準備取代資料
      const rowData = {};
      Object.keys(FIELDS).forEach(key => {
        const colIdx = getColIdx(key);
        // 如果 colIdx 是 -1，代表這張表沒這欄位，直接給空字串
        rowData[key] = (colIdx !== -1) ? row[colIdx] : "";
      });

      // 3. 執行基本取代與日期處理
      performBasicReplacement(body, rowData);

      // 4. 執行特殊方案取代
      performSpecialPlanReplacement(body, rowData.special);

      // 5. 執行加值服務取代
      performServiceReplacement(body, rowData);

      // 6. 處理付款條款與文件合併
      handlePaymentAndMerging(doc, rowData);

      const finalName = rowData.resto + currentConfig.fileSuffix;
      const fileId = doc.getId();

      if (isDoPDF) {
        // 產出 PDF
        const pdfBlob = DriveApp.getFileById(fileId).getAs('application/pdf');
        const folder = DriveApp.getFolderById('FOLDER_ID');
        const pdfFile = folder.createFile(pdfBlob).setName(finalName + ".pdf");
        
        sheet.getRange(i + 1, getColIdx('pdfUrlCol') + 1).setValue(pdfFile.getUrl());

        // ── 核心修改：如果是無用印自動續約模式，回填 docId 到指定欄位 ──
        if (isNostamp) {
          const docIdColIdx = getColIdx('docId');
          if (docIdColIdx !== -1) {
            sheet.getRange(i + 1, docIdColIdx + 1).setValue(fileId);
          }
        }
        sheet.getRange(i + 1, getColIdx('genPDF') + 1).setValue(false);
      }

      if (isDoDoc) {
        newFile.setName(finalName);
        sheet.getRange(i + 1, getColIdx('docUrlCol') + 1).setValue(newFile.getUrl());
        sheet.getRange(i + 1, getColIdx('genDoc') + 1).setValue(false);
      } else {
        if (!isDoDoc && !isNostamp) {
          newFile.setTrashed(true);
        }
      }
    }
  }
}

/**
 * 基本文字與日期取代
 */
function performBasicReplacement(body, d) {
  const now = new Date();
  const format = (date) => date ? Utilities.formatDate(new Date(date), 'GMT+0800', 'yyyy-MM-dd') : "";

  const replaceMap = {
    '{{name}}': d.company,
    '{{resto}}': d.resto,
    '{{y}}': (now.getFullYear() - 1911).toString(),
    '{{m}}': Utilities.formatDate(now, 'GMT+0800', 'MM'),
    '{{d}}': Utilities.formatDate(now, 'GMT+0800', 'dd'),
    '{{O_startdate}}': d.oStart,
    '{{O_enddate}}': format(d.oEnd),
    '{{N_startdate}}': format(d.nStart),
    '{{N_enddate}}': format(d.nEnd),
    '{{rsv}}': d.rsv,
    '{{value}}': d.fee,
    '{{overage}}': d.overage,
    '{{payment}}': d.payment,
    '{{place}}': d.place,
    '{{amname}}': d.amName,
    '{{amphone}}': d.amPhone,
    '{{ammail}}': d.amMail,
    '{{taxid}}': d.taxId,
    '{{>1place}}': parseInt(d.place) > 1 ? '(以下為單店方案，所有使用店家皆使用相同方案)' : ''
  };

  for (let key in replaceMap) {
    body.replaceText(key, replaceMap[key]);
  }

  // 贈送組數 (年繳特有)
  if (d.sung) {
    body.replaceText('{{sungsung}}', '\n贈送組數/年');
    body.replaceText('{{sung}}', '\n' + d.sung + '組');
  } else {
    body.replaceText('{{sungsung}}', '');
    body.replaceText('{{sung}}', '');
  }
}

/**
 * 特殊方案取代
 */
function performSpecialPlanReplacement(body, special) {
  const plans = {
    'plan1': 'plan1 text...\n',
    'plan2': 'plan2 text...\n',
    'plan3': 'plan3 text...\n',
    'plan4': 'plan4 text...\n',
  };
  body.replaceText('{{special_plan}}', plans[special] || "");
}

/**
 * 加值服務邏輯取代
 */
function performServiceReplacement(body, d) {
  const hasAny = d.depPlan || d.survey || d.voice || d.coupon;
  if (!hasAny) {
    body.replaceText('加值服務：.*', '加值服務：無');
    body.replaceText('{{deposit_rule}}', '');
    return;
  }

  // 讀整張表（從第2列開始，跳過 header）
  const sheet = SpreadsheetApp.openById('TEMPLATE_SHEET_ID').getSheetByName('加值服務條文');
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);

  // 建成 Map 方便查找：key → row
  const templateMap = {};
  rows.forEach(row => {
    const [type, key, text, rule, policy, policyB2C] = row;
    if (key) templateMap[key] = { type, text, rule, policy, policyB2C };
  });
  

  // flag 還是留在 code（純運算）
  const flags = {
      atmTxt:   d.atmFunc    ? 'atm text...' : '',
      preTxt:   d.preOrder   ? 'preorder text...' : '',
      expTxt:   d.experience ? 'experience text...' : '',
      typeName: d.depPlan === 'plan type'
        ? 'plan text...'
        : (d.depAtmRate ? 'plan trpe' : 'plan text...')
  };

  let isB2C = false;
  let isNotB2C = false;
  let isB2BNonTransfer = false;

  if (d.depPlan) {
    if (d.depPlan.includes('B2C')) {
      isB2C = true;
    } else {
      isNotB2C = true;
      // 只有當不是 B2B 轉帳時，才需要顯示信用卡金流政策 (Policy)
      if (d.depPlan !== 'B2B 轉帳') {
        isB2BNonTransfer = true;
      }
    }
  }

  // ── 組 depText ──
  let depText = '';

  if (d.depPlan) {
    if (isB2C) {
      // B2C：依序查各段，用 shouldIncludeB2CPart 決定要不要拼
      const b2cKeys = ['B2C_header', 'B2C_fee', 'B2C_nofee', 'B2C_create', 'B2C_specialbuy', 'B2C_buy'];
      b2cKeys.forEach(key => {
        const tpl = templateMap[key];
        if (!tpl) return;
        if (shouldIncludeB2CPart(key, d)) {
          depText += interpolate(tpl.text, d, flags);
        }
      });
    } else {
      // B2B：resolveKey 決定實際用哪列
      const resolvedKey = resolveKey(d.depPlan, d);
      const tpl = templateMap[resolvedKey];
      if (tpl) {
        depText = interpolate(tpl.text, d, flags);
      }
    }
  }

  body.replaceText('{{deposit_plan}}', depText);
  body.replaceText('{{>1place.2}}',
    (parseInt(d.place) > 1 && d.depPlan)
      ? 'plan text...'
      : ''
  );

  // ── rule / policy ──
  const ruleTpl   = templateMap['{{deposit_rule}}'];
  const policyTpl = templateMap['{{deposit_policy}}'];
  const b2cTpl    = templateMap['{{deposit_policy_B2C}}'];

  body.replaceText('{{deposit_rule}}', 
    (isNotB2C && ruleTpl) ? ruleTpl.text : '');
  body.replaceText('{{deposit_policy}}', 
    (isB2BNonTransfer && policyTpl) ? policyTpl.text : '');
  body.replaceText('{{deposit_policy_B2C}}', 
    (isB2C && b2cTpl) ? b2cTpl.text : '');

  // ── 其他加值服務 ──
  ['survey', 'voice', 'coupon'].forEach(key => {
    const tpl = templateMap[key];
    const value = d[key];
    const text = (tpl && value) ? interpolate(tpl.text, d, flags) : '';
    body.replaceText(`{{${key}}}`, text);
  });

  let monthlyTotal = 0;
  let hasAnyMonthly = false;
  let tableData = [["費用類型", "繳費週期", "金額"]];

  // 1. 系統使用費（永遠是年繳固定加入）
  if (d.fee) {
    tableData.push(["系統使用費", "年繳", `NT$${Number(d.fee).toLocaleString()}`]);
  }

  const isChecked = (val) => val === true || val === "TRUE";

  // 2. 訂金功能（判斷 depIsMonthly）
  if (d.depPlan && d.depPlan != '0') {
    const isDepMonthly = isChecked(d.depIsMonthly) || d.depMonthly > 0;
    const depVal = Number(d.depMonthly || 0);
    
    if (isDepMonthly) {
      monthlyTotal += depVal;
      hasAnyMonthly = true;
      tableData.push(["訂金功能", "月繳", `NT$${depVal.toLocaleString()}`]);
    } else {
      tableData.push(["訂金功能", "年繳", `NT$${(depVal * 12).toLocaleString()}`]);
    }
  }

  // 3. 問卷功能
  if (d.survey && d.survey != '0') {
    const isSurveyMonthly = isChecked(d.surveyIsMonthly);
    const surveyVal = Number(d.survey || 0);

    if (isSurveyMonthly) {
      monthlyTotal += surveyVal;
      hasAnyMonthly = true;
      tableData.push(["問卷功能", "月繳", `NT$${surveyVal.toLocaleString()}`]);
    } else {
      tableData.push(["問卷功能", "年繳", `NT$${(surveyVal * 12).toLocaleString()}`]);
    }
  }

  // 4. 語音功能（新增 voiceIsMonthly 判斷）
  if (d.voice && d.voice != '0') {
    const isVoiceMonthly = isChecked(d.voiceIsMonthly);
    const voiceVal = Number(d.voice || 0);

    if (isVoiceMonthly) {
      monthlyTotal += voiceVal;
      hasAnyMonthly = true;
      tableData.push(["語音功能", "月繳", `NT$${voiceVal.toLocaleString()}`]);
    } else {
      tableData.push(["語音功能", "年繳", `NT$${(voiceVal * 12).toLocaleString()}`]);
    }
  }

  // 5. 優惠券功能（固定年繳 3600）
  const cv = d.coupon;
  if (cv === true || cv === 'TRUE' || (cv !== '' && cv != '0')) {
    tableData.push(["優惠券功能", "年繳", "NT$XXX"]);
  }

  handleTemplateTable(body, '{{addonisMonthly_row}}', tableData, hasAnyMonthly);

  const addonisMonthlyText = d.addonisMonthly === true 
    ? `\n🅅月繳：乙方應按月支付新台幣 ${monthlyTotal.toLocaleString()} 元。` 
    : "";
  body.replaceText('{{addonisMonthly}}', addonisMonthlyText);


  // ── 清除剩餘 placeholder ──
  ['{{deposit_plan}}','{{deposit_rule}}','{{deposit_policy}}','{{deposit_policy_B2C}}',
   '{{survey}}','{{voice}}','{{coupon}}','{{>1place.2}}'].forEach(tag => {
    body.replaceText(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), '');
  });
}

// ── 輔助函式 ──
function resolveKey(depPlan, d) {
  if (depPlan === 'plan type') return d.depMonthly > 0 ? 'plan type（有月費）' : 'plan type';
  if (depPlan === 'plan type') return d.depMonthly > 0 ? 'plan type（有月費）' : 'plan type';
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

function interpolate(template, d, flags) {
  if (!template) return '';
  return template
    .replace(/\$\{d\.(\w+)\}/g,     (_, key) => d[key] ?? '')
    .replace(/\$\{flags\.(\w+)\}/g, (_, key) => flags[key] ?? '')
    .replace(/\$\{100\s*-\s*d\.depRate\}/g,    () => 100 - (d.depRate    ?? 0))
    .replace(/\$\{100\s*-\s*d\.depAtmRate\}/g, () => 100 - (d.depAtmRate ?? 0))
    .replace(/\\n/g, '\n');
}
    

/**
 * 付款條款
 */
function handlePaymentAndMerging(doc, d) {
  const body = doc.getBody();
  const achText = `🅅 ACH terms...`;
  const wireText = `🅅 wire terms...`;

  body.replaceText('{{payment}}', d.payment);
  body.replaceText('{{payment_term}}', d.payTerm === "ACH" ? achText : wireText);

  doc.saveAndClose();

  if (d.ach === true) {
    mergeDocumentAppend(doc.getId(), "TEMPLATE_DOC_ID");
  }
}

/**
 * 工具：合併兩個 Google 文件
 */
function mergeDocumentAppend(baseId, sourceId) {
  const baseDoc = DocumentApp.openById(baseId);
  const sourceBody = DocumentApp.openById(sourceId).getBody();
  const baseBody = baseDoc.getBody();

  baseBody.appendPageBreak();
  for (let j = 0; j < sourceBody.getNumChildren(); j++) {
    const element = sourceBody.getChild(j).copy();
    const type = element.getType();
    if (type === DocumentApp.ElementType.TABLE) {
      const table = baseBody.appendTable(element.asTable());
      table.setColumnWidth(0, element.asTable().getColumnWidth(0));
    } else if (type === DocumentApp.ElementType.PARAGRAPH) {
      baseBody.appendParagraph(element.asParagraph());
    } else if (type === DocumentApp.ElementType.LIST_ITEM) {
      baseBody.appendListItem(element.asListItem());
    }
  }
  baseDoc.saveAndClose();
}


/**
 * 處理條款裡的既有表格：動態填值或刪除
 */
function handleTemplateTable(body, tag, tableData, isEnabled) {
  const rangeElement = body.findText(tag);
  if (!rangeElement) return;

  // 1. 找到標記所在的 Cell -> Row -> Table
  const cell = rangeElement.getElement().getParent().getParent(); // Text -> Paragraph -> Cell
  const row = cell.getParent(); // Cell -> Row
  const table = row.getParent(); // Row -> Table

  // 2. 如果不啟用（沒打勾或沒資料），直接刪除整個表格
  if (!isEnabled || tableData.length <= 1) { // tableData[0] 是標題，所以長度小於等於1代表沒內容
    table.removeFromParent();
    return;
  }

  // 3. 如果啟用，填入資料
  // 因為模板已有第一列（標題），我們從 tableData 的第二筆開始填
  for (let i = 1; i < tableData.length; i++) {
    const rowData = tableData[i];
    let currentRow;

    if (i === 1) {
      // 第一筆資料直接用標記所在的那一列
      currentRow = row;
      body.replaceText(tag, ''); // 清掉標記文字
    } else {
      // 之後的資料則新增一列
      currentRow = table.appendTableRow();
      // 複製標記列的樣式（可選）
    }

    // 填入三欄資料
    for (let j = 0; j < 3; j++) {
      let targetCell;
      if (i === 1) {
        targetCell = currentRow.getCell(j);
      } else {
        targetCell = currentRow.appendTableCell(rowData[j]);
      }
      
      // 如果是第一行以外新增的 Cell，需要補齊文字
      if (i > 1) {
        // 設定內容與樣式
      } else {
        targetCell.setText(rowData[j]);
      }

      // 設定樣式：靠左、垂直置中、縮減 Padding
      const para = targetCell.getChild(0).asParagraph();
      para.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
      targetCell.setVerticalAlignment(DocumentApp.VerticalAlignment.CENTER);
      targetCell.setPaddingTop(1).setPaddingBottom(1);
    }
  }
}



