var pushNotification = function(data) {
    var headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": "Basic NWMyMDVkY2QtMTRmZS00NDA2LThkMDAtMzliYTUxZmE3MjBm"
    };
    
    var options = {
      host: "onesignal.com",
      port: 443,
      path: "/api/v1/notifications",
      method: "POST",
      headers: headers
    };
    
    var https = require('https');
    var req = https.request(options, function(res) {  
      res.on('data', function(data) {
        console.log("Response:");
        console.log(JSON.parse(data));
      });
    });
    
    req.on('error', function(e) {
      console.log("ERROR:");
      console.log(e);
    });
    
    req.write(JSON.stringify(data));
    req.end();
  };
  
//   var message = { 
//     app_id: "5eb5a37e-b458-11e3-ac11-000c2940e62c",
//     contents: {"en": "English Message"},
//     included_segments: ["Subscribed Users"]
//   };
  
//   pushNotification(message);

module.exports = pushNotification