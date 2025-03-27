Module.register("mmm-uk-pollen-forecast", {

    // Default module config.
    defaults: {
        update_interval_hours : 2,          // minimum is 0.25
        region: 'se',                       // region, required
        first_display_date_DD_MM: '01-03',  // optional, show the calendar between particular days
                                            // format: DD-MM, e.g. 01-03 ==> display from 1st March 
        last_display_date_DD_MM:  '01-09',  // optional
                                            // format: DD-MM, e.g. 01-09 ==> hide after 1st September
                                            // special cases: '' or 'always' will always show the module 
        days_to_show:   5,                  // optional, choose how many forecast days to show. range is 0 - 5, where 
                                            // 0 ==> no icons, 5 ==> 5 icons. default is 5. min is 0, max is 5.
        show_forecast_text: 'true',         // show the forecast text. optional. default is true.
        show_forecast_last_issued_text: 'true'  // show when the forecast was last issued. optional. default is true.
 
    },
    
    // Define required scripts.
    getScripts: function() {
        return ["buffer.js, moment.js"];
    },


    start: function() {
        Log.info("Starting module: " + this.name);
        Log.info(this.name, ' config: ',  this.config);

        // days to show range
        if(self.config.days_to_show < 0) {
            self.config.days_to_show = 0;
        }
        if(self.config.days_to_show > 5 ) {
            self.config.days_to_show = 5;
        }


        this.getPollen();
        
        self = this;
        if(self.config.update_interval_hours < 0.25) {
            self.config.update_interval_hours = 0.25;
        }            
        
        setInterval(function() {
            self.getPollen();
        }, self.config.update_interval_hours * 3600000 );
    },

    // Define required scripts.
    getScripts: function() {
        return [];
    },

    getStyles: function() {
        return ["pollen-forecast.css", "pollen-forecast-icons.css"];
    },

    getPollen: function() {
        self = this;
        if(self.moduleIsVisible() ==  false) {
            this.hide();
            return;
        } else {    
            this.show();
            Log.info("mmm-uk-pollen-forecast: Getting allergies.");
            this.sendSocketNotification("GET_POLLEN_DATA", {
                config: this.config
            });
        }
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "ACHHOOOOO") {
            self = this;
            this.srcHtml = payload;
            Log.info("pollen data gathering: ", payload); 
            
            
            if (typeof this.srcHtml !== "undefined") {
                this.loaded = true;
                this.updateDom();
            }
            
        }
    },
    

    // Override dom generator.
    getDom: async function() {
        var wrapper = document.createElement("div");
        wrapper.className = "pollen-container";
        

        if (typeof this.srcHtml !== "undefined") {
            // load the html we scraped :)
            wrapper.innerHTML = await this.fetchHtmlAsText('/modules/mmm-uk-pollen-forecast/cache/' +  this.srcHtml);

            // fiddle it
            
            // add some header text
            var region_heading = wrapper.getElementsByClassName("region-heading")[0];
            region_heading.insertAdjacentHTML('afterbegin', "Pollen forecast for ");
            
            // make header look like a magic mirror header
            region_heading.classList.add("module-header");
            var new_header = document.createElement('header');
            new_header.innerHTML = region_heading.innerHTML;
            region_heading.parentNode.replaceChild(new_header, region_heading);

            // add line breaks to forecast text
            if(self.config.show_forecast_text) {
                var forecast = wrapper?.getElementsByTagName("p")?.[0] || null;
                if (forecast != null) {
                    forecast.innerHTML=forecast.childNodes[0].nodeValue.replace(new RegExp('\\. ', 'g'), '. <br>');
                }
            }

            // remove forecast icons if required
            this.fiddleForecastTable(wrapper);

        }

        return wrapper;
    },

    
    fetchHtmlAsText: async function (url) {
        const response = await fetch(url);
        return await response.text();
    },


    fiddleForecastTable: function(wrapper){
        self = this;

        const days_to_show = self.config.days_to_show;

        if(days_to_show == 5) { // do nothing
            return;
        }

        var forecast_th = wrapper.getElementsByTagName("thead")[0].firstElementChild;
        var forecast_tr = wrapper.getElementsByTagName("tbody")[0].firstElementChild;
        
        for(i = days_to_show; i < 5 ; i++) { // remove unwanted days
            forecast_th.removeChild(forecast_th.lastElementChild);
            forecast_tr.removeChild(forecast_tr.lastElementChild);
        }

    },



    moduleIsVisible: function () {
        self = this;
        
        if(self.config.first_display_date_DD_MM == 'always' || self.config.first_display_date_DD_MM == '' ) {
            return true;
        }
        if(self.config.last_display_date_DD_MM == 'always' || self.config.last_display_date_DD_MM == '' ) {
            return true;
        }
        
        var now = moment();
        var firstDay = moment(self.config.first_display_date_DD_MM + "-" + now.year().toString(), "DD-MM-YYYY");
        var lastDay = moment(self.config.last_display_date_DD_MM +  "-" + now.year().toString(), "DD-MM-YYYY");

        return now.isBetween(firstDay, lastDay, 'days', '[]');

    },


});
