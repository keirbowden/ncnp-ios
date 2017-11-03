/**
 *
 * Object to manage sections - this contains the majority of business logic
 * for the sample application.
 *
 */

// constructor
function Sections(){
}

// array of answer option characters
Sections.prototype.aTOe=['a', 'b', 'c', 'd', 'e'];

// clears the sections soup
Sections.prototype.clear = function() {
    var self=this;
    
    navigator.smartstore.clearSoup('sections', sections.cleared, sections.error);
}

// callback executed when the sections soup has been successfully cleared
Sections.prototype.cleared = function() {
    mainView.router.load({pageName: "index"});
    myApp.addNotification({
                          title: 'Cleared Sections',
                          hold: 3000
                          });
    sections.list();
}

// Queries all sections in the smart store - limit 100, sorted by name ascending
// so starting with A
Sections.prototype.queryAllSections=function(cb) {
    var querySpec=navigator.smartstore.buildAllQuerySpec('Name', 'ascending', 100);
    navigator.smartstore.querySoup('sections', querySpec, cb, store.error);
}

// Generates the section list on the home page
Sections.prototype.list=function() {
    sections.queryAllSections(sections.outputSections);
}

// Generates list of placeholders when the sections soup is empty
Sections.prototype.showBlankSections = function() {
    var sectionList=$$("#sectionList");
    var html='<div class="list-block">\n' +
             '  <ul>\n';
    
    for (var idx=0; idx<2; idx++) {
        html+='    <li>\n' +
        '      <a href="#" class="item-link">\n' +
        '        <div class="item-content">\n' +
        '          <div class="item-inner">\n' +
        '            <div class="item-title placeholder">No sections in store</div>\n' +
        '          </div>\n' +
        '        </div>\n' +
        '      </a>\n' +
        '    </li>';
    }
    
    html+='  </ul>\n' +
          '</div>';
    
    sectionList.html(html);
}

// outputs the sections on the home page, delegating to the appropriate method
// depending on whether the sections soup is empty or not
Sections.prototype.outputSections = function(cursor) {
    console.log('In output sections');
    var entries=cursor.currentPageOrderedEntries;
    console.log('Entries = ' + JSON.stringify(entries, null, 4));
    console.log('Entries length = ' + entries.length);
    if (entries.length>0) {
        sections.outputAllSections(entries);
    }
    else {
        sections.showBlankSections();
    }
    mainView.router.load({pageName: "index"});
}

// callback method invoked when the sections have been retrieved from the Salesforce server
Sections.prototype.retrievedSections = function(entries) {
    myApp.addNotification({
                            title: 'Sections Downloaded',
                            message: 'Downloaded ' + entries.length + ' sections',
                            hold: 3000
                          });
    sections.outputAllSections(entries);
    mainView.router.load({pageName: "index"});
}

// generates the HTML for all sections to the list element on ther home page
Sections.prototype.outputAllSections = function(entries) {
    var sectionList=$$("#sectionList");
    
    console.log('In outputAllSections');
    console.log('Entries = ' + JSON.stringify(entries, null, 4));
    console.log('entries length = ' + entries.length);
    var unsynced=false;
    if (entries.length>0) {
        var html='<div class="list-block" id="sectionListInner">\n' +
                 '<ul>\n';
        for (var idx=0; idx<entries.length; idx++) {
            var section=entries[idx];
            html+='<li><a onclick="sections.navigateToSection(\'' + section.Id + '\');" href="#section" class="item-link">\n' +
                  '<div class="item-content">\n' +
                  '<div class="item-inner">\n' +
                  '<div class="item-title">' + section.Name + '</div>\n';
            
            if (section.isDirty) {
                unsynced=true;
            }
            html+='<div class="item-after"><i class="f7-icons" style="color: ' +
                  (section.Complete__c?'#00ff00':'#0000ff') + '">' +
                  (section.Complete__c?'check_round':'play_round') + '</i></div>\n' +
                  '</div>\n' +
                  '</div></a></li>';
        }
        html+='</ul></div>';
        if (unsynced) {
            html+=sections.addUnsyncedCard();
        }
        sectionList.html(html);
    }
}

