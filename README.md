# ncnp-ios

## Setup Instructions

1. Setup the Salesforce instance as per : https://github.com/keirbowden/ncnp-sfdc/blob/master/README
2. Install mobile SDK 5.2
3. Execute `forceios create` and replace the Name onwards with your own choice of parameters:

   Type : hybrid_local

   Name : DF17

   Company: com.brightgen

   Organization : BrightGen

   Output directory : Default      
4. Execute `cd DF17` (or whatever directory you supplied for the Name parameter above)

5. Copy the repo contents into directory `DF17/www` 

6. Execute `cordova prepare` 

7. In Xcode open `DF17/platforms/ios/DF17.xcodeproj`

Note you will need to set up a provisioning profile for signing - see https://developer.apple.com/library/content/qa/qa1814/_index.html
