const FIELDS = {
  'company': '公司名稱',
  'resto': '餐廳名稱',
  'oStart': '原合約起始年',
  'oEnd': '原合約結束日',
  'nStart': '新合約起始',
  'nEnd': '新合約結束',
  'rsv': '使用組數',
  'sung': '贈送組數\n(若無請留白)',
  'fee': '系統使用費',
  'overage': '超額費',
  'depPlan': '訂金方案\n必填',
  'depMonthly': '訂金\n月租費',
  'depRate': '(新)訂金\n抽成費\n*不用填%',
  'depAtmRate': '(新)虛擬帳號訂金\n抽成費\n*不用填%',
  'depCreate': '(新)訂金\n建立費',
  'survey': '問卷\n月租費',
  'voice': '語音\n月租費',
  'coupon': '優惠券',
  'payTerm': '繳款方式',
  'place': '使用店家數',
  'bank': '匯款銀行',
  'acc': '匯款帳號',
  'amName': 'amname',
  'amPhone': 'amphone',
  'amMail': 'ammail',
  'special': '特殊方案',
  'payment': '年繳總繳款金額\n(自行填寫)',
  'ach': 'ACH 合約書\n(勾選會附件ACH)',
  'taxId': 'taxid',
  'genPDF': '生成合約\n（PDF）',
  'genDoc': '生成合約\n（Doc）',
  'pdfUrlCol': '合約pdf',
  'docUrlCol': '合約Doc',
  'docId': 'docId',
  // 內部判斷用標籤欄位
  'atmFunc': 'ATM 功能',
  'preOrder': 'Pre-order',
  'experience': 'Experience',

  'depIsMonthly':    '訂金月繳',
  'surveyIsMonthly': '問卷月繳',
  'voiceIsMonthly':  '語音月繳',
  'couponIsMonthly': '優惠券月繳',
};

// --- 2. Mode Configuration ---
const CONFIG = {
  'annual': {
    sheetName: '年繳',
    templateId: 'TEMPLATE_DOC_ID',
    templateIdForDoc: 'TEMPLATE_DOC_ID',
    fileSuffix: '-續約協議書(年繳)'
  },
  'monthly': {
    sheetName: '月繳',
    templateId: 'TEMPLATE_DOC_ID',
    templateIdForDoc: 'TEMPLATE_DOC_ID',
    fileSuffix: '-續約協議書(月繳)'
  },
  'annual_nostamp': {
    sheetName: '年繳',
    templateId: 'TEMPLATE_DOC_ID',
    fileSuffix: '-續約協議書(年繳自動續約)',

    // 覆蓋欄位名稱（只列跟 FIELDS 不同的）
    fieldOverrides: {
      'genPDF': '生成\n無用印Pdf\n(自動續約用)',
      'pdfUrlCol': '無用印pdf\n(自動續約用)'
    },
  },
  'monthly_nostamp': {
    sheetName: '月繳',
    templateId: 'TEMPLATE_DOC_ID',
    fileSuffix: '-續約協議書(月繳自動續約)',

    // 覆蓋欄位名稱（只列跟 FIELDS 不同的）
    fieldOverrides: {
      'genPDF': '生成\n無用印Pdf\n(自動續約用)',
      'pdfUrlCol': '無用印pdf\n(自動續約用)'
    },
  }
};


// 年繳
function triggerAnnual_PDF() { runContractEngine('annual', 'PDF'); }
function triggerAnnual_Doc() { runContractEngine('annual', 'DOC'); }

// 月繳
function triggerMonthly_PDF() { runContractEngine('monthly', 'PDF'); }
function triggerMonthly_Doc() { runContractEngine('monthly', 'DOC'); }

// 自動續約 (只產 pdf)
function triggerAnnualnostamp() { runContractEngine('annual_nostamp', 'PDF'); }
function triggerMonthlynostamp() { runContractEngine('monthly_nostamp', 'PDF'); }

