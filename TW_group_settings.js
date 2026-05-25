const GROUP_FIELDS = {
  shareId:      'Share ID\n（*必填，一個共享填一次）',
  genPDF:       '生成合約\n（PDF）',
  pdfUrl:       '合約pdf',
  genDoc:       '生成合約\n（Doc）',
  docUrl:       '合約Doc',
  doc:          'docId',
  company:      '公司名稱',
  resto:        '餐廳名稱',
  place:        '共享店家數',
  taxId:        'taxid',
  payTerm:      '繳款方式',
  bank:         '匯款銀行',
  acc:          '匯款帳號',
  nStart:       '新合約起始',
  nEnd:         '新合約結束',
  usageAnnual:  '使用組數/年',
  usageMonthly: '使用組數/月',
  feeAnnual:    '系統使用費/年',
  feeMonthly:   '系統使用費/月',
  gift:         '贈送組數\n(若無請留白)',
  giftSum:      '總贈送（勿刪）',
  overage:      '超額費',
  paymentAnnual:'年繳總繳款金額\n(自行填寫)',
  depPlan:      '訂金方案\n//必填',
  survey:       '問卷\n(月租費)',
  voice:        '語音\n(月租費)',
  coupon:       '優惠券',
  depMonthly:   '訂金\n(月租費)',
  depRate:      '訂金\n抽成費\n(*不用填%)',
  depAtmRate:   '虛擬帳號訂金\n抽成費\n(*不用填%)',
  depCreate:    '訂金\n建立費',
  atmFunc:      '訂金\nATM 功能',
  preOrder:     '訂金\nPre-order"',
  experience:   '訂金\nExperience',
  ach:          'ACH 合約書\n(勾選會附件ACH)',
  special:      '特殊方案',
  amName:       'amname',
  amPhone:      'amphone',
  amMail:       'ammail',

  depIsMonthly:    '訂金月繳',
  surveyIsMonthly: '問卷月繳',
  voiceIsMonthly:  '語音月繳',
  couponIsMonthly: '優惠券月繳',
};

