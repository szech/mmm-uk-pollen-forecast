Module.register("mmm-uk-pollen-forecast", {

    // Default module config.
    defaults: {
        updateIntervalHours : 2, // minimum is 0.25
        region: 'se',   // region, required
        first_display_date: '01-MAR',   // optional
        last_display_date:  '01-SEP'  // optional
    },
    
    // Define required scripts.
    getScripts: function() {
        return ["buffer.js"];
    },


    start: function() {
        Log.info(this.config);
        Log.info("Starting module: " + this.name);

        this.getPollen();
        
        self = this;
        if(self.config.updateIntervalHours < 0.25) {
            self.config.updateIntervalHours = 0.25;
        }            
        
        setInterval(function() {
            self.getPollen();
        }, self.config.updateIntervalHours * 3600000 );
    },

    // Define required scripts.
    getScripts: function() {
        return [];
    },

    getStyles: function() {
        return ["pollen-forecast.css", "pollen-forecast-icons.css"];
    },

    getPollen: function() {
        Log.info("mmm-uk-pollen-forecast: Getting allergies.");
        this.sendSocketNotification("GET_POLLEN_DATA", {
            config: this.config
        });
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

            // add a line break to forecast text
            var forecast = wrapper.getElementsByTagName("p")[0];
            forecast.innerHTML=forecast.childNodes[0].nodeValue.replace("Other allergens", "<br>Other allergens");




        }

        return wrapper;
    },

    fetchHtmlAsText: async function (url) {
        const response = await fetch(url);
        return await response.text();
    }


});