// method invoked when the user clicks an entry in the section list on the home page
Sections.prototype.navigateToSection = function(id) {
    sections.querySectionById(id, sections.gotSectionForNavigation);
}

// queries a section from the soup based on its Salesforce id
Sections.prototype.querySectionById=function(id, cb) {
    var querySpec = navigator.smartstore.buildExactQuerySpec("Id", id);
    
    navigator.smartstore.querySoup('sections', querySpec, cb, store.error);
}

// method invoked when the user clicks an entry in the page list in a section detail page
Sections.prototype.navigateToPage = function(sectionId, pageId) {
    var querySpec = navigator.smartstore.buildExactQuerySpec("Id", sectionId);
    
    navigator.smartstore.querySoup('sections',
                                   querySpec,
                                   function(cursor) {
                                       sections.pageRetrieved(cursor, pageId);
                                   },
                                   store.error);
}

// callback function invoked when the user's selected page has been queried from the soup
Sections.prototype.pageRetrieved = function(cursor, pageId) {
    var entries=cursor.currentPageOrderedEntries;
    var page=null;
    if (entries.length>0) {
        var section=entries[0];
        for (var idx=0; idx<section.Pages__r.records.length; idx++) {
            var cand=section.Pages__r.records[idx];
            if (cand.Id==pageId) {
                page=cand;
            }
        }
        
        
        $$("#pageTitle").html(page.Title__c);
        $$("#pageDetail").html(page.Detail__c);
        if (page.Complete__c) {
            // the user has already completed the questions
            sections.showCompletedPage(section, page);
        }
        else {
            // the user has not completed the questions - iterate the questions and answer options and
            // generate the HTML
            
            var questionsHTML='';
            for (var qIdx=1; qIdx<=5; qIdx++) {
                var fieldName='Question_' + qIdx + '__c';
                if ( (undefined !== page[fieldName]) && (null!=page[fieldName]) && (''!==page[fieldName]) ) {
                    questionsHTML+='<div class="card">' +
                                   '<div class="card-header">' + qIdx + '. ' + page[fieldName] + '</div>' +
                                   '<div class="card-content">' +
                                   '    <div class="list-block">' +
                                   '        <ul id="question' + qIdx + 'Answers"> ';

                    for (var aIdx=0; aIdx<5; aIdx++) {
                        var ch=sections.aTOe[aIdx];
                        var fieldName='Question_' + qIdx + '_Option_' + ch + '__c';
                        if ( (undefined !== page[fieldName]) && (null!==page[fieldName]) && (''!==page[fieldName]) ) {
                            questionsHTML+= '    <li class="item-content" onclick="sections.answerClicked(\'' + qIdx + '\', \'' + aIdx + '\');">' +
                                            '      <div class="item-inner"> ' +
                                            '        <div class="item-title" style="font-size:0.8em">' + ch + '. ' + page[fieldName] + '</div>' +
                                            '      </div> ' +
                                            '    </li> ';
                        }
                    }
                    questionsHTML+= '</ul></div></div></div>';
                }
            }
        
            // alert('Questions HTML = ' + questionsHTML);
            if (questionsHTML!='') {
                questionsHTML+='<div id="checkMessage"></div>' +
                                '<a id="checkBtn" href="#" onclick="sections.checkAnswers(\'' + section.Id +
                                '\', \'' + page.Id + '\');" class="button button-fill button-big disabled">Check</a>';
            }
            
            $$('#pageQuestions').html(questionsHTML);
            console.log('Started time = ' + page.Started_Time__c);
            // if this is the first time the user has accessed the page, set the started time
            if (undefined==page.Started_Time__c) {
                page.Started_Time__c=new Date();
                sections.updateSection(section);
            }
        }
    }
    
    mainView.router.load({pageName: "page"});
}