// 共享多店共用模板
const GROUP_CONFIG = {
  annual: {
    sheetName:  '年繳共享',
    templateId: 'TEMPLATE_DOC_ID',
    templateIdForDoc: 'TEMPLATE_DOC_ID',
    fileSuffix: '-續約協議書(年繳共享)',
    usageKey:   'usageAnnual',
    feeKey:     'feeAnnual',
    cycleLabel: '年繳',
    numCells:   7,
    hasGift:    true,
  },
  monthly: {
    sheetName:  '月繳共享',
    templateId: 'TEMPLATE_DOC_ID',
    templateIdForDoc: 'TEMPLATE_DOC_ID',
    fileSuffix: '-續約協議書(月繳共享)',
    usageKey:   'usageMonthly',
    feeKey:     'feeMonthly',
    cycleLabel: '月繳',
    numCells:   6,
    hasGift:    false,
  },

  multiAnnual: {
    sheetName:  '年繳多店',
    templateId: 'TEMPLATE_DOC_ID',
    templateIdForDoc: 'TEMPLATE_DOC_ID',
    fileSuffix: '-續約協議書(年繳多店)',
    usageKey:   'usageAnnual',
    feeKey:     'feeAnnual',
    cycleLabel: '年繳',
    numCells:   7,
    hasGift:    true,
    
    // 覆蓋欄位名稱（只列跟 GROUP_FIELDS 不同的）
    fieldOverrides: {
      shareId:    'Company Name\n（*必填，一份合約填一次）',
      place:      '店家數',
    },
  },
  multiMonthly: {
    sheetName:  '月繳多店',
    templateId: 'TEMPLATE_DOC_ID',
    templateIdForDoc: 'TEMPLATE_DOC_ID',
    fileSuffix: '-續約協議書(月繳多店)',
    usageKey:   'usageMonthly',
    feeKey:     'feeMonthly',
    cycleLabel: '月繳',
    numCells:   6,
    hasGift:    false,
    
    fieldOverrides: {
      shareId:    'Company Name\n（*必填，一份合約填一次）',
      place:      '店家數',
    },
  },

  annual_nostamp: {
    sheetName:  '年繳共享',
    templateId: 'TEMPLATE_DOC_ID',
    fileSuffix: '-續約協議書(年繳共享自動續約)',
    usageKey:   'usageAnnual',
    feeKey:     'feeAnnual',
    cycleLabel: '年繳',
    numCells:   7,
    hasGift:    true,
    
    fieldOverrides: {
      genPDF:    '生成\n無用印Pdf\n(自動續約用)',
      pdfUrl: '無用印pdf\n(自動續約用)'
    },
  },
  monthly_nostamp: {
    sheetName:  '月繳共享',
    templateId: 'TEMPLATE_DOC_ID',
    fileSuffix: '-續約協議書(月繳共享自動續約)',
    usageKey:   'usageMonthly',
    feeKey:     'feeMonthly',
    cycleLabel: '月繳',
    numCells:   6,
    hasGift:    false,
    
    fieldOverrides: {
      genPDF:    '生成\n無用印Pdf\n(自動續約用)',
      pdfUrl: '無用印pdf\n(自動續約用)'
    },
  },
  multiAnnual_nostamp: {
    sheetName:  '年繳多店',
    templateId: 'TEMPLATE_DOC_ID',
    fileSuffix: '-續約協議書(年繳多店自動續約)',
    usageKey:   'usageAnnual',
    feeKey:     'feeAnnual',
    cycleLabel: '年繳',
    numCells:   7,
    hasGift:    true,
    
    fieldOverrides: {
      shareId:    'Company Name\n（*必填，一份合約填一次）',
      place:      '店家數',
      genPDF:    '生成\n無用印Pdf\n(自動續約用)',
      pdfUrl: '無用印pdf\n(自動續約用)'
    },
  },
  multiMonthly_nostamp: {
    sheetName:  '月繳多店',
    templateId: 'TEMPLATE_DOC_ID',
    fileSuffix: '-續約協議書(月繳多店自動續約)',
    usageKey:   'usageMonthly',
    feeKey:     'feeMonthly',
    cycleLabel: '月繳',
    numCells:   6,
    hasGift:    false,
    
    fieldOverrides: {
      shareId:    'Company Name\n（*必填，一份合約填一次）',
      place:      '店家數',
      genPDF:    '生成\n無用印Pdf\n(自動續約用)',
      pdfUrl: '無用印pdf\n(自動續約用)'
    },
  }
};


// 年繳共享
function triggerAnnualShare_PDF()  { runShareEngine('annual', 'PDF');  }
function triggerAnnualShare_Doc()  { runShareEngine('annual', 'DOC');  }

// 月繳共享
function triggerMonthlyShare_PDF() { runShareEngine('monthly', 'PDF'); }
function triggerMonthlyShare_Doc() { runShareEngine('monthly', 'DOC'); }

// 年繳多店
function triggerAnnualMulti_PDF() { runShareEngine('multiAnnual', 'PDF'); }
function triggerAnnualMulti_Doc() { runShareEngine('multiAnnual', 'DOC'); }

// 月繳多店
function triggerMonthlyMulti_PDF() { runShareEngine('multiMonthly', 'PDF'); }
function triggerMonthlyMulti_Doc() { runShareEngine('multiMonthly', 'DOC'); }

// 自動續約（只產 pdf）
function triggerAnnualShare_nostamp()  { runShareEngine('annual_nostamp', 'PDF');  }
function triggerMonthlyShare_nostamp() { runShareEngine('monthly_nostamp', 'PDF'); }
function triggerAnnualMulti_nostamp() { runShareEngine('multiAnnual_nostamp', 'PDF'); }
function triggerMonthlyMulti_nostamp() { runShareEngine('multiMonthly_nostamp', 'PDF'); }

