function onOpen() {
    const ui = SpreadsheetApp.getUi();
    
    const optimenu = ui.createMenu('optimize 合約'); 
    optimenu.addItem('年繳 PDF', 'triggerAnnual_PDF');
    optimenu.addItem('年繳 DOC', 'triggerAnnual_Doc'); 
    optimenu.addItem('月繳 PDF', 'triggerMonthly_PDF');
    optimenu.addItem('月繳 DOC', 'triggerMonthly_Doc');
    optimenu.addItem('年繳共享 PDF', 'triggerAnnualShare_PDF');
    optimenu.addItem('年繳共享 DOC', 'triggerAnnualShare_Doc');
    optimenu.addItem('月繳共享 PDF', 'triggerMonthlyShare_PDF');
    optimenu.addItem('月繳共享 DOC', 'triggerMonthlyShare_Doc');
    optimenu.addItem('年繳多店 PDF', 'triggerAnnualMulti_PDF');
    optimenu.addItem('年繳多店 DOC', 'triggerAnnualMulti_Doc');
    optimenu.addItem('月繳多店 PDF', 'triggerMonthlyMulti_PDF');
    optimenu.addItem('月繳多店 DOC', 'triggerMonthlyMulti_Doc');
    optimenu.addToUi();

    const optimailmenu = ui.createMenu('optimize email'); 
    optimailmenu.addItem('寄年繳信', 'sendAnnualEmails');
    optimailmenu.addItem('寄月繳信', 'sendMonthlyEmails');
    optimailmenu.addItem('寄年繳共享信', 'sendAnnualShareEmails');
    optimailmenu.addItem('寄月繳共享信', 'sendMonthlyShareEmails');
    optimailmenu.addItem('寄年繳多店信', 'sendAnnualMultiEmails');
    optimailmenu.addItem('寄月繳多店信', 'sendMonthlyMultiEmails');
    optimailmenu.addToUi();

    const optinostampmenu = ui.createMenu('optimize 無用印'); 
    optinostampmenu.addItem('年繳無用印', 'triggerAnnualnostamp');
    optinostampmenu.addItem('月繳無用印', 'triggerMonthlynostamp');
    optinostampmenu.addItem('年繳共享無用印', 'triggerAnnualShare_nostamp');
    optinostampmenu.addItem('月繳共享無用印', 'triggerMonthlyShare_nostamp');
    optinostampmenu.addItem('年繳多店無用印', 'triggerAnnualMulti_nostamp');
    optinostampmenu.addItem('月繳多店無用印', 'triggerMonthlyMulti_nostamp');
    optinostampmenu.addToUi();

    const optiautomailmenu = ui.createMenu('optimize 自動續約'); 
    optiautomailmenu.addItem('年繳自動續約', 'triggerAutoEmailAnnual');
    optiautomailmenu.addItem('月繳自動續約', 'triggerAutoEmailMonthly');
    optiautomailmenu.addItem('年繳共享自動續約', 'triggerAutoEmailAnnualShare');
    optiautomailmenu.addItem('月繳共享自動續約', 'triggerAutoEmailMonthlyShare');
    optiautomailmenu.addItem('年繳多店自動續約', 'triggerAutoEmailAnnualMulti');
    optiautomailmenu.addItem('月繳多店自動續約', 'triggerAutoEmailMonthlyMulti');
    optiautomailmenu.addToUi();
}


