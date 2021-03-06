/*global $, L, window*/
(function () {
    "use strict";
    var myMarkers = {},
        circlesLayer = new L.LayerGroup(),
        stationData = [],
        dataCnt = 0,
        myMap = L.map('mapid').setView([53.343, -6.27], 14);

    L.tileLayer('https://api.mapbox.com/styles/v1/jonathanbyrn/cityo3dd800da2iqi95gvn64r/tiles/256/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1Ijoiam9uYXRoYW5ieXJuIiwiYSI6ImNpZ2RsZ3NrZDJiYm50ZG02eTNhNGt2OGEifQ.-LjytHg0DAfmQnhUrIh_mA'
    }).addTo(myMap);
    circlesLayer.addTo(myMap);


    function myMarker(options) {
        if (typeof options === 'undefined') {
            var options = {};
        }
        this.name = options.name || '';
        this.fillOpacity = options.fillOpacity || 0.5;
        this.latitude = options.lat || 0;
        this.longitude = options.lng || 0;
        this.number = options.number || 0;
        this.free_bikes = options.free_bikes || 0;
        this.empty_slots = options.empty_slots || 0;
        this.radius = options.radius || 50;
        this._label = options.label || '';

        myMarkers[this.name] = this;

        //enable function chaining
        return this;
    }

    myMarker.prototype.leafletAdapter = function () {
        return [
            [this.latitude, this.longitude],
            this.radius, {
                color: this.color,
                fillColor: this.fillColor,
                fillOpacity: this.opacity
            }
        ];
    };

    myMarker.prototype.getLabel = function () {
        return this._label;
    };

    myMarker.prototype.setColor = function() {
        this.radius = 20 + (2 * this.free_bikes);

        if (this.empty_slots === 0) {
            this.fillColor = 'blue';
            this.color = 'blue';
        } else if (this.empty_slots < 5) {
            this.fillColor = 'RoyalBlue';
            this.color = 'RoyalBlue';
        } else if (this.free_bikes === 0) {
            this.fillColor = 'red';
            this.color = 'red';
        } else if (this.free_bikes < 5) {
            this.fillColor = 'orange';
            this.color = 'orange';
        } else {
            this.fillColor = 'green';
            this.color = 'green';
        }
        //enable function chaining
        return this;
    };

    myMarker.prototype.addToMap = function() {
        var circle = L.circle.apply(this, this.leafletAdapter())
            .bindPopup(this.getLabel());
        circlesLayer.addLayer(circle);
    };

    myMarker.prototype.setLabel = function () {
        this._label = this.name + "<br/>Bikes: " + this.free_bikes + "<br/>Free:" + this.empty_slots;
        //enable function chaining
        return this;
    };

    function drawStation(station) {
        var marker = new myMarker(station)
            .setColor()
            .setLabel()
            .addToMap();
    }


    function drawStations(stations) {
        var key,
            data;
        for (key in stations) {
            data = {
                "name": key,
                "lat": stations[key].lat,
                "lng": stations[key].lng
            };
            drawStation(data);
        }
    }

    function drawNextLayer() {
        var key,
            newstat,
            currentStations,
            time,
            res;

        if (dataCnt < stationData.length) {
            circlesLayer.clearLayers();
            time = stationData[dataCnt][0];
            res = time.split("T");
            $('#timeTitle').text("Date: " + res[0] + " Time: " + res[1]);
            currentStations = stationData[dataCnt][1];
            for (key in currentStations) {
                newstat = myMarkers[key];
                newstat.free_bikes = currentStations[key][0];
                newstat.empty_slots = currentStations[key][1];
                newstat.setLabel()
                    .setColor()
                    .addToMap();
            }
            dataCnt += 1;
        }
    }

    function readData(data) {
        stationData = data;
        window.setInterval(function () {
            drawNextLayer();
        }, 50);

    }

    function getData() {
        $.ajax({
            url: 'http://localhost:8080/stationcoords.json',
            //url: 'http://www.jonathan-byrne.com/bikeflow/stationcoords.json',
            dataType: 'json',
            success: function (response) {
                drawStations(response);
            }
        });
        $.ajax({
            url: 'http://localhost:8080/stationdata.json',
            //url: 'http://www.jonathan-byrne.com/bikeflow/stationdata.json',
            dataType: 'json',
            success: function (response) {
                readData(response);
            }
        });
    }


    $(document).on('ready', getData);

    $("button").click(function() {
        dataCnt = 0;
    });
})();
