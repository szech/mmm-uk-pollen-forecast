const request = require('postman-request');
const NodeHelper = require("node_helper");
const cheerio = require("cheerio");
const fs = require('fs');
const del = require('del');

module.exports = NodeHelper.create({
    
    start: function() {
        console.log("Starting node helper: " + this.name);
    },
    
    
    socketNotificationReceived: function(notification, payload) {
        var self = this;
        
        console.log("uk-pollen-forecast -> Notification: ", notification,  " Payload: ", payload);
        console.log("payload.config.region:", payload.config.region);
        
        const region = payload.config.region;
        const show_forecast_text = payload.config.show_forecast_text;
        const show_forecast_last_issued_text = payload.config.show_forecast_last_issued_text;

        if(notification === "GET_POLLEN_DATA") {
            
            const url = "https://weather.metoffice.gov.uk/warnings-and-advice/seasonal-advice/pollen-forecast";
                        
            console.log('-> uk-pollen-forecast request -> ' + url);
            
            request({
                method: 'GET',
                url: url,
                secureProtocol: 'TLSv1_2_method',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1'
                },
            }, (err, res, body) => {
            
                if (err) return console.error(err);

                // console.log('pollen forecast request body:', body); // uncomment for debugging
                
                // parse
                const $ = cheerio.load(body);


                // console.log('cheerio body:', body); // uncomment for debugging

                
                // we just need to extract the html for the supplied region...

                const forecast_heading = $('#'+region + " h3.region-heading");
                const forecast_table = $('#'+region + " table");
                var forecast_text = '';
                var forecast_issued_text = '';

                if(show_forecast_text == 'true') {
                    forecast_text = $("#"+region+"-paras");
                }
                
                if(show_forecast_last_issued_text == 'true') {
                    forecast_issued_text = $('#'+region+" .last-issued");
                }
                
                
                // ... and write it out into a temp file
                const html_dump = forecast_heading + forecast_table + forecast_text + forecast_issued_text;
                // console.log('pollen forecast returned:', html_dump); // uncomment for debugging
                
                console.log('Current directory: ', process.cwd());

                const cacheDirectory = process.cwd() + "/modules/" + this.name + "/cache/";
                const filename = new Date().getTime() + '.html';
                const payload_filepath = cacheDirectory + filename;
                const oldFiles = cacheDirectory + '*.html';
                
                
                if(self.writeHtmlFile(payload_filepath, html_dump)){
                    self.sendSocketNotification("ACHHOOOOO", filename);
                    console.log('<- pollen data gathering success!');
                    
                    // tidy up any old data
                    del([oldFiles, '!'+payload_filepath]);
                }
                else {
                    console.log('***  pollen data gathering failed! :( ');
                }
                
                
            });
            
        }
    },

                
    
    
    writeHtmlFile: function(path, data){
        
        console.log("writing pollen data file....");
        var stream = fs.createWriteStream(path);
        stream.once('open', function(fd) {
            stream.end(data);
        }); 
        return true;
   },
    
    
});


    