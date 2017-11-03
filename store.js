/**
 *
 * Object providing convenience functions for managing a smartstore
 *
 */
function Store()
{
    console.log('Instantiated store');
}

// Waits until the smartstore is available
Store.prototype.setupStore=function(success)
{
    console.log('setting up store');
    var self=this;
    if (!navigator.smartstore) {
        console.log('Smartstore undefined - trying again in 2 seconds');
        var self=this;
        setTimeout(function() { self.setupStore(success); }, 2000);
        return;
    }
    else {
        success();
    }
}

// creates a Salesforce record soup with the supplied name in the store,
// with Id and Name indexes
Store.prototype.createSoup=function(name, success)
{
    var indexSpecs=[
                    {"path":"Name", "type":"string"},
                    {"path":"Id","type":"string"}
                    ];
    
    var self=this;
    navigator.smartstore.registerSoup(name, indexSpecs, success, self.error)
}

// Generic error callback method - simply raises an alert
Store.prototype.error = function(err) {
    alert('Smart store operation failed with ' + err);
}


Store.prototype.getSmartstore = function (success) {
    return navigator.smartstore;
}