// update the section in the soup
Sections.prototype.updateSection = function(section) {
    var entries=[];
    section.isDirty=true;
    entries.push(section);
    console.log('Upserting entries ' + JSON.stringify(entries, null, 4));
    store.getSmartstore().upsertSoupEntries('sections', entries,
                                            function(items) { sections.outputAllSections(items); },
                                            store.error);
}

// Generates HTML to indicate to the user that they have already completed the questions on the page
Sections.prototype.showCompletedPage = function(section, page) {
    var divHtml=sections.addCompletedCard('page<br/>challenge', page.Completed_Time__c);
    
    // figure out if there are any more pages
    var len=section.Pages__r.records.length;
    var nextPage=null;
    for (var idx=0; idx<len; idx++) {
        var cand=section.Pages__r.records[idx];
        console.log('Considering cand ' + cand + ' idx = ' + idx + ', len = ' + len);
        if ( (null==nextPage) && (cand.Id==page.Id) ) {
            if (idx<len-1) {
                nextPage=section.Pages__r.records[idx+1];
            }
            break;
        }
    }
    if (null!=nextPage) {
        divHtml+='<div><a href="#" onclick="sections.navigateToPage(\'' + section.Id + '\', \'' + nextPage.Id + '\');" class="button button-fill color-blue">Next</a></div>';
    }
    else {
        divHtml+='<div><a href="#index" onclick="sections.list();" class="button button-fill color-green">Back to Sections</a></div>';
    }
    
    $$('#pageQuestions').html(divHtml);
}

// callback when a section has been retrieved because the user wishes to navigate to it
Sections.prototype.gotSectionForNavigation = function(cursor) {
    var entries=cursor.currentPageOrderedEntries;
    if (entries.length>0) {
        var section=entries[0];
        sections.outputSectionDetails(section);
    }
}

// generates the HTML for a section - overview and list of navigable pages
Sections.prototype.outputSectionDetails = function(section) {
        $$("#sectionTitle").html(section.Name);
        $$("#sectionDetail").html(section.Description_Long__c);
        var html='';
        if (null!=section.Pages__r) {
            html+='<div class="list-block" id="pageListInner">\n' +
                    '<ul>\n';
            for (var idx=0; idx<section.Pages__r.records.length; idx++) {
                var page=section.Pages__r.records[idx];
                html+='<li><a onclick="sections.navigateToPage(\'' + section.Id + '\', \'' + page.Id + '\');" href="#section" class="item-link">\n' +
                        '<div class="item-content">\n' +
                        '<div class="item-inner">\n' +
                        '<div class="item-title">' + page.Title__c + '</div>\n' +
                        '<div class="item-after"><i class="f7-icons" style="color: ' + (page.Complete__c?'#00ff00':'#0000ff') + '">' + (page.Complete__c?           'check_round':'play_round') + '</i></div>\n' +
                        '</div>\n' +
                        '</div></a></li>';
            }
            html+='</ul></div>';
        }
        else {
            html='<div class="card"> ' +
            '  <div class="card-content"> ' +
            '    <div class="card-content-inner">No pages present</div> ' +
            '  </div> ' +
            '</div>';
        }
        
        if (section.Complete__c) {
            html+=sections.addCompletedCard('section<br/>', section.Completed_Time__c);
        }
        
        if (section.isDirty) {
            html+=sections.addUnsyncedCard();
        }
        $$("#pageList").html(html);
}

// add the unsynced indicator
Sections.prototype.addUnsyncedCard=function() {
    return '<div style="margin-left:10px" class="chip"> ' +
           '     <div class="chip-media bg-yellow">!</div> ' +
           '     <div class="chip-label">Unsynced changes</div> ' +
           '</div>';
}

