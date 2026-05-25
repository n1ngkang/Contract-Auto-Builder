/**
 * Email 自動化發送 - 核心引擎
 */
function coreEmailEngine(mode) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 未來要增加路徑，只要在這邊加一行就好
  const modeMap = {
    'annual': '年繳',
    'monthly': '月繳',
    'annualShare': '年繳共享',
    'monthlyShare': '月繳共享',
    'annualMulti': '年繳多店',
    'monthlyMulti': '月繳多店',
  };

  const sheetName = modeMap[mode];
  if (!sheetName) {
    Logger.log("❌ 錯誤：未定義的執行模式 - " + mode);
    return;
  }
  
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log("找不到工作表: " + sheetName);
    return;
  }

  const lastRowB = sheet.getRange("B" + sheet.getMaxRows()).getNextDataCell(SpreadsheetApp.Direction.UP).getRow();
  const headers = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];

  // 取得欄位索引工具 (1-based)
  const getColIdx = (name) => headers.indexOf(name) + 1;
  
  // 索引緩存，避免迴圈內重複搜尋
  const idx = {
    status: getColIdx('Status'),
    auto: getColIdx('自動寄出'),
    email: getColIdx('寄送Email'),
    resto: getColIdx('餐廳名稱\n(可填多間店、方案需一致)'),
    ach: getColIdx('ACH 合約書\n(勾選會附件ACH)'),
    pdf: getColIdx('合約pdf'),
    amName: getColIdx('amname'),
    amPhone: getColIdx('amphone'),
    amMail: getColIdx('ammail'),
    title: getColIdx('Title'),
    bank: getColIdx('匯款銀行'),
    acc: getColIdx('匯款帳號')
  };

  // 讀取起始行數 (從 Status 欄位的第一列儲存的值開始)
  const startRow = sheet.getRange(1, idx.status).getValue();

  for (let i = startRow; i <= lastRowB; i++) {
    const isAuto = sheet.getRange(i, idx.auto).getValue();
    const status = sheet.getRange(i, idx.status).getValue();
    const recipient = sheet.getRange(i, idx.email).getValue();

    if (isAuto === true && status !== "sent" && recipient !== "") {
      
      Logger.log(`正在發送 (${sheetName}): ` + recipient);

      // 取得資料
      const restoName = sheet.getRange(i, idx.resto).getValue();
      const hasACH = sheet.getRange(i, idx.ach).getValue();
      const pdfURL = sheet.getRange(i, idx.pdf).getValue();
      const amName = sheet.getRange(i, idx.amName).getValue();
      const amPhone = sheet.getRange(i, idx.amPhone).getValue();
      const amMail = sheet.getRange(i, idx.amMail).getValue();
      const amTitle = sheet.getRange(i, idx.title).getValue();

      if (!pdfURL || pdfURL.trim() === "") {
        sheet.getRange(i, idx.status).setValue('失敗：請先生產合約 pdf');
        continue; 
      }

      // 主旨
      const subject = `demoCompany｜${restoName}  訂候位系統續約通知書 - 2026`;

      // 構建內文
      let body = `尊敬的客戶您好，\n\n這裡是demoCompany訂候位系統，\n貴餐廳與demoCompany合作的訂候位服務即將到期，\n附件為續約增補協議電子檔，\n再請您協助用印大小章並拍照或掃描回傳電子檔，於一週內回傳，供我們雙方留檔。\n`;

      if (hasACH === true) {
        body += `另請注意，「委託轉帳代繳業務費用授權書」需紙本用印一式三份用，並寄回正本。\n\n`;
      }

      // --- 年繳特有內文: 匯款資訊 ---
      if (mode.toLowerCase().includes('annual')) {
        const bankName = sheet.getRange(i, idx.bank).getValue();
        const bankAcc = sheet.getRange(i, idx.acc).getValue();
        
        body += `貴司匯款帳號如下：\n戶名：demoCompany\n銀行：`;
        if (bankName.includes("822")) body += `BANK NAME\n`;
        else if (bankName.includes("812")) body += `BANK NAME\n`;
        else body += `${bankName}\n`;
        
        body += `帳號：${bankAcc}\n發票開立完成後，會再寄一封發票電子檔及匯款資料的信件到您的信箱。\n\n`;
      }

      body += `若貴公司有其它額外想討論，請不吝來電/來信聯繫，謝謝。\n\n\nBest Regards,\n\n${amName}\n${amTitle}\n\nContact：${amPhone}\nEmail：${amMail}\nAdd：address`;

      // 處理附件
      try {
        const pdfID = pdfURL.match(/\/d\/([a-zA-Z0-9_-]+)/)[1];
        const attachment = DriveApp.getFileById(pdfID);

        // 發送 Email
        MailApp.sendEmail(recipient, subject, body, {
          //cc: amMail,
          //bcc: "csm_opsMail",
          name: 'demoCompany客戶經營團隊',
          //replyTo: `${amMail}`,
          attachments: [attachment.getBlob()]
        });

        // 更新狀態
        sheet.getRange(i, idx.status).setValue('sent');
        sheet.getRange(i, idx.auto).setValue(false);
        
      } catch (e) {
        Logger.log(`發送失敗 (Row ${i}): ` + e.toString());
      }
    }
  }
}

// --- 啟動用入口 ---
function sendAnnualEmails() { coreEmailEngine('annual'); }
function sendMonthlyEmails() { coreEmailEngine('monthly'); }
function sendAnnualShareEmails() { coreEmailEngine('annualShare'); }
function sendMonthlyShareEmails() { coreEmailEngine('monthlyShare'); }
function sendAnnualMultiEmails() { coreEmailEngine('annualMulti'); }
function sendMonthlyMultiEmails() { coreEmailEngine('monthlyMulti'); }

