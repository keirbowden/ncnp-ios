function Main()
{
    console.log('Instantiated main class');
    /* Do login */
    force.login(
                function() {
                console.log("Auth succeeded");
                //showUsersList();
                main.initialise();
                },
                function(error) {
                console.log("Auth failed: " + error);
                }
                );
    
}

Main.prototype.initialise=function() {
        try
        {
            // Initialize app
            myApp = new Framework7();
            
            // If we need to use custom DOM library, let's save it to $$ variable:
            $$ = Dom7;
            
            myApp.showPreloader('Setting up store');
            
            // Add view
            mainView = myApp.addView('.view-main', {
                                     // Because we want to use dynamic navbar, we need to enable it for this view:
                                     dynamicNavbar: true,
                                     // Enable Dom Cache so we can use all inline pages
                                     domCache: true
                                     });
            
            store=new Store();
            store.setupStore(main.storeCreated);
        }
        catch (e)
        {
            console.log(e);
            alert('exception ' + e + ', stack = ' + e.stack);
        }
}

Main.prototype.storeCreated=function() {
    console.log('Store created!');
    store.createSoup('sections', main.soupCreated);
}

Main.prototype.soupCreated = function() {
    console.log('Soup created');
    myApp.hidePreloader();
    var title='Snail Bed';
    $$('#appTitle').html(title);
    
    sections = new Sections(store);
    sections.list();
}