// add an element showign that the user has completed something on a date
Sections.prototype.addCompletedCard=function(type, dateVal) {
    var dateStr;
    if (dateVal instanceof Date) {
        dateStr=dateVal.toISOString().substring(0, 10);
    }
    else {
        dateStr=dateVal.substring(0, 10);
    }
        
    return '<div class="card"> ' +
            '  <div class="card-content"> ' +
            '    <div class="card-content-inner">You successfully completed this ' + type + ' on ' + dateStr + ' </div> ' +
            '  </div> ' +
            '</div>';
}


// callback when all sections have been queried to synchronise with Salesfore
Sections.prototype.queriedForSync = function (cursor) {
    var entries=cursor.currentPageOrderedEntries;
    var upload=false;

    var secs=[];
    var pgs=[];
    for (var idx=0; idx<entries.length; idx++) {
        var section=entries[idx];
        if (section.isDirty) {
            upload=true;
            var newSection={Id: section.Id,
                            Complete__c : section.Complete__c,
                            Completed_Time__c : section.Completed_Time__c};
            secs.push(newSection);
            for (var pIdx=0; pIdx<section.Pages__r.records.length; pIdx++) {
                var page=section.Pages__r.records[pIdx];
                var newPage={Id: page.Id,
                            Started_Time__c: page.Started_Time__c,
                            Completed_Time__c: page.Completed_Time__c,
                            Complete__c: page.Complete__c};
                pgs.push(newPage);
            }
        }
    }
    if (upload) {
        var data={sections: secs,
            pages:pgs};
        var data2=JSON.parse(JSON.stringify(data));
        var dataStr=JSON.stringify(data);
        var request={
                method: 'POST',
                contentType: 'application/json',
                path: '/services/apexrest/Progress/UpdateProgress/',
                data: data
            };
        force.apexrest(request, sections.getSectionsFromSFDC, store.error);
    }
    else {
        sections.getSectionsFromSFDC();
    }
}

// Fetch the sections from Salesforce
Sections.prototype.getSectionsFromSFDC = function() {
    myApp.showPreloader('Downloading sections');
    
    navigator.smartstore.clearSoup('sections', sections.querySections, self.error);
}

// executes a SOQL query on the Salesforce server to retrieve the secions
Sections.prototype.querySections = function() {
    var soql = 'SELECT Id, Name, Description_Short__c, Description_Long__c, Complete__c, Completed_Time__c, ' +
        ' (select Id, Name, Title__c, Detail__c, Complete__c, Started_Time__c, Completed_Time__c, ' +
        '  Question_1__c, Question_1_Option_a__c, Question_1_Option_b__c, ' +
        '  Question_1_Option_c__c, Question_1_Option_d__c, Question_1_Correct_Answer__c, ' +
        '  Question_2__c, Question_2_Option_a__c, Question_2_Option_b__c, ' +
        '  Question_2_Option_c__c, Question_2_Option_d__c, Question_2_Correct_Answer__c, ' +
        '  Question_3__c, Question_3_Option_a__c, Question_3_Option_b__c, ' +
        '  Question_3_Option_c__c, Question_3_Option_d__c, Question_3_Correct_Answer__c ' +
        'FROM Pages__r ORDER BY Index__c ASC) From section__c ORDER BY Name ASC LIMIT 10';
    force.query(soql, sections.queriedSections, store.error);
}

// Callback executed when the SOQL query has completed
Sections.prototype.queriedSections=function(result) {
    var recs=result.records;
    for (var idx=0; idx<recs.length; idx++) {
        recs[idx].isDirty=false;
    }
    myApp.hidePreloader();
    navigator.smartstore.upsertSoupEntries('sections', recs,
                                           sections.retrievedSections,
                                           store.error);
        
}

// method invoked by the onclick handler for a question answer option
Sections.prototype.answerClicked = function(qIdx, aIdx) {
    console.log('Looking for answer ' + qIdx + ':' + aIdx);
    var listItems=$$('#question' + qIdx + 'Answers li');
    console.log('List items = ' + JSON.stringify(listItems, null, 4));
    var candIdx=0;
    listItems.each(function(idx, li) {
                   var answer = $$(li);
                   console.log('Considering ' + candIdx + ' against ' + aIdx);
                   if (candIdx==aIdx) {
                        console.log('Found - adding class');
                        answer.addClass('bg-lightblue');
                   }
                   else {
                        console.log('Nope - removing class');
                        answer.removeClass('bg-lightblue');
                   }
                   // remove any error/success class that may have been added
                   answer.removeClass('bg-green').removeClass('bg-red');
                   candIdx++;
                });
    sections.enableButtonIfAllAnswered();
}

// enables the 'check' button if the user has selected answers to all questions
Sections.prototype.enableButtonIfAllAnswered=function() {
    var allAnswered=true;
    for (var qIdx=1; qIdx<=5; qIdx++) {
        if ($$('#question' + qIdx + 'Answers').length>0) {
            var listItems=$$('#question' + qIdx + 'Answers li');
            console.log('List items = ' + JSON.stringify(listItems, null, 4));
            var answered=false;
            listItems.each(function(idx, li) {
                           var answer = $$(li);
                           if (answer.hasClass('bg-lightblue')) {
                            answered=true;
                           }
                        });
            allAnswered&=answered;
        }
    }
    
    if (allAnswered) {
        $$('#checkBtn').removeClass('disabled');
    }
}

// function invoked by the onclick handler of the check
Sections.prototype.checkAnswers=function(sectionId, pageId) {
    sections.querySectionById(sectionId, function(cursor) {sections.checkAnswersForSection(cursor, pageId);});
}

// callback invokved when the section whose answers are to be checked is retrieved from the smartstore
Sections.prototype.checkAnswersForSection = function(cursor, pageId) {
    var entries=cursor.currentPageOrderedEntries;
    if (entries.length>0) {
        var errorCount=0;
        var section=entries[0];
        var page=null;
        // alert('Checking values for section ' + section.Id + ' and page ' + pageId);
        for (var pIdx=0; pIdx<section.Pages__r.records.length; pIdx++) {
            var cand=section.Pages__r.records[pIdx];
            if (cand.Id==pageId) {
                page=cand;
                break;
            }
        }
        
        for (var qIdx=1; qIdx<=5; qIdx++) {
            if ($$('#question' + qIdx + 'Answers').length>0) {
                // we have a question. Get the chosen answer
                var listItems=$$('#question' + qIdx + 'Answers li');
                var answerIdx=-1;
                listItems.each(function(idx, li) {
                                    var answer = $$(li);
                                    if (answer.hasClass('bg-lightblue')) {
                                        answerIdx=idx;
                                    }
                                });
                
                var candCh=sections.aTOe[answerIdx];
                if (candCh==page['Question_' + qIdx + '_Correct_Answer__c']) {
                    listItems.eq(answerIdx).addClass('bg-green');
                }
                else {
                    listItems.eq(answerIdx).addClass('bg-red');
                    errorCount++;
                }
            }
        }
        if (errorCount>0) {
            $$('#checkMessage').html('<p class="color-red"><strong>You got ' + errorCount + ' answer(s) wrong - please try again</strong></p>');
        }
        else {
            $$('#checkMessage').html('');
            page.Complete__c=true;
            page.Completed_Time__c=new Date();
            
            // is the section completed?
            var allComplete=true;
            for (var idx=0; idx<section.Pages__r.records.length; idx++) {
                var cand=section.Pages__r.records[idx];
                allComplete&=cand.Complete__c;
            }
            if (allComplete) {
                section.Complete__c=true;
                section.Completed_Time__c=new Date();
            }
            sections.updateSection(section);
            sections.outputSectionDetails(section);
            sections.showCompletedPage(section, page);
        }
    }
}

var sections=new Sections();
