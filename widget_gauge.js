var Modul_gauge = function () {

	/* parameters
		<!-- generic parameter -->
		data-type = "gauge"
		data-view = "hygrometer|barometer|clock|anemometer"
		data-size = "300"
		data-pointer-speed = "20" <!-- as higher as slower -->
		data-pointer-widths = '["0.0","6"]'
		data-pointer-lengths = '["370.0","370.0"]'
		data-pointer-colors = '["#000000","#000000","red"]'
        data-color-outerborder = "#000000"
        data-color-innerborder = "#000000"
        data-color-background = "#000000"
        data-color-scale = "#000000"
		data-color-pointer = "#000000"

		<!-- hygrometer parameter -->
        data-get-temperature = "<Device>:<Reading>"
        data-get-humidity = "<Device>:<Reading>"
		data-show-devpoint = "0|1"

		<!-- barometer parameter -->
		data-baro-show-value = "0|1"
		data-baro-icon-opacity = "0-100"
		data-baro-history = "2" <!-- hours back -->
		data-get-pressure = "<Device>:<Reading>"

		<!-- anemometer parameter -->
		data-get-wind-speed = "<Device>:<Reading>"
		data-get-wind-direction = "<Device>:<Reading>"
		data-wind-unit = "km/h"

		<!-- clock parameter -->
		data-clock-timezone = "0"
		data-color-sec-pointer = "#000000"

    */

    var items = [];
    var cache;

    function init() {

        console.log("init widget");
        me.elements = $('div[data-type="' + me.widgetname + '"]', me.area);
        me.elements.each(function (index) {

            cache = JSON.parse(localStorage.getItem('gauge_items'));

            items.push({ myID: uuidv4() })
            items[index].idx = index;
            items[index].oldvalues = {};
            var elem = $(this);

            // init view
            elem.initData('view', 'hygrometer');
            items[index].view = elem.data('view');
            var gauge = new Gauges(items[index].myID);
            $(gauge.getSVG(elem.data('view'))).appendTo(elem);
            var svgobj = document.getElementById(items[index].myID);
            items[index].svgobj = svgobj

            // size
            elem.initData('size', '500');
            svgobj.setAttribute("width", elem.data('size'));
            svgobj.setAttribute("height", elem.data('size'));

            // colors
            elem.initData('color-outerborder', '#bfc1c2');
            elem.initData('color-background', 'whitesmoke');
            elem.initData('color-innerborder', '#d8d8d8');
            elem.initData('color-scale', 'black');
            elem.initData('color-pointer', 'orangered');

            // set some generic variables
            items[index].firstupdate = true;
            elem.initData('pointer-speed', '20');
            items[index].pointerspeed = parseInt(elem.data('pointer-speed'));

            elem.initData('pointer-widths', '');
            items[index].pointerwidths = (elem.data('pointer-widths') != "") ? elem.data('pointer-widths') : [];

            elem.initData('pointer-lengths', '');
            items[index].pointerlengths = (elem.data('pointer-lengths') != "") ? elem.data('pointer-lengths') : []

            elem.initData('pointer-colors', '');
            items[index].pointercolors = (elem.data('pointer-colors') != "") ? elem.data('pointer-colors') : []

            elem.initData('text-sizes', '');
            items[index].textsizes = (elem.data('text-sizes') != "") ? elem.data('text-sizes') : []

            console.log(items[index].pointerwidths)
            console.log(items[index].pointerlengths)

            if (elem.data('view') == "hygrometer") {


                items[index].temperature = 0;
                items[index].humidity = 0;
                items[index].oldTemp = 0;
                items[index].newTemp = 0;
                items[index].oldHum = 0;
                items[index].newHum = 0;
                items[index].animation_PO1_lock = false;
                items[index].animation_PO2_lock = false;


                svgobj.getElementById("hygro_PO1_animation").addEventListener('endEvent', function (evt) {
                    items[index].animation_PO1_lock = false;
                }, false);
                svgobj.getElementById("hygro_PO2_animation").addEventListener('endEvent', function (evt) {
                    items[index].animation_PO2_lock = false;
                }, false);

                svgobj.getElementById("hygro_border_outer").setAttribute("stroke", elem.data('color-outerborder'))
                svgobj.getElementById("hygro_border_outer").setAttribute("fill", elem.data('color-background'))
                svgobj.getElementById("hygro_border_inner").setAttribute("stroke", elem.data('color-innerborder'))
                svgobj.getElementById("M1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("L1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("MM1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("M2").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("L2").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("numbers").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("numbers").setAttribute("fill", elem.data('color-scale'));
                svgobj.getElementById("devpoint").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("devpoint").setAttribute("fill", elem.data('color-scale'));

                setFontSizes(index, 1, "devpoint");
                setPointerSizes(index, 1, "PO1_line");

                svgobj.getElementById("PO1_line").setAttribute("stroke", elem.data('color-pointer'));
                svgobj.getElementById("PO1_rect").setAttribute("fill", elem.data('color-pointer'));

                setPointerSizes(index, 2, "PO2_line");

                svgobj.getElementById("PO2_line").setAttribute("stroke", elem.data('color-pointer'));
                svgobj.getElementById("PO2_rect").setAttribute("fill", elem.data('color-pointer'));

                // init temperature and humidity
                elem.initData('get-temperature', '0.00');
                elem.initData('get-humidity', '0.00');

                // show or hide Deviation point - only set on init
                elem.initData('show-devpoint', '0');
                var val = parseInt(elem.data('show-devpoint'));
                showDevpoint(index, val);

                // Device reading for temperature
                if (elem.isDeviceReading('get-temperature')) {
                    me.addReading(elem, 'get-temperature');
                }

                // Device reading for humidity
                if (elem.isDeviceReading('get-humidity')) {
                    me.addReading(elem, 'get-humidity');
                }

            }

            if (elem.data('view') == "barometer") {


                items[index].lasthour = cache ? cache[index].lasthour : new Date().getHours();
                items[index].pressure = 0;
                items[index].oldPres = 0;
                items[index].newPres = 0;
                items[index].oldFixPres = 0;
                items[index].presHist = cache ? cache[index].presHist : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                items[index].animation_PO1_lock = false;


                svgobj.getElementById("baro_PO1_animation").addEventListener('endEvent', function (evt) {
                    items[index].animation_PO1_lock = false;
                }, false);

                svgobj.getElementById("baro_border_outer").setAttribute("stroke", elem.data('color-outerborder'))
                svgobj.getElementById("baro_border_outer").setAttribute("fill", elem.data('color-background'))
                svgobj.getElementById("baro_border_inner").setAttribute("stroke", elem.data('color-innerborder'))
                svgobj.getElementById("baroM1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("baroL1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("baroMM1").setAttribute("stroke", elem.data('color-scale'));
                ["baroT1", "baroT2", "baroT3", "baroT4", "baroT5", "baroT6", "baroT7", "baroT8", "baroT9", "baroT10", "baroT11", "baroT12"].forEach(function (item) {
                    svgobj.getElementById(item).setAttribute("stroke", elem.data('color-scale'))
                    svgobj.getElementById(item).setAttribute("fill", elem.data('color-scale'))
                });

                svgobj.getElementById("baro_icon_rainy").setAttribute("fill", elem.data('color-scale'));
                svgobj.getElementById("baro_icon_medium").setAttribute("fill", elem.data('color-scale'));
                svgobj.getElementById("baro_icon_sunny").setAttribute("fill", elem.data('color-scale'));
                svgobj.getElementById("baro_txtvalue").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("baro_txtvalue").setAttribute("fill", elem.data('color-scale'));

                setFontSizes(index, 1, "baro_txtvalue");
                setPointerSizes(index, 1, "baroPO1_line");

                svgobj.getElementById("baroPO1_line").setAttribute("stroke", elem.data('color-pointer'));
                svgobj.getElementById("baroPO1_rect").setAttribute("fill", elem.data('color-pointer'));

                // Device reading for pressure
                if (elem.isDeviceReading('get-pressure')) {
                    me.addReading(elem, 'get-pressure');
                }

                elem.initData('baro-history', '2');
                items[index].barohistory = parseInt(elem.data('baro-history'));

                elem.initData('baro-show-value', '0');
                var val = parseInt(elem.data('baro-show-value'));
                showBaroValue(index, val);

                elem.initData('baro-icon-opacity', '100');
                var opacity = parseFloat(elem.data('baro-icon-opacity')) / 100
                svgobj.getElementById("baro_icon_rainy").setAttribute("fill-opacity", opacity);
                svgobj.getElementById("baro_icon_medium").setAttribute("fill-opacity", opacity);
                svgobj.getElementById("baro_icon_sunny").setAttribute("fill-opacity", opacity);
            }

            if (elem.data('view') == "clock") {
                elem.initData('clock-timezone', '0');
                elem.initData('color-sec-pointer', 'red');

                svgobj.getElementById("clock_border_outer").setAttribute("stroke", elem.data('color-outerborder'))
                svgobj.getElementById("clock_border_outer").setAttribute("fill", elem.data('color-background'))
                svgobj.getElementById("clock_border_inner").setAttribute("stroke", elem.data('color-innerborder'))
                svgobj.getElementById("clock_M1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("clock_L1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("clock_MM1").setAttribute("stroke", elem.data('color-scale'));
                setPointerSizes(index, 1, "clock_PO1_line");
                setPointerColors(index, 1, "clock_PO1_line", "stroke");
                setPointerSizes(index, 2, "clock_PO2_line");
                setPointerColors(index, 2, "clock_PO2_line", "stroke");
                setPointerSizes(index, 3, "clock_PO3_line");
                setPointerColors(index, 3, "clock_PO3_line", "stroke");

                clockinterval = setInterval(function () {
                    var time = new Date();
                    var PO3 = document.getElementById("clock_PO3a");
                    var seconds = time.getSeconds()
                    var secstep = seconds * 6
                    PO3.setAttribute("transform", "rotate(" + (secstep + 180) + ",275,275)");

                    var PO2 = document.getElementById("clock_PO2a");
                    var minutes = time.getMinutes();
                    var minstep = ((minutes * 60) + seconds) * 0.1;
                    PO2.setAttribute("transform", "rotate(" + (minstep + 180) + ",275,275)");

                    var timezone = parseInt(elem.data('clock-timezone'));
                    var hour = time.getHours() + timezone; // add tz setting
                    hour = hour > 23 ? hour - 23 : hour; // could be generate a day change
                    var PO1 = document.getElementById("clock_PO1a");
                    hour = hour > 12 ? hour - 12 : hour; // 24h -> 12h
                    var hourminutes = (hour * 60) + minutes
                    var hourstep = hourminutes / 2;
                    PO1.setAttribute("transform", "rotate(" + (hourstep + 180) + ",275,275)");
                }, 1000)

            }

            if (elem.data('view') == "anemometer") {

                items[index].windspeed = 0;
                items[index].oldSpeed = 0;
                items[index].newSpeed = 0;
                items[index].oldAngle = 0;
                items[index].newAngle = 0;
                items[index].animation_speed_lock = false;
                items[index].animation_dir_lock = false;

                svgobj.getElementById("anemometer_PO1_animation").addEventListener('endEvent', function (evt) {
                    items[index].animation_speed_lock = false;
                }, false);

                svgobj.getElementById("anemometer_PO2_animation").addEventListener('endEvent', function (evt) {
                    items[index].animation_dir_lock = false;
                }, false);

                elem.initData('wind-unit', 'km/h');
                items[index].wind_unit = elem.data('wind-unit');

                svgobj.getElementById("anemometer_border_outer").setAttribute("stroke", elem.data('color-outerborder'));
                svgobj.getElementById("anemometer_border_outer").setAttribute("fill", elem.data('color-background'));
                svgobj.getElementById("anemometer_border_inner").setAttribute("stroke", elem.data('color-innerborder'));
                svgobj.getElementById("anemometer_dir_M1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("anemometer_dir_L1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("anemometer_spd_MM1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("anemometer_spd_M1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("anemometer_spd_L1").setAttribute("stroke", elem.data('color-scale'));

                ["anemometer_txt_T1", "anemometer_txt_T2", "anemometer_txt_T3", "anemometer_txt_T4", "anemometer_txt_T5", "anemometer_txt_T6",
                    "anemometer_txt_T7", "anemometer_txt_T8", "anemometer_txt_T9", "anemometer_txt_T10", "anemometer_txt_T11", "anemometer_txt_T12",
                    , "anemometer_txt_T13", "anemometer_txt_T14", "anemometer_txt_T15", "anemometer_txt_T16", "anemometer_txt_T17", "anemometer_txt_T18"].forEach(function (item) {
                        svgobj.getElementById(item).setAttribute("stroke", elem.data('color-scale'));
                        svgobj.getElementById(item).setAttribute("fill", elem.data('color-scale'));
                    });
                svgobj.getElementById("anemometer_txt_value").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("anemometer_txt_value").setAttribute("fill", elem.data('color-scale'));

                setFontSizes(index, 1, "anemometer_txt_value_style");
                setPointerSizes(index, 1, "anemometer_PO1_line");

                svgobj.getElementById("anemometer_PO1_line").setAttribute("stroke", elem.data('color-pointer'));
                svgobj.getElementById("anemometer_PO2_polygon").setAttribute("fill", elem.data('color-pointer'));

                // Device reading for windspeed
                if (elem.isDeviceReading('get-wind-speed')) {
                    me.addReading(elem, 'get-wind-speed');
                }

                // Device reading for winddirection
                if (elem.isDeviceReading('get-wind-direction')) {
                    me.addReading(elem, 'get-wind-direction');
                }

            }

            if (elem.data('view') == "photovoltaic") {


                items[index].generation = 0;
                items[index].consumption = 0;
                items[index].soc = 0;
                items[index].oldGen = 0;
                items[index].newGen = 0;
                items[index].oldCon = 0;
                items[index].newCon = 0;
                items[index].oldSoc = 0;
                items[index].newSoc = 0;
                items[index].hasBat = false;
                items[index].hasStat = false;
                items[index].spinnerpos = 0;
                items[index].animation_PO2_lock = false;


                svgobj.getElementById("pv_PO2_animation").addEventListener('endEvent', function (evt) {
                    items[index].animation_PO2_lock = false;
                }, false);

                // Device reading for generation
                if (elem.isDeviceReading('get-pv-generation')) {
                    me.addReading(elem, 'get-pv-generation');
                }

                // Device reading for consumption
                if (elem.isDeviceReading('get-pv-consumption')) {
                    me.addReading(elem, 'get-pv-consumption');
                }

                // Device reading for consumption
                if (elem.isDeviceReading('get-pv-soc')) {
                    me.addReading(elem, 'get-pv-soc');
                    items[index].hasBat = true;
                }

                // Device reading for consumption
                if (elem.isDeviceReading('get-pv-batstate')) {
                    me.addReading(elem, 'get-pv-batstate');
                    items[index].hasStat = true;
                }

                svgobj.getElementById("pv_border_outer").setAttribute("stroke", elem.data('color-outerborder'));
                svgobj.getElementById("pv_border_outer").setAttribute("fill", elem.data('color-background'));
                svgobj.getElementById("pv_border_inner").setAttribute("stroke", elem.data('color-innerborder'));
                svgobj.getElementById("pv_spd_MM1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("pv_spd_MM1").setAttribute("fill", elem.data('color-scale'));
                svgobj.getElementById("pv_spd_M1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("pv_spd_M1").setAttribute("fill", elem.data('color-scale'));
                svgobj.getElementById("pv_spd_L1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("pv_spd_L1").setAttribute("fill", elem.data('color-scale'));

                ["pv_txt_T1", "pv_txt_T2", "pv_txt_T3", "pv_txt_T4", "pv_txt_T5", "pv_txt_T6",
                    "pv_txt_T7", "pv_txt_T8", "pv_txt_T9", "pv_txt_T10", "pv_txt_T11", "pv_txt_T12",
                    , "pv_txt_T13", "pv_txt_T14"].forEach(function (item) {
                        svgobj.getElementById(item).setAttribute("stroke", elem.data('color-scale'));
                        svgobj.getElementById(item).setAttribute("fill", elem.data('color-scale'));
                    });
                svgobj.getElementById("pv_txt_value").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("pv_txt_value").setAttribute("fill", elem.data('color-scale'));
                svgobj.getElementById("pv_txt_charge").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("pv_txt_charge").setAttribute("fill", elem.data('color-scale'));
                svgobj.getElementById("pv_txt_consumption").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("pv_txt_consumption").setAttribute("fill", elem.data('color-scale'));

                setFontSizes(index, 1, "pv_txt_consumption_style");
                setFontSizes(index, 2, "pv_txt_value_style");
                setFontSizes(index, 3, "pv_txt_charge_style");

                setPointerSizes(index, 1, "pv_PO2_line");

                setPointerColors(index, 1, "pv_PO1_line", "stroke");
                setPointerColors(index, 2, "pv_PO2_line", "stroke");
                setPointerColors(index, 3, "pv_PO3_bg", "stroke");
                setPointerColors(index, 3, "pv_spinner_M1", "stroke");
                setPointerColors(index, 3, "pv_spinner_M1", "fill");
                setPointerColors(index, 3, "pv_PO3_line", "stroke");

                if (items[index].hasBat == false) {
                    svgobj.getElementById("pv_PO3").setAttribute("display", "none");
                    svgobj.getElementById("pv_txt_charge").setAttribute("display", "none");
                }

                if (items[index].hasStat == false) {
                    svgobj.getElementById("pv_spinner_M1").setAttribute("display", "none");
                }

            }

            if (elem.data('view') == "thermometer") {

                items[index].firstrun = cache ? cache[index].firstrun : true;
                items[index].lasthour = cache ? cache[index].lasthour : 0;
                items[index].temperature = 0;
                items[index].oldTemp = 0;
                items[index].newTemp = 0;
                items[index].minTemp = cache ? cache[index].minTemp : 0;
                items[index].maxTemp = cache ? cache[index].maxTemp : 0;
                items[index].oldminTemp = 0;
                items[index].oldmaxTemp = 0;
                items[index].animation_PO1_lock = false;

                svgobj.getElementById("thermometer_PO1_animation").addEventListener('endEvent', function (evt) {
                    items[index].animation_PO1_lock = false;
                }, false);

                // Device reading for temperature
                if (elem.isDeviceReading('get-thermometer-temp')) {
                    me.addReading(elem, 'get-thermometer-temp');
                }

                svgobj.getElementById("thermometer_border_outer").setAttribute("stroke", elem.data('color-outerborder'));
                svgobj.getElementById("thermometer_border_outer").setAttribute("fill", elem.data('color-background'));
                svgobj.getElementById("thermometer_border_inner").setAttribute("stroke", elem.data('color-innerborder'));
                svgobj.getElementById("thermometer_MM1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("thermometer_MM1").setAttribute("fill", elem.data('color-scale'));
                svgobj.getElementById("thermometer_M1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("thermometer_M1").setAttribute("fill", elem.data('color-scale'));
                svgobj.getElementById("thermometer_L1").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("thermometer_L1").setAttribute("fill", elem.data('color-scale'));

                ["thermometer_txt_T1", "thermometer_txt_T2", "thermometer_txt_T3", "thermometer_txt_T4", "thermometer_txt_T5", "thermometer_txt_T6",
                    "thermometer_txt_T7", "thermometer_txt_T8", "thermometer_txt_T9"].forEach(function (item) {
                        svgobj.getElementById(item).setAttribute("stroke", elem.data('color-scale'));
                        svgobj.getElementById(item).setAttribute("fill", elem.data('color-scale'));
                    });

                svgobj.getElementById("thermometer_txt_value").setAttribute("stroke", elem.data('color-scale'));
                svgobj.getElementById("thermometer_txt_value").setAttribute("fill", elem.data('color-scale'));
                setFontSizes(index, 1, "thermometer_txt_value_style");
                setPointerSizes(index, 1, "thermometer_PO1_line");
                setPointerSizes(index, 2, "thermometer_PO2_line");
                setPointerSizes(index, 3, "thermometer_PO3_line");
                setPointerColors(index, 1, "thermometer_PO1_line", "stroke");
                setPointerColors(index, 1, "thermometer_PO1_rect", "stroke");
                setPointerColors(index, 1, "thermometer_PO1_rect", "fill");
                setPointerColors(index, 2, "thermometer_PO2_line", "stroke");
                setPointerColors(index, 3, "thermometer_PO3_line", "stroke");
            }


        });
        console.log(JSON.stringify(items, 1, 2))
        localStorage.setItem('gauge_items', JSON.stringify(items));
    }

    function update(device, reading) {
        me.elements.each(function (index) {
            var elem = $(this);

            //console.log("update idx " + index + " id " + items[index].myID + " view " + items[index].view )

            if (items[index].view === "hygrometer") {
                // we see an update in temperature reading
                if (elem.matchDeviceReading('get-temperature', device, reading) && items[index].animation_PO1_lock == false) {
                    items[index].animation_PO1_lock = true;
                    items[index].temperature = parseFloat(elem.getReading('get-temperature').val);

                    // set Deviation point
                    setDevpoint(index);

                    // set target for pointer move
                    items[index].newTemp = (items[index].temperature * 1.5);
                    items[index].newTemp = Math.round(items[index].newTemp * 100) / 100;
                    var PO1 = items[index].svgobj.getElementById("hygro_PO1_animation");
                    console.log("move hygrotemp " + items[index].oldTemp + " -> " + items[index].newTemp)
                    PO1.setAttribute("from", items[index].oldTemp + " 425 375");
                    PO1.setAttribute("to", items[index].newTemp + " 425 375");
                    items[index].oldTemp = items[index].newTemp;
                    PO1.beginElement();
                }

                if (elem.matchDeviceReading('get-humidity', device, reading) && items[index].animation_PO2_lock == false) {
                    items[index].animation_PO2_lock = true;
                    items[index].humidity = parseFloat(elem.getReading('get-humidity').val);
                    setDevpoint(index);
                    items[index].newHum = 0 - (items[index].humidity / 2);
                    items[index].newHum = Math.round(items[index].newHum * 100) / 100;
                    var PO2 = items[index].svgobj.getElementById("hygro_PO2_animation");
                    console.log("move hygrohum " + items[index].oldHum + " -> " + items[index].newHum)
                    PO2.setAttribute("from", items[index].oldHum + " 125 375");
                    PO2.setAttribute("to", items[index].newHum + " 125 375");
                    items[index].oldHum = items[index].newHum;
                    PO2.beginElement();
                }
            }

            if (items[index].view === "barometer") {

                if (elem.matchDeviceReading('get-pressure', device, reading) && items[index].animation_PO1_lock == false) {
                    items[index].animation_PO1_lock = true;
                    items[index].acthour = new Date().getHours();

                    //console.log("Baro fixed old " + items[index].lasthour + " new " + items[index].acthour + " first " + items[index].firstupdate)

                    items[index].pressure = parseFloat(elem.getReading('get-pressure').val);
                    setBaroValue(index);

                    items[index].newPres = ((items[index].pressure - 960) * 2);
                    items[index].newPres = Math.round(items[index].newPres * 100) / 100;
                    var PO1 = items[index].svgobj.getElementById("baro_PO1_animation");

                    console.log("move baro " + items[index].oldPres + " -> " + items[index].newPres)
                    PO1.setAttribute("from", items[index].oldPres + " 275 275");
                    PO1.setAttribute("to", items[index].newPres + " 275 275");
                    items[index].oldPres = items[index].newPres;
                    PO1.beginElement();


                    console.log("baro-hist acthour " + items[index].acthour + " lasthour " + items[index].lasthour + " firstupdate " + items[index].firstupdate)
                    if (items[index].acthour > items[index].lasthour || items[index].firstupdate) {
                        items[index].presHist[items[index].acthour] = items[index].newPres;
                        console.log("baro-hist " + items[index].presHist)
                        var newPresHist = getPresHist(index, items[index].acthour, items[index].barohistory);
                        newPresHist = newPresHist == 0 ? items[index].newPres : newPresHist;

                        var PO2 = items[index].svgobj.getElementById("baro_PO2_animation");

                        console.log("baro-hist " + "move barohist " + items[index].oldFixPres + " -> " + newPresHist)
                        PO2.setAttribute("from", items[index].oldFixPres + " 275 275");
                        PO2.setAttribute("to", newPresHist + " 275 275");
                        items[index].oldFixPres = newPresHist;
                        PO2.beginElement();
                        items[index].firstupdate = false;
                    }
                    items[index].lasthour = items[index].acthour;
                }
            }

            if (items[index].view === "anemometer") {
                if (elem.matchDeviceReading('get-wind-speed', device, reading) && items[index].animation_speed_lock == false) {
                    items[index].animation_speed_lock = true;
                    items[index].windspeed = parseFloat(elem.getReading('get-wind-speed').val);
                    setWindSpeed(index);
                    items[index].newSpeed = items[index].windspeed * 2;
                    items[index].newSpeed = Math.round(items[index].newSpeed * 10) / 10;
                    var PO1 = items[index].svgobj.getElementById("anemometer_PO1_animation");

                    console.log("move windspeed " + items[index].oldSpeed + " -> " + items[index].newSpeed)
                    PO1.setAttribute("from", items[index].oldSpeed + " 275 275");
                    PO1.setAttribute("to", items[index].newSpeed + " 275 275");
                    PO1.beginElement();

                    items[index].oldSpeed = items[index].newSpeed
                }

                if (elem.matchDeviceReading('get-wind-direction', device, reading) && items[index].animation_dir_lock == false) {
                    items[index].animation_dir_lock = true;
                    items[index].winddirection = parseFloat(elem.getReading('get-wind-direction').val);
                    items[index].newAngle = items[index].winddirection;
                    items[index].newAngle = Math.round(items[index].newAngle * 100) / 100;

                    if (items[index].firstupdate) {
                        items[index].oldAngle = items[index].newAngle > 180 ? 360 : 0;
                        items[index].firstupdate = false;
                    }
                    var PO2wind = items[index].svgobj.getElementById("anemometer_PO2_animation");
                    var target = items[index].newAngle
                    if (items[index].newAngle - items[index].oldAngle > 180) {
                        target = (0 - items[index].oldAngle) + (360 - items[index].newAngle)
                    }
                    if (items[index].oldAngle - items[index].newAngle > 180) {
                        target = items[index].oldAngle + (360 - items[index].oldAngle) + items[index].newAngle;
                    }

                    console.log("move winddir " + items[index].oldAngle + " -> " + items[index].newAngle + " target " + target)
                    PO2wind.setAttribute("from", items[index].oldAngle + " 275 275");
                    PO2wind.setAttribute("to", target + " 275 275");
                    PO2wind.beginElement();
                    items[index].oldAngle = items[index].newAngle
                }
            }

            if (items[index].view === "photovoltaic") {

                if (elem.matchDeviceReading('get-pv-batstate', device, reading)) {
                    items[index].batstate = elem.getReading('get-pv-batstate').val
                    var PO4 = items[index].svgobj.getElementById("pv_spinner_rotation");
                    if (items[index].batstate == "standby") {
                        items[index].svgobj.getElementById("pv_spinner_M1").setAttribute("display", "none");
                    } else {
                        items[index].svgobj.getElementById("pv_spinner_M1").setAttribute("display", "show");
                        if (items[index].batstate == "charge") {
                            PO4.setAttribute("from", "0 275 275");
                            PO4.setAttribute("to", "360 275 275");
                        } else if (items[index].batstate == "discharge") {
                            PO4.setAttribute("from", "360 275 275");
                            PO4.setAttribute("to", "0 275 275");
                        }
                    }
                }

                if (elem.matchDeviceReading('get-pv-generation', device, reading)) {
                    items[index].generation = parseInt(elem.getReading('get-pv-generation').val);
                    items[index].svgobj.getElementById("pv_txt_value").textContent = items[index].generation + ' W'
                    var PO1 = items[index].svgobj.getElementById("pv_PO1_line");
                    items[index].newGen = items[index].generation * 0.0664615384615385;
                    items[index].newGen = Math.round(items[index].newGen * 10) / 10;

                    PO1.setAttribute("stroke-dashoffset", 1193 - items[index].newGen)
                }

                if (elem.matchDeviceReading('get-pv-consumption', device, reading) && items[index].animation_PO2_lock == false) {
                    items[index].animation_PO2_lock = true;
                    items[index].consumption = parseInt(elem.getReading('get-pv-consumption').val);
                    items[index].svgobj.getElementById("pv_txt_consumption").textContent = items[index].consumption + ' W'
                    var PO2 = items[index].svgobj.getElementById("pv_PO2_animation");
                    items[index].newCon = items[index].consumption * 0.02;
                    items[index].newCon = Math.round(items[index].newCon * 10) / 10;

                    console.log("move pv-consumption " + items[index].oldCon + " -> " + items[index].newCon)
                    PO2.setAttribute("from", items[index].oldCon + " 275 275");
                    PO2.setAttribute("to", items[index].newCon + " 275 275");
                    items[index].oldCon = items[index].newCon;
                    PO2.beginElement();
                }

                if (elem.matchDeviceReading('get-pv-soc', device, reading)) {
                    items[index].soc = parseInt(elem.getReading('get-pv-soc').val);
                    items[index].svgobj.getElementById("pv_txt_charge").textContent = items[index].soc + '%'
                    var PO3 = items[index].svgobj.getElementById("pv_PO3_line");
                    items[index].newSoc = items[index].soc * 4.4;
                    items[index].newSoc = Math.round(items[index].newSoc * 10) / 10;
                    PO3.setAttribute("stroke-dashoffset", 440 - items[index].newSoc)
                }
            }

            if (items[index].view === "thermometer" && items[index].animation_PO1_lock == false) {
                if (elem.matchDeviceReading('get-thermometer-temp', device, reading)) {
                    var midnight = items[index].lasthour > new Date().getHours() ? true : false
                    items[index].temperature = parseFloat(elem.getReading('get-thermometer-temp').val)
                    items[index].temperature = Math.round(items[index].temperature * 10) / 10;

                    items[index].svgobj.getElementById("thermometer_txt_value").textContent = items[index].temperature + ' °C'

                    items[index].newTemp = items[index].temperature * 3;
                    items[index].newTemp = Math.round(items[index].newTemp * 10) / 10;
                    items[index].minTemp = (items[index].firstrun == true || midnight || items[index].newTemp < items[index].minTemp) ? items[index].newTemp : items[index].minTemp;
                    items[index].maxTemp = (items[index].firstrun == true || midnight || items[index].newTemp > items[index].maxTemp) ? items[index].newTemp : items[index].maxTemp;

                    var PO1 = items[index].svgobj.getElementById("thermometer_PO1_animation");
                    var PO2 = items[index].svgobj.getElementById("thermometer_PO2_animation");
                    var PO3 = items[index].svgobj.getElementById("thermometer_PO3_animation");

                    console.log("thermometer " + items[index].newTemp + " min " + items[index].minTemp + " max " + items[index].maxTemp)
                    PO1.setAttribute("from", items[index].oldTemp + " 275 275");
                    PO1.setAttribute("to", items[index].newTemp + " 275 275");
                    PO2.setAttribute("from", items[index].oldminTemp + " 275 275");
                    PO2.setAttribute("to", items[index].minTemp + " 275 275");
                    PO3.setAttribute("from", items[index].oldmaxTemp + " 275 275");
                    PO3.setAttribute("to", items[index].maxTemp + " 275 275");

                    items[index].animation_PO1_lock = true;
                    PO1.beginElement();
                    PO2.beginElement();
                    PO3.beginElement();

                    items[index].oldTemp = items[index].newTemp;
                    items[index].oldminTemp = items[index].minTemp;
                    items[index].oldmaxTemp = items[index].maxTemp;
                    items[index].firstrun = false;
                    items[index].lasthour = new Date().getHours();
                }
            }

        });

        localStorage.setItem('gauge_items', JSON.stringify(items));
    }

    function getPresHist(index, hour, span) {
        var request = hour - span;
        var hourindex = request < 0 ? request + 23 : request;
        console.log("baro-hist " + "acthour " + hour + " requested -" + span + " hourindex " + hourindex + " value " + items[index].presHist[hourindex])
        return items[index].presHist[hourindex];
    }

    function setPointerSizes(index, id, pointerid) {
        var rooty = parseFloat(items[index].svgobj.getElementById(pointerid).getAttribute("y1"))
        var POwidth = getPointerWidths(index, id);
        if (POwidth > 0) {
            items[index].svgobj.getElementById(pointerid).setAttribute("stroke-width", POwidth);
        }
        var POlength = getPointerLengths(index, id);
        if (POlength > 0) {
            items[index].svgobj.getElementById(pointerid).setAttribute("y2", POlength + rooty);
        }
    }

    function getPointerWidths(index, pointerindex) {
        // 1 - based for better handling
        return parseFloat((pointerindex > items[index].pointerwidths.length) ? "0" : items[index].pointerwidths[pointerindex - 1]);
    }

    function getPointerLengths(index, pointerindex) {
        // 1 - based for better handling
        return parseFloat((pointerindex > items[index].pointerlengths.length) ? "0" : items[index].pointerlengths[pointerindex - 1]);
    }

    function setFontSizes(index, id, elementid) {
        var size = (id > items[index].textsizes.length) ? 0 : items[index].textsizes[id - 1];
        if (size) {
            items[index].svgobj.getElementById(elementid).setAttribute("font-size", size);
        }
    }

    function setPointerColors(index, id, pointerid, attr) {
        var color = (id > items[index].pointercolors.length) ? 0 : items[index].pointercolors[id - 1];
        if (color) {
            items[index].svgobj.getElementById(pointerid).setAttribute(attr, color);
        }
    }

    function showDevpoint(elem_id, show) { //true or false, 0 or 1
        items[elem_id].svgobj.getElementById("devpoint").setAttribute("display", show ? "show" : "none");
    }

    function showBaroValue(elem_id, show) {
        items[elem_id].svgobj.getElementById("viewbarotxtvalue").setAttribute("display", show ? "show" : "none");
    }

    function setDevpoint(elem_id) {
        items[elem_id].svgobj.getElementById("txtdevpoint").textContent = 'Taupunkt ' + getDevpoint(items[elem_id].temperature, items[elem_id].humidity) + '°C'
    }

    function setBaroValue(elem_id) {
        items[elem_id].svgobj.getElementById("baro_txtvalue").textContent = items[elem_id].pressure + ' hPa';
    }

    function setWindSpeed(elem_id) {
        items[elem_id].svgobj.getElementById("anemometer_txt_value").textContent = items[elem_id].windspeed + " " + items[elem_id].wind_unit;
    }

    function getDevpoint(Temperature, Humidity) {
        var a = Temperature >= 0 ? 7.5 : 7.6;
        var b = Temperature >= 0 ? 237.3 : 240.7;
        var sdd = 6.1078 * Math.exp(((a * Temperature) / (b + Temperature)) / Math.LOG10E);
        var dd = Humidity / 100 * sdd;
        var c = Math.log(dd / 6.1078) * Math.LOG10E;
        var Devpoint = (b * c) / (a - c);
        n = Math.pow(10, 1);
        x = Math.round(Devpoint * n);
        return x / n;
    }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    var me = $.extend(new Modul_widget(), {
        widgetname: 'gauge',
        init: init,
        update: update,
    });

    return me;
};

class Gauges {
    constructor(id) {
        this.id = id;
        this.hygrometer = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 552 552" id="{{svgid}}">
	
			<!-- Border -->
			<circle cx="275" cy="275" r="265" fill="WhiteSmoke" stroke="#bfc1c2" stroke-width="16" id="hygro_border_outer"/>
			<circle cx="275" cy="275" r="265" stroke="#d8d8d8" stroke-width="4" id="hygro_border_inner"/>
			<g stroke="black" stroke-width="2" fill="none"></g>
		
			<defs>
				<!-- Pointer template Temperature -->
				<g id="PO1">
					<line stroke-width="2" x1="425" y1="375" x2="425" y2="765" fill="orangered" id="PO1_line"/>
					<rect x="417" y="330" rx="2" ry="2" width="16" height="64" fill="orangered" id="PO1_rect"/>
					<circle cx="425" cy="375" r="2" stroke="brown" stroke-width="4" />
					<circle cx="425" cy="375" r="3" fill="grey"/>
				</g>
		
				<!-- Pointer template Humidity -->
				<g id="PO2">
					<line stroke-width="2" x1="125" y1="375" x2="125" y2="765" fill="orangered" id="PO2_line"/>
					<rect x="117" y="330" rx="2" ry="2" width="16" height="64" fill="orangered" id="PO2_rect"/>
					<circle cx="125" cy="375" r="2" stroke="brown" stroke-width="4" />
					<circle cx="125" cy="375" r="3" fill="grey"/>
				</g>
		
				<!-- scale templates -->
				<line stroke-width="2" id="M1" x1="425" y1="725" x2="425" y2="745"/>
				<line stroke-width="3" id="L1" x1="425" y1="725" x2="425" y2="755"/>
				<line stroke-width="2" id="MM1" x1="425" y1="725" x2="425" y2="750"/>
		
				<g id="Z1">
					<use xlink:href="#M1" transform="rotate(0,425,375)"/>
					<use xlink:href="#M1" transform="rotate(1.5,425,375)"/>
				</g>
				
				<line stroke-width="2" id="M2" x1="125" y1="725" x2="125" y2="745"/>
				<line stroke-width="3" id="L2" x1="125" y1="725" x2="125" y2="755"/>
		
				<g id="Z2">
					<use xlink:href="#M2" transform="rotate(0,125,375)"/>
					<use xlink:href="#M2" transform="rotate(2,125,375)"/>
				</g>
				
				<!-- 4 stripes templates -->
				<line stroke-width="2" id="line1" x1="425" y1="505" x2="425" y2="695"/>
				<line stroke-width="2" id="line2" x1="425" y1="495" x2="425" y2="695"/>
				<line stroke-width="2" id="line3" x1="125" y1="495" x2="125" y2="695"/>
				<line stroke-width="2" id="line4" x1="125" y1="535" x2="125" y2="695"/>
				
			</defs>
			
			<!-- Temperature scale -->
			<g id="T1" stroke="black">
				<use xlink:href="#Z1" transform="rotate(92,425,375)"/>
				<use xlink:href="#L1" transform="rotate(92,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(95,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(98,425,375)"/>
				<use xlink:href="#MM1" transform="rotate(99.5,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(101,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(104,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(107,425,375)"/>
				<use xlink:href="#L1" transform="rotate(107,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(110,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(113,425,375)"/>
				<use xlink:href="#MM1" transform="rotate(114.5,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(116,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(119,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(122,425,375)"/>
				<use xlink:href="#L1" transform="rotate(122,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(125,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(128,425,375)"/>
				<use xlink:href="#MM1" transform="rotate(129.5,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(131,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(134,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(137,425,375)"/>
				<use xlink:href="#L1" transform="rotate(137,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(140,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(143,425,375)"/>
				<use xlink:href="#MM1" transform="rotate(144.5,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(146,425,375)"/>
				<use xlink:href="#Z1" transform="rotate(149,425,375)"/>
				<use xlink:href="#L1" transform="rotate(152,425,375)"/>
			</g>
			
			<!-- Humidity scale -->
			<g id="T2" stroke="black">
				<use xlink:href="#L2" transform="rotate(208,125,375)"/>
				<use xlink:href="#Z2" transform="rotate(208,125,375)"/>
				<use xlink:href="#Z2" transform="rotate(212,125,375)"/>
				<use xlink:href="#Z2" transform="rotate(216,125,375)"/>
				<use xlink:href="#L2" transform="rotate(218,125,375)"/>
				<use xlink:href="#Z2" transform="rotate(220,125,375)"/>
				<use xlink:href="#Z2" transform="rotate(224,125,375)"/>
				<use xlink:href="#Z2" transform="rotate(228,125,375)"/>
				<use xlink:href="#L2" transform="rotate(228,125,375)"/>
				<use xlink:href="#Z2" transform="rotate(232,125,375)"/>
				<use xlink:href="#Z2" transform="rotate(236,125,375)"/>
				<use xlink:href="#L2" transform="rotate(238,125,375)"/>
				<use xlink:href="#Z2" transform="rotate(240,125,375)"/>
				<use xlink:href="#Z2" transform="rotate(244,125,375)"/>
				<use xlink:href="#Z2" transform="rotate(248,125,375)"/>
				<use xlink:href="#L2" transform="rotate(248,125,375)"/>
				<use xlink:href="#Z2" transform="rotate(252,125,375)"/>
				<use xlink:href="#Z2" transform="rotate(256,125,375)"/>
				<use xlink:href="#L2" transform="rotate(258,125,375)"/>
				<use xlink:href="#Z2" transform="rotate(260,125,375)"/>
				<use xlink:href="#Z2" transform="rotate(264,125,375)"/>
				<use xlink:href="#L2" transform="rotate(268,125,375)"/>
			</g>
			
			<!-- numbers on scale -->
			<g font-family="arial" font-size="20" font-weight="normal" font-style="normal" stroke="black" fill="black" id ="numbers">
				<!-- right side -->
				<text x="357" y="70">100</text>
				<text x="412" y="117">80</text>
				<text x="451" y="169">60</text>
				<text x="479" y="229">40</text>
				<text x="500" y="297">20</text>
				<text x="503" y="365">0</text>
				<!-- left side -->
				<text x="130" y="97">30</text>
				<text x="67" y="174">20</text>
				<text x="28" y="267">10</text>
				<text x="34" y="365">0</text>
			</g>
			
			<!-- 4 grey stripes in middle -->
			<g id="T2" stroke="grey">
				<use xlink:href="#line1" transform="rotate(117.5,425,375)"/>
				<use xlink:href="#line2" transform="rotate(126.5,425,375)"/>
				<use xlink:href="#line3" transform="rotate(233,125,375)"/>
				<use xlink:href="#line4" transform="rotate(248,125,375)"/>
			</g>
			
			<!-- Deviation point field -->
			<text text-anchor="middle" font-family="arial" font-size="25" font-weight="normal" font-style="normal" stroke="black" fill="black" id="devpoint" display="none">
				<tspan x="275" y="475" id="txtdevpoint" ></tspan>
			</text>
			
			<!-- Pointer Temperature -->
			<g  stroke-width="1" fill="none">
				<use xlink:href="#PO1" transform="rotate(92,425,375)" id="PO1a"/>
				<animateTransform attributeName="transform"
					attributeType="XML"
					type="rotate"
					from="0 425 375"
					to="0 425 375"
					dur="3s"
					repeatCount="1"
					begin = "indefinite"
					fill="freeze"
					id = "hygro_PO1_animation"/>
			</g>
			
			<!-- Pointer Humidity -->
			<g  stroke-width="1" fill="none">
				<use xlink:href="#PO2" transform="rotate(268,125,375)" id="PO2a"/>
				<animateTransform attributeName="transform"
					attributeType="XML"
					type="rotate"
					from="0 125 375"
					to="0 125 375"
					dur="3s"
					repeatCount="1"
					begin = "indefinite"
					fill="freeze"
					id = "hygro_PO2_animation"/>
			</g>
		
		</svg>`;
        this.barometer = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 552 552" id="{{svgid}}" >
		
			<!-- Border -->
			<circle cx="275" cy="275" r="265" fill="WhiteSmoke" stroke="#bfc1c2" stroke-width="16" id="baro_border_outer"/>
			<circle cx="275" cy="275" r="265"  stroke="#d8d8d8" stroke-width="4" id="baro_border_inner"/>
			<g stroke="black" stroke-width="2" fill="none"></g>
		
			<!--<path fill="none" stroke="#2e8b57" stroke-width="20" d="M413,331 A190,190 35 0 1 657,393" />-->
		
			<defs>
				<!-- Pointer template Pressure -->
				<g id="baroPO1">
					<line stroke-width="2" x1="275" y1="275" x2="275" y2="490" fill="orangered" id="baroPO1_line"/>
					<rect x="267" y="230" rx="2" ry="2" width="16" height="64" fill="orangered" id="baroPO1_rect"/>
					<circle cx="275" cy="275" r="2" stroke="brown" stroke-width="4" />
					<circle cx="275" cy="275" r="3" fill="grey"/>
				</g>
		
				<!-- Pointer template fixptr -->
				<g id="baroPO2">
					<line stroke-width="1" x1="275" y1="350" x2="275" y2="450" fill="grey" id="baroPO2_line"/>
				</g>
		
				<!-- scale templates -->
				<line stroke-width="2" id="baroM1" x1="275" y1="475" x2="275" y2="490"/>
				<line stroke-width="3" id="baroL1" x1="275" y1="475" x2="275" y2="505"/>
				<line stroke-width="2" id="baroMM1" x1="275" y1="475" x2="275" y2="500"/>
		
				<g id="baroZ1">
					<use xlink:href="#baroL1" transform="rotate(0,275,275)"/>
					<use xlink:href="#baroM1" transform="rotate(2,275,275)"/>
					<use xlink:href="#baroM1" transform="rotate(4,275,275)"/>
					<use xlink:href="#baroM1" transform="rotate(6,275,275)"/>
					<use xlink:href="#baroM1" transform="rotate(8,275,275)"/>
					<use xlink:href="#baroMM1" transform="rotate(10,275,275)"/>
					<use xlink:href="#baroM1" transform="rotate(12,275,275)"/>
					<use xlink:href="#baroM1" transform="rotate(14,275,275)"/>
					<use xlink:href="#baroM1" transform="rotate(16,275,275)"/>
					<use xlink:href="#baroM1" transform="rotate(18,275,275)"/>
				</g>
				
				<text id="baroT1" font-family="arial" font-size="15" font-weight="normal" font-style="normal" stroke="black"  x="260" y="40">960</text>
				<text id="baroT2" font-family="arial" font-size="15" font-weight="normal" font-style="normal" stroke="black" fill="black" x="260" y="40">970</text>
				<text id="baroT3" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="260" y="40">980</text>
				<text id="baroT4" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="260" y="40">990</text>
				<text id="baroT5" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">1000</text>
				<text id="baroT6" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">1010</text>
				<text id="baroT7" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">1020</text>
				<text id="baroT8" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">1030</text>
				<text id="baroT9" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">1040</text>
				<text id="baroT10" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">1050</text>
				<text id="baroT11" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">1060</text>
				<text id="baroT12" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">1070</text>
				
				<g id="baro_icon_rainy" transform="scale(0.1)">
					<path fill-rule="evenodd" clip-rule="evenodd" d="M400,64c-5.312,0-10.562,0.375-15.792,1.125
					C354.334,24.417,307.188,0,256,0s-98.312,24.417-128.208,65.125C122.562,64.375,117.312,64,112,64C50.25,64,0,114.25,0,176
					s50.25,112,112,112c13.688,0,27.084-2.5,39.709-7.333C180.666,305.917,217.5,320,256,320c38.542,0,75.333-14.083,104.291-39.333
					C372.916,285.5,386.312,288,400,288c61.75,0,112-50.25,112-112S461.75,64,400,64z M400,256c-17.125,0-32.916-5.5-45.938-14.667
					C330.584,269.625,295.624,288,256,288c-39.625,0-74.584-18.375-98.062-46.667C144.938,250.5,129.125,256,112,256
					c-44.188,0-80-35.812-80-80s35.812-80,80-80c10.812,0,21.062,2.208,30.438,6.083C163.667,60.667,206.291,32,256,32
					s92.334,28.667,113.541,70.083C378.938,98.208,389.209,96,400,96c44.188,0,80,35.812,80,80S444.188,256,400,256z M225,480
					c0,17.688,14.312,32,32,32s32-14.312,32-32s-32-64-32-64S225,462.312,225,480z M352,448c0,17.688,14.312,32,32,32s32-14.312,32-32
					s-32-64-32-64S352,430.312,352,448z M96,384c0,17.688,14.312,32,32,32s32-14.312,32-32s-32-64-32-64S96,366.312,96,384z"/>
				</g>
				<g id="baro_icon_medium" transform="scale(0.1)">
					<path d="M208,64c8.833,0,16-7.167,16-16V16c0-8.833-7.167-16-16-16s-16,7.167-16,16v32
					C192,56.833,199.167,64,208,64z M332.438,106.167l22.625-22.625c6.249-6.25,6.249-16.375,0-22.625
					c-6.25-6.25-16.375-6.25-22.625,0l-22.625,22.625c-6.25,6.25-6.25,16.375,0,22.625
					C316.062,112.417,326.188,112.417,332.438,106.167z M16,224h32c8.833,0,16-7.167,16-16s-7.167-16-16-16H16
					c-8.833,0-16,7.167-16,16S7.167,224,16,224z M352,208c0,8.833,7.167,16,16,16h32c8.833,0,16-7.167,16-16s-7.167-16-16-16h-32
					C359.167,192,352,199.167,352,208z M83.541,106.167c6.251,6.25,16.376,6.25,22.625,0c6.251-6.25,6.251-16.375,0-22.625
					L83.541,60.917c-6.25-6.25-16.374-6.25-22.625,0c-6.25,6.25-6.25,16.375,0,22.625L83.541,106.167z M400,256
					c-5.312,0-10.562,0.375-15.792,1.125c-16.771-22.875-39.124-40.333-64.458-51.5C318.459,145,268.938,96,208,96
					c-61.75,0-112,50.25-112,112c0,17.438,4.334,33.75,11.5,48.438C47.875,258.875,0,307.812,0,368c0,61.75,50.25,112,112,112
					c13.688,0,27.084-2.5,39.709-7.333C180.666,497.917,217.5,512,256,512c38.542,0,75.333-14.083,104.291-39.333
					C372.916,477.5,386.312,480,400,480c61.75,0,112-50.25,112-112S461.75,256,400,256z M208,128c39.812,0,72.562,29.167,78.708,67.25
					c-10.021-2-20.249-3.25-30.708-3.25c-45.938,0-88.5,19.812-118.375,53.25C131.688,234.083,128,221.542,128,208
					C128,163.812,163.812,128,208,128z M400,448c-17.125,0-32.916-5.5-45.938-14.667C330.584,461.625,295.624,480,256,480
					c-39.625,0-74.584-18.375-98.062-46.667C144.938,442.5,129.125,448,112,448c-44.188,0-80-35.812-80-80s35.812-80,80-80
					c7.75,0,15.062,1.458,22.125,3.541c2.812,0.792,5.667,1.417,8.312,2.521c4.375-8.562,9.875-16.396,15.979-23.75
					C181.792,242.188,216.562,224,256,224c10.125,0,19.834,1.458,29.25,3.709c10.562,2.499,20.542,6.291,29.834,11.291
					c23.291,12.375,42.416,31.542,54.457,55.063C378.938,290.188,389.209,288,400,288c44.188,0,80,35.812,80,80S444.188,448,400,448z"
					/>
				</g>
				<g id="baro_icon_sunny" transform="scale(0.12)" >
					<path fill-rule="evenodd" clip-rule="evenodd" d="M256,144c-61.75,0-112,50.25-112,112c0,61.75,50.25,112,112,112
					s112-50.25,112-112C368,194.25,317.75,144,256,144z M256,336c-44.188,0-80-35.812-80-80s35.812-80,80-80s80,35.812,80,80
					S300.188,336,256,336z M256,112c8.833,0,16-7.167,16-16V64c0-8.833-7.167-16-16-16s-16,7.167-16,16v32
					C240,104.833,247.167,112,256,112z M256,400c-8.833,0-16,7.167-16,16v32c0,8.833,7.167,16,16,16s16-7.167,16-16v-32
					C272,407.167,264.833,400,256,400z M380.438,154.167l22.625-22.625c6.25-6.25,6.25-16.375,0-22.625
					c-6.25-6.25-16.375-6.25-22.625,0l-22.625,22.625c-6.25,6.25-6.25,16.375,0,22.625
					C364.062,160.417,374.188,160.417,380.438,154.167z M131.562,357.834l-22.625,22.625c-6.25,6.249-6.25,16.374,0,22.624
					s16.375,6.25,22.625,0l22.625-22.624c6.25-6.271,6.25-16.376,0-22.625C147.938,351.583,137.812,351.562,131.562,357.834z M112,256
					c0-8.833-7.167-16-16-16H64c-8.833,0-16,7.167-16,16s7.167,16,16,16h32C104.833,272,112,264.833,112,256z M448,240h-32
					c-8.833,0-16,7.167-16,16s7.167,16,16,16h32c8.833,0,16-7.167,16-16S456.833,240,448,240z M131.541,154.167
					c6.251,6.25,16.376,6.25,22.625,0c6.251-6.25,6.251-16.375,0-22.625l-22.625-22.625c-6.25-6.25-16.374-6.25-22.625,0
					c-6.25,6.25-6.25,16.375,0,22.625L131.541,154.167z M380.459,357.812c-6.271-6.25-16.376-6.25-22.625,0
					c-6.251,6.25-6.271,16.375,0,22.625l22.625,22.625c6.249,6.25,16.374,6.25,22.624,0s6.25-16.374,0-22.625L380.459,357.812z"/>
				</g>
			</defs>
			
			<g id="baro_icons" stroke="black">
				<use xlink:href="#baro_icon_rainy" x="120" y="200"/>
				<use xlink:href="#baro_icon_medium" x="250" y="100"/>
				<use xlink:href="#baro_icon_sunny" x="380" y="190"/>
			</g>

			<!-- Temperature scale -->
			<g id="baroScale" stroke="black">
				<use xlink:href="#baroZ1" transform="rotate(70,275,275)"/>
				<use xlink:href="#baroZ1" transform="rotate(90,275,275)"/>
				<use xlink:href="#baroZ1" transform="rotate(110,275,275)"/>
				<use xlink:href="#baroZ1" transform="rotate(130,275,275)"/>
				<use xlink:href="#baroZ1" transform="rotate(150,275,275)"/>
				<use xlink:href="#baroZ1" transform="rotate(170,275,275)"/>
				<use xlink:href="#baroZ1" transform="rotate(190,275,275)"/>
				<use xlink:href="#baroZ1" transform="rotate(210,275,275)"/>
				<use xlink:href="#baroZ1" transform="rotate(230,275,275)"/>
				<use xlink:href="#baroZ1" transform="rotate(250,275,275)"/>
				<use xlink:href="#baroZ1" transform="rotate(270,275,275)"/>
				<use xlink:href="#baroL1" transform="rotate(290,275,275)"/>
			</g>
			
			<use xlink:href="#baroT1" transform="rotate(250,275,275)" id="T1a"/>
			<use xlink:href="#baroT2" transform="rotate(270,275,275)" id="T2a"/>
			<use xlink:href="#baroT3" transform="rotate(290,275,275)" id="T3a"/>
			<use xlink:href="#baroT4" transform="rotate(310,275,275)" id="T4a"/>
			<use xlink:href="#baroT5" transform="rotate(330,275,275)" id="T5a"/>
			<use xlink:href="#baroT6" transform="rotate(350,275,275)" id="T6a"/>
			<use xlink:href="#baroT7" transform="rotate(370,275,275)" id="T7a"/>
			<use xlink:href="#baroT8" transform="rotate(390,275,275)" id="T8a"/>
			<use xlink:href="#baroT9" transform="rotate(410,275,275)" id="T9a"/>
			<use xlink:href="#baroT10" transform="rotate(430,275,275)" id="T10a"/>
			<use xlink:href="#baroT11" transform="rotate(450,275,275)" id="T11a"/>
			<use xlink:href="#baroT12" transform="rotate(470,275,275)" id="T12a"/>
			
			<!-- Value field -->
			<text text-anchor="middle" font-family="arial" font-size="25" font-weight="normal" font-style="normal" stroke="black" fill="black" id="viewbarotxtvalue" display="none">
				<tspan x="275" y="475" id="baro_txtvalue"></tspan>
			</text>

			<!-- Pointer Memory -->
			<g stroke="grey" stroke-width="1" fill="none">
				<use xlink:href="#baroPO2" transform="rotate(70,275,275)" id="baroPO2a"/>
				<animateTransform attributeName="transform"
					attributeType="XML"
					type="rotate"
					from="0 275 275"
					to="0 275 275"
					dur="3s"
					repeatCount="1"
					begin = "indefinite"
					fill="freeze"
					id = "baro_PO2_animation"/>
			</g>
			
			<!-- Pointer Pressure -->
			<g stroke-width="1" fill="none">
				<use xlink:href="#baroPO1" transform="rotate(70,275,275)" id="baroPO1a"/>
				<animateTransform attributeName="transform"
					attributeType="XML"
					type="rotate"
					from="0 275 275"
					to="0 275 275"
					dur="3s"
					repeatCount="1"
					begin = "indefinite"
					fill="freeze"
					id = "baro_PO1_animation"/>
			</g>
		</svg>`;
        this.clock = `
			<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 552 552" id="{{svgid}}" >
			
			<!-- Border -->
			<circle cx="275" cy="275" r="265" fill="WhiteSmoke" stroke="#bfc1c2" stroke-width="16" id="clock_border_outer"/>
			<circle cx="275" cy="275" r="265"  stroke="#d8d8d8" stroke-width="4" id="clock_border_inner"/>

			<defs>
			
				<!-- Pointer template hours -->
				<g id="clock_PO1">
					<line stroke-width="4" x1="275" y1="275" x2="275" y2="400" fill="blue" id="clock_PO1_line"/>
					<circle cx="275" cy="275" r="4" stroke="brown" stroke-width="4" />
				</g>
				
				<!-- Pointer template minutes -->
				<g id="clock_PO2">
					<line stroke-width="3" x1="275" y1="275" x2="275" y2="460" fill="blue" id="clock_PO2_line"/>
					<circle cx="275" cy="275" r="3" stroke="brown" stroke-width="4" />
				</g>

				<!-- Pointer template Seconds -->
				<g id="clock_PO3">
					<line stroke-width="1" x1="275" y1="275" x2="275" y2="490" fill="orangered" id="clock_PO3_line"/>
					<circle cx="275" cy="275" r="2" stroke="brown" stroke-width="4" />
					<circle cx="275" cy="275" r="3" fill="grey"/>
				</g>

				<!-- scale templates -->
				<line stroke-width="2" id="clock_M1" x1="275" y1="475" x2="275" y2="490"/>
				<line stroke-width="4" id="clock_L1" x1="275" y1="475" x2="275" y2="505"/>
				<line stroke-width="2" id="clock_MM1" x1="275" y1="475" x2="275" y2="500"/>

				<!-- scale cluster -->
				<g id="clock_Z1">
					<use xlink:href="#clock_L1" transform="rotate(0,275,275)"/>
					<use xlink:href="#clock_M1" transform="rotate(6,275,275)"/>
					<use xlink:href="#clock_M1" transform="rotate(12,275,275)"/>
					<use xlink:href="#clock_M1" transform="rotate(18,275,275)"/>
					<use xlink:href="#clock_M1" transform="rotate(24,275,275)"/>
				</g>
			</defs>

			<g id="clock_T1" stroke="black">
				<use xlink:href="#clock_Z1" transform="rotate(0,275,275)"/>
				<use xlink:href="#clock_Z1" transform="rotate(30,275,275)"/>
				<use xlink:href="#clock_Z1" transform="rotate(60,275,275)"/>
				<use xlink:href="#clock_Z1" transform="rotate(90,275,275)"/>
				<use xlink:href="#clock_Z1" transform="rotate(120,275,275)"/>
				<use xlink:href="#clock_Z1" transform="rotate(150,275,275)"/>
				<use xlink:href="#clock_Z1" transform="rotate(180,275,275)"/>
				<use xlink:href="#clock_Z1" transform="rotate(210,275,275)"/>
				<use xlink:href="#clock_Z1" transform="rotate(240,275,275)"/>
				<use xlink:href="#clock_Z1" transform="rotate(270,275,275)"/>
				<use xlink:href="#clock_Z1" transform="rotate(300,275,275)"/>
				<use xlink:href="#clock_Z1" transform="rotate(330,275,275)"/>
			</g>
			
			<!-- Pointer hours -->
			<g stroke-width="1" fill="none">
				<use xlink:href="#clock_PO1" transform="rotate(180,275,275)" id="clock_PO1a"/>
			</g>
			
			<!-- Pointer minutes -->
			<g stroke-width="1" fill="none">
				<use xlink:href="#clock_PO2" transform="rotate(180,275,275)" id="clock_PO2a"/>
			</g>
			
			<!-- Pointer seconds -->
			<g  stroke-width="1" fill="none">
				<use xlink:href="#clock_PO3" transform="rotate(180,275,275)" id="clock_PO3a"/>
			</g>

		</svg>`;

        this.anemometer = `
		<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 552 552" id="{{svgid}}" >
			<!-- Border -->
			<circle cx="275" cy="275" r="265" fill="WhiteSmoke" stroke="#bfc1c2" stroke-width="16" id="anemometer_border_outer"/>
			<circle cx="275" cy="275" r="265" stroke="#d8d8d8" stroke-width="4" id="anemometer_border_inner"/> 

			<defs>

				<!-- Pointer template windspeed -->
				<g id="anemometer_PO1">
					<line stroke-width="2" x1="275" y1="400" x2="275" y2="470" fill="blue" id ="anemometer_PO1_line"/>
					<circle cx="275" cy="275" r="4" stroke="brown" stroke-width="4" />
				</g>
				
				<!-- Pointer template winddirection -->
				<g id="anemometer_PO2" transform="rotate(180,275,275)">
					<polygon id="anemometer_PO2_polygon" fill="red" points="260,250 275,260 290,250 275,330" />
					<circle cx="275" cy="275" r="2" stroke="brown" stroke-width="2" />
				</g>

				<!-- winddirection scale templates -->
				<line stroke-width="2" id="anemometer_dir_M1" x1="275" y1="345" x2="275" y2="360"/>
				<line stroke-width="3" id="anemometer_dir_L1" x1="275" y1="345" x2="275" y2="370"/>

				<!-- winddirection scale cluster -->
				<g id="anemometer_Z1">
					<use xlink:href="#anemometer_dir_L1" transform="rotate(0,275,275)"/>
					<use xlink:href="#anemometer_dir_M1" transform="rotate(9,275,275)"/>
					<use xlink:href="#anemometer_dir_M1" transform="rotate(18,275,275)"/>
					<use xlink:href="#anemometer_dir_M1" transform="rotate(27,275,275)"/>
					<use xlink:href="#anemometer_dir_M1" transform="rotate(36,275,275)"/>
				</g>
				
				<!-- windspeed scale templates -->
				<line stroke-width="2" id="anemometer_spd_M1" x1="275" y1="475" x2="275" y2="490"/>
				<line stroke-width="3" id="anemometer_spd_L1" x1="275" y1="475" x2="275" y2="505"/>
				<line stroke-width="2" id="anemometer_spd_MM1" x1="275" y1="475" x2="275" y2="500"/>

				<!-- winddirection scale cluster -->
				<g id="anemometer_spd_Z1">
					<use xlink:href="#anemometer_spd_L1" transform="rotate(0,275,275)"/>
					<use xlink:href="#anemometer_spd_M1" transform="rotate(2,275,275)"/>
					<use xlink:href="#anemometer_spd_M1" transform="rotate(4,275,275)"/>
					<use xlink:href="#anemometer_spd_M1" transform="rotate(6,275,275)"/>
					<use xlink:href="#anemometer_spd_M1" transform="rotate(8,275,275)"/>
					<use xlink:href="#anemometer_spd_MM1" transform="rotate(10,275,275)"/>
					<use xlink:href="#anemometer_spd_M1" transform="rotate(12,275,275)"/>
					<use xlink:href="#anemometer_spd_M1" transform="rotate(14,275,275)"/>
					<use xlink:href="#anemometer_spd_M1" transform="rotate(16,275,275)"/>
					<use xlink:href="#anemometer_spd_M1" transform="rotate(18,275,275)"/>
				</g>
				
				<text id="anemometer_txt_T1" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black"  x="260" y="40">0</text>
				<text id="anemometer_txt_T2" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="260" y="40">10</text>
				<text id="anemometer_txt_T3" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="260" y="40">20</text>
				<text id="anemometer_txt_T4" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="260" y="40">30</text>
				<text id="anemometer_txt_T5" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">40</text>
				<text id="anemometer_txt_T6" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">50</text>
				<text id="anemometer_txt_T7" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">60</text>
				<text id="anemometer_txt_T8" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">70</text>
				<text id="anemometer_txt_T9" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">80</text>
				<text id="anemometer_txt_T10" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">90</text>
				<text id="anemometer_txt_T11" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">100</text>
				<text id="anemometer_txt_T12" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">110</text>
				<text id="anemometer_txt_T13" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">120</text>
				<text id="anemometer_txt_T14" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">130</text>
				
				<text id="anemometer_txt_T15" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="269" y="175">N</text>
				<text id="anemometer_txt_T16" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="372" y="280">O</text>
				<text id="anemometer_txt_T17" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="269" y="388">S</text>
				<text id="anemometer_txt_T18" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="161" y="280">W</text>
				
			</defs>

				
			<g id="anemometer_T1" stroke="black">
				<use xlink:href="#anemometer_Z1" transform="rotate(0,275,275)"/>
				<use xlink:href="#anemometer_Z1" transform="rotate(45,275,275)"/>
				<use xlink:href="#anemometer_Z1" transform="rotate(90,275,275)"/>
				<use xlink:href="#anemometer_Z1" transform="rotate(135,275,275)"/>
				<use xlink:href="#anemometer_Z1" transform="rotate(180,275,275)"/>
				<use xlink:href="#anemometer_Z1" transform="rotate(225,275,275)"/>
				<use xlink:href="#anemometer_Z1" transform="rotate(270,275,275)"/>
				<use xlink:href="#anemometer_Z1" transform="rotate(315,275,275)"/>
			</g>
			
			<use xlink:href="#anemometer_txt_T15" id="anemometer_txt_T15a"/>
			<use xlink:href="#anemometer_txt_T16" id="anemometer_txt_T16a"/>
			<use xlink:href="#anemometer_txt_T17" id="anemometer_txt_T17a"/>
			<use xlink:href="#anemometer_txt_T18" id="anemometer_txt_T18a"/>

			
			<g id="anemometer_T2" stroke="black">
				<use xlink:href="#anemometer_spd_Z1" transform="rotate(50,275,275)"/>
				<use xlink:href="#anemometer_spd_Z1" transform="rotate(70,275,275)"/>
				<use xlink:href="#anemometer_spd_Z1" transform="rotate(90,275,275)"/>
				<use xlink:href="#anemometer_spd_Z1" transform="rotate(110,275,275)"/>
				<use xlink:href="#anemometer_spd_Z1" transform="rotate(130,275,275)"/>
				<use xlink:href="#anemometer_spd_Z1" transform="rotate(150,275,275)"/>
				<use xlink:href="#anemometer_spd_Z1" transform="rotate(170,275,275)"/>
				<use xlink:href="#anemometer_spd_Z1" transform="rotate(190,275,275)"/>
				<use xlink:href="#anemometer_spd_Z1" transform="rotate(210,275,275)"/>
				<use xlink:href="#anemometer_spd_Z1" transform="rotate(230,275,275)"/>
				<use xlink:href="#anemometer_spd_Z1" transform="rotate(250,275,275)"/>
				<use xlink:href="#anemometer_spd_Z1" transform="rotate(270,275,275)"/>
				<use xlink:href="#anemometer_spd_Z1" transform="rotate(290,275,275)"/>
				<use xlink:href="#anemometer_spd_L1" transform="rotate(310,275,275)"/>
			</g>
			
			<use xlink:href="#anemometer_txt_T1" transform="rotate(232,275,275)" id="anemometer_txt_T1a"/>
			<use xlink:href="#anemometer_txt_T2" transform="rotate(251,275,275)" id="anemometer_txt_T2a"/>
			<use xlink:href="#anemometer_txt_T3" transform="rotate(271,275,275)" id="anemometer_txt_T3a"/>
			<use xlink:href="#anemometer_txt_T4" transform="rotate(291,275,275)" id="anemometer_txt_T4a"/>
			<use xlink:href="#anemometer_txt_T5" transform="rotate(312,275,275)" id="anemometer_txt_T5a"/>
			<use xlink:href="#anemometer_txt_T6" transform="rotate(332,275,275)" id="anemometer_txt_T6a"/>
			<use xlink:href="#anemometer_txt_T7" transform="rotate(352,275,275)" id="anemometer_txt_T7a"/>
			<use xlink:href="#anemometer_txt_T8" transform="rotate(373,275,275)" id="anemometer_txt_T8a"/>
			<use xlink:href="#anemometer_txt_T9" transform="rotate(393,275,275)" id="anemometer_txt_T9a"/>
			<use xlink:href="#anemometer_txt_T10" transform="rotate(413,275,275)" id="anemometer_txt_T10a"/>
			<use xlink:href="#anemometer_txt_T11" transform="rotate(431,275,275)" id="anemometer_txt_T11a"/>
			<use xlink:href="#anemometer_txt_T12" transform="rotate(451,275,275)" id="anemometer_txt_T12a"/>
			<use xlink:href="#anemometer_txt_T13" transform="rotate(471,275,275)" id="anemometer_txt_T13a"/>
			<use xlink:href="#anemometer_txt_T14" transform="rotate(491,275,275)" id="anemometer_txt_T14a"/>

			<text text-anchor="middle" font-family="arial" font-size="25" font-weight="normal" font-style="normal" stroke="black" fill="black" id="anemometer_txt_value_style">
				<tspan x="275" y="475" id="anemometer_txt_value">0 km/h</tspan>
			</text>
			
			<!-- Pointer windspeed -->
			<g stroke="black" stroke-width="1" fill="none">
				<use xlink:href="#anemometer_PO1" transform="rotate(50,275,275)" id="anemometer_PO1a"/>
				<animateTransform attributeName="transform"
					attributeType="XML"
					type="rotate"
					from="0 275 275"
					to="0 275 275"
					dur="3s"
					repeatCount="1"
					begin = "indefinite"
					fill="freeze"
					id = "anemometer_PO1_animation"/>
			</g>
			
			<!-- Pointer winddirection -->
			<g stroke="black" stroke-width="1" fill="none">
				<use xlink:href="#anemometer_PO2"  id="anemometer_PO2a"/>
				<animateTransform attributeName="transform"
					attributeType="XML"
					type="rotate"
					from="0 275 275"
					to="0 275 275"
					dur="3s"
					repeatCount="1"
					begin = "indefinite"
					fill="freeze"
					id = "anemometer_PO2_animation"/>
			</g>


		</svg>`;

        this.photovoltaic = `
		<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 552 552" id="{{svgid}}" >
			<!-- Border -->
			<circle cx="275" cy="275" r="265" fill="WhiteSmoke" stroke="#bfc1c2" stroke-width="16" id="pv_border_outer"/>
			<circle cx="275" cy="275" r="265" stroke="#d8d8d8" stroke-width="4" id="pv_border_inner"/> 

			<defs>

				<!-- Pointer template -->
				<g id="pv_PO1"> 
					<circle cx="275" cy="275" r="190" stroke-width="8" stroke="brown" id="pv_PO1_line" stroke-dasharray="1193,1193" stroke-dashoffset="1193.00" style="transition: all 5s ease-in-out" transform="rotate(140,275,275)"/>
				</g>
				
				<g id="pv_PO2"> 
					<line stroke-width="2" x1="275" y1="400" x2="275" y2="455" fill="blue" id ="pv_PO2_line" />
				</g>
				
				<!-- spinner templates -->
				<circle cx="275" cy="345" r="3" fill="green" stroke-width="4" id="pv_spinner_M1"  stroke="green" opacity="0.5"/>
				<!-- spinner cluster -->
				<g id="pv_spinner_Z1">
					<use xlink:href="#pv_spinner_M1" transform="rotate(0,275,275)"/>
					<use xlink:href="#pv_spinner_M1" transform="rotate(22.5,275,275)"/>
				</g>
					<g id="pv_spinner_T1" stroke="black">
					<use xlink:href="#pv_spinner_Z1" transform="rotate(0,275,275)"/>
					<use xlink:href="#pv_spinner_Z1" transform="rotate(45,275,275)"/>
					<use xlink:href="#pv_spinner_Z1" transform="rotate(90,275,275)"/>
					<use xlink:href="#pv_spinner_Z1" transform="rotate(135,275,275)"/>
					<use xlink:href="#pv_spinner_Z1" transform="rotate(180,275,275)"/>
					<use xlink:href="#pv_spinner_Z1" transform="rotate(225,275,275)"/>
					<use xlink:href="#pv_spinner_Z1" transform="rotate(270,275,275)"/>
					<use xlink:href="#pv_spinner_Z1" transform="rotate(315,275,275)"/>
					<animateTransform attributeName="transform"
                          attributeType="XML"
                          type="rotate"
                          from="0 275 275"
                          to="360 275 275"
                          dur="10s"
                          repeatCount="indefinite"
						  id = "pv_spinner_rotation"/>
				</g>
				
				<!-- Pointer template charge -->
				<g id="pv_PO3" transform="rotate(0,275,275)">
					<circle cx="275" cy="275" r="70" stroke-width="15" stroke="green" opacity="0.2" transform="rotate(0,275,275)" id="pv_PO3_bg"/>
					<use xlink:href="#pv_spinner_T1" transform="rotate(0,275,275)" id="pv_PO3_spinner"/>
					<circle cx="275" cy="275" r="70" stroke-width="15" stroke="green" id="pv_PO3_line" stroke-dasharray="440,440" stroke-dashoffset="440.00" style="transition: all 5s ease-in-out" transform="rotate(90,275,275)"/>
				</g>

				<!-- power scale templates -->
				<line stroke-width="2" id="pv_spd_M1" x1="275" y1="475" x2="275" y2="490"/>
				<line stroke-width="3" id="pv_spd_L1" x1="275" y1="475" x2="275" y2="505"/>
				<line stroke-width="2" id="pv_spd_MM1" x1="275" y1="475" x2="275" y2="500"/>

				<!-- power scale cluster -->
				<g id="pv_spd_Z1">
					<use xlink:href="#pv_spd_L1" transform="rotate(0,275,275)"/>
					<use xlink:href="#pv_spd_M1" transform="rotate(2,275,275)"/>
					<use xlink:href="#pv_spd_M1" transform="rotate(4,275,275)"/>
					<use xlink:href="#pv_spd_M1" transform="rotate(6,275,275)"/>
					<use xlink:href="#pv_spd_M1" transform="rotate(8,275,275)"/>
					<use xlink:href="#pv_spd_MM1" transform="rotate(10,275,275)"/>
					<use xlink:href="#pv_spd_M1" transform="rotate(12,275,275)"/>
					<use xlink:href="#pv_spd_M1" transform="rotate(14,275,275)"/>
					<use xlink:href="#pv_spd_M1" transform="rotate(16,275,275)"/>
					<use xlink:href="#pv_spd_M1" transform="rotate(18,275,275)"/>
				</g>
				
				<text id="pv_txt_T1" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black"  x="260" y="40">0</text>
				<text id="pv_txt_T2" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="260" y="40">1000</text>
				<text id="pv_txt_T3" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="260" y="40">2000</text>
				<text id="pv_txt_T4" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="260" y="40">3000</text>
				<text id="pv_txt_T5" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">4000</text>
				<text id="pv_txt_T6" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">5000</text>
				<text id="pv_txt_T7" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">6000</text>
				<text id="pv_txt_T8" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">7000</text>
				<text id="pv_txt_T9" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">8000</text>
				<text id="pv_txt_T10" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">9000</text>
				<text id="pv_txt_T11" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">10000</text>
				<text id="pv_txt_T12" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">11000</text>
				<text id="pv_txt_T13" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">12000</text>
				<text id="pv_txt_T14" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">13000</text>

			</defs>

			
			<g id="pv_T2" stroke="black">
				<use xlink:href="#pv_spd_Z1" transform="rotate(50,275,275)"/>
				<use xlink:href="#pv_spd_Z1" transform="rotate(70,275,275)"/>
				<use xlink:href="#pv_spd_Z1" transform="rotate(90,275,275)"/>
				<use xlink:href="#pv_spd_Z1" transform="rotate(110,275,275)"/>
				<use xlink:href="#pv_spd_Z1" transform="rotate(130,275,275)"/>
				<use xlink:href="#pv_spd_Z1" transform="rotate(150,275,275)"/>
				<use xlink:href="#pv_spd_Z1" transform="rotate(170,275,275)"/>
				<use xlink:href="#pv_spd_Z1" transform="rotate(190,275,275)"/>
				<use xlink:href="#pv_spd_Z1" transform="rotate(210,275,275)"/>
				<use xlink:href="#pv_spd_Z1" transform="rotate(230,275,275)"/>
				<use xlink:href="#pv_spd_Z1" transform="rotate(250,275,275)"/>
				<use xlink:href="#pv_spd_Z1" transform="rotate(270,275,275)"/>
				<use xlink:href="#pv_spd_Z1" transform="rotate(290,275,275)"/>
				<use xlink:href="#pv_spd_L1" transform="rotate(310,275,275)"/>
			</g>
			
			<use xlink:href="#pv_txt_T1" transform="rotate(232,275,275)" id="pv_txt_T1a"/>
			<use xlink:href="#pv_txt_T2" transform="rotate(248,275,275)" id="pv_txt_T2a"/>
			<use xlink:href="#pv_txt_T3" transform="rotate(268,275,275)" id="pv_txt_T3a"/>
			<use xlink:href="#pv_txt_T4" transform="rotate(288,275,275)" id="pv_txt_T4a"/>
			<use xlink:href="#pv_txt_T5" transform="rotate(310,275,275)" id="pv_txt_T5a"/>
			<use xlink:href="#pv_txt_T6" transform="rotate(330,275,275)" id="pv_txt_T6a"/>
			<use xlink:href="#pv_txt_T7" transform="rotate(350,275,275)" id="pv_txt_T7a"/>
			<use xlink:href="#pv_txt_T8" transform="rotate(370,275,275)" id="pv_txt_T8a"/>
			<use xlink:href="#pv_txt_T9" transform="rotate(390,275,275)" id="pv_txt_T9a"/>
			<use xlink:href="#pv_txt_T10" transform="rotate(410,275,275)" id="pv_txt_T10a"/>
			<use xlink:href="#pv_txt_T11" transform="rotate(428,275,275)" id="pv_txt_T11a"/>
			<use xlink:href="#pv_txt_T12" transform="rotate(448,275,275)" id="pv_txt_T12a"/>
			<use xlink:href="#pv_txt_T13" transform="rotate(468,275,275)" id="pv_txt_T13a"/>
			<use xlink:href="#pv_txt_T14" transform="rotate(488,275,275)" id="pv_txt_T14a"/>

			<text text-anchor="middle" font-family="arial" font-size="25" font-weight="normal" font-style="normal" stroke="black" fill="black" id="pv_txt_value_style">
				<tspan x="350" y="475" id="pv_txt_value">0W</tspan>
			</text>
			<text text-anchor="middle" font-family="arial" font-size="25" font-weight="normal" font-style="normal" stroke="black" fill="black" id="pv_txt_consumption_style">
				<tspan x="200" y="475" id="pv_txt_consumption">0W</tspan>
			</text>
			
			<text text-anchor="middle" alignment-baseline="middle" font-family="arial" font-size="25" font-weight="normal" font-style="normal" stroke="black" fill="black" id="pv_txt_charge_style">
				<tspan x="275" y="285" id="pv_txt_charge" >0%</tspan>
			</text>
			
			<!-- Pointer generation -->
			<g stroke="black" stroke-width="1" fill="none">
				<use xlink:href="#pv_PO1" transform="rotate(0,275,275)" id="pv_PO1a"/>
			</g>
			
			<!-- Pointer drain -->
			<g stroke="black" stroke-width="1" fill="none">
				<use xlink:href="#pv_PO2" transform="rotate(50,275,275)" id="pv_PO2a"/>
				<animateTransform attributeName="transform"
					attributeType="XML"
					type="rotate"
					from="0 275 275"
					to="0 275 275"
					dur="3s"
					repeatCount="1"
					begin = "indefinite"
					fill="freeze"
					id = "pv_PO2_animation"/>
			</g>
			
			<!-- Pointer SOC -->
			<g stroke="black" stroke-width="1" fill="none">
				<use xlink:href="#pv_PO3" transform="rotate(0,275,275)" id="pv_PO3a"/>
			</g>
		</svg>`;

        this.thermometer = `
		<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 552 552" id="{{svgid}}" >
	
			<!-- Border -->
			<circle cx="275" cy="275" r="265" fill="WhiteSmoke" stroke="#bfc1c2" stroke-width="16" id="thermometer_border_outer"/>
			<circle cx="275" cy="275" r="265"  stroke="#d8d8d8" stroke-width="4" id="thermometer_border_inner"/>
			<g stroke="black" stroke-width="2" fill="none"></g>

			<!--<path fill="none" stroke="#2e8b57" stroke-width="20" d="M413,331 A190,190 35 0 1 657,393" />-->

			<defs>
			
				<!-- Pointer Temperature -->
				<g id="thermometer_PO1" transform="rotate(150,275,275)">
					<line stroke-width="2" x1="275" y1="275" x2="275" y2="490" fill="orangered" id="thermometer_PO1_line"/>
					<rect x="267" y="230" rx="2" ry="2" width="16" height="64" fill="orangered" id="thermometer_PO1_rect"/>
					<circle cx="275" cy="275" r="2" stroke="brown" stroke-width="4" />
					<circle cx="275" cy="275" r="3" fill="grey"/>
				</g>
				<!-- Pointer min -->
				<g id="thermometer_PO2" transform="rotate(150,275,275)">
					<line stroke-width="2" x1="275" y1="350" x2="275" y2="450" fill="blue" id="thermometer_PO2_line"/>
				</g>
				<!-- Pointer max -->
				<g id="thermometer_PO3" transform="rotate(150,275,275)">
					<line stroke-width="2" x1="275" y1="350" x2="275" y2="450" fill="red" id="thermometer_PO3_line"/>
				</g>
				
				<!-- scale templates -->
				<line stroke-width="2" id="thermometer_M1" x1="275" y1="475" x2="275" y2="490"/>
				<line stroke-width="3" id="thermometer_L1" x1="275" y1="475" x2="275" y2="505"/>
				<line stroke-width="2" id="thermometer_MM1" x1="275" y1="475" x2="275" y2="500"/>

				<!-- scale cluster -->
				<g id="thermometer_Z1">
					<use xlink:href="#thermometer_L1" transform="rotate(0,275,275)"/>
					<use xlink:href="#thermometer_M1" transform="rotate(3,275,275)"/>
					<use xlink:href="#thermometer_M1" transform="rotate(6,275,275)"/>
					<use xlink:href="#thermometer_M1" transform="rotate(9,275,275)"/>
					<use xlink:href="#thermometer_M1" transform="rotate(12,275,275)"/>
					<use xlink:href="#thermometer_MM1" transform="rotate(15,275,275)"/>
					<use xlink:href="#thermometer_M1" transform="rotate(18,275,275)"/>
					<use xlink:href="#thermometer_M1" transform="rotate(21,275,275)"/>
					<use xlink:href="#thermometer_M1" transform="rotate(24,275,275)"/>
					<use xlink:href="#thermometer_M1" transform="rotate(27,275,275)"/>
				</g>
				
				<text id="thermometer_txt_T1" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black"  x="260" y="40">-30</text>
				<text id="thermometer_txt_T2" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="260" y="40">-20</text>
				<text id="thermometer_txt_T3" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="260" y="40">-10</text>
				<text id="thermometer_txt_T4" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="260" y="40">0</text>
				<text id="thermometer_txt_T5" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">10</text>
				<text id="thermometer_txt_T6" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">20</text>
				<text id="thermometer_txt_T7" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">30</text>
				<text id="thermometer_txt_T8" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">40</text>
				<text id="thermometer_txt_T9" font-family="arial" font-size="18" font-weight="normal" font-style="normal" stroke="black" fill="black" x="255" y="40">50</text>
				
			</defs>
			
			<!-- build scale -->
			<g id="thermometer_T1" stroke="black">
				<use xlink:href="#thermometer_Z1" transform="rotate(60,275,275)"/>
				<use xlink:href="#thermometer_Z1" transform="rotate(90,275,275)"/>
				<use xlink:href="#thermometer_Z1" transform="rotate(120,275,275)"/>
				<use xlink:href="#thermometer_Z1" transform="rotate(150,275,275)"/>
				<use xlink:href="#thermometer_Z1" transform="rotate(180,275,275)"/>
				<use xlink:href="#thermometer_Z1" transform="rotate(210,275,275)"/>
				<use xlink:href="#thermometer_Z1" transform="rotate(240,275,275)"/>
				<use xlink:href="#thermometer_Z1" transform="rotate(270,275,275)"/>
				<use xlink:href="#thermometer_L1" transform="rotate(300,275,275)"/>
			</g>
			
			<use xlink:href="#thermometer_txt_T1" transform="rotate(240,275,275)" id="thermometer_txt_T1a"/>
			<use xlink:href="#thermometer_txt_T2" transform="rotate(270,275,275)" id="thermometer_txt_T2a"/>
			<use xlink:href="#thermometer_txt_T3" transform="rotate(300,275,275)" id="thermometer_txt_T3a"/>
			<use xlink:href="#thermometer_txt_T4" transform="rotate(332,275,275)" id="thermometer_txt_T4a"/>
			<use xlink:href="#thermometer_txt_T5" transform="rotate(362,275,275)" id="thermometer_txt_T5a"/>
			<use xlink:href="#thermometer_txt_T6" transform="rotate(392,275,275)" id="thermometer_txt_T6a"/>
			<use xlink:href="#thermometer_txt_T7" transform="rotate(422,275,275)" id="thermometer_txt_T7a"/>
			<use xlink:href="#thermometer_txt_T8" transform="rotate(452,275,275)" id="thermometer_txt_T8a"/>
			<use xlink:href="#thermometer_txt_T9" transform="rotate(482,275,275)" id="thermometer_txt_T9a"/>
			
			<text text-anchor="middle" font-family="arial" font-size="25" font-weight="normal" font-style="normal" stroke="black" fill="black" id="thermometer_txt_value_style">
				<tspan x="275" y="475" id="thermometer_txt_value">0 °C</tspan>
			</text>
			
			<g stroke="black">
				<use xlink:href="#thermometer_PO1" style="transition: all 5s ease-in-out" id="thermometer_PO1a" />
				<animateTransform attributeName="transform"
							attributeType="XML"
							type="rotate"
							from="0 275 275"
							to="150 275 275"
							dur="3s"
							repeatCount="1"
							begin = "indefinite"
							fill="freeze"
							id = "thermometer_PO1_animation"/>
			</g>
			
			<g stroke="black">
				<use xlink:href="#thermometer_PO2" style="transition: all 5s ease-in-out" id="thermometer_PO2a" />
				<animateTransform attributeName="transform"
							attributeType="XML"
							type="rotate"
							from="0 275 275"
							to="150 275 275"
							dur="3s"
							repeatCount="1"
							begin = "indefinite"
							fill="freeze"
							id = "thermometer_PO2_animation"/>
			</g>
			
			<g stroke="black">
				<use xlink:href="#thermometer_PO3" style="transition: all 5s ease-in-out" id="thermometer_PO3a" />
				<animateTransform attributeName="transform"
							attributeType="XML"
							type="rotate"
							from="0 275 275"
							to="150 275 275"
							dur="3s"
							repeatCount="1"
							begin = "indefinite"
							fill="freeze"
							id = "thermometer_PO3_animation"/>
			</g>
			
		</svg>`;
    }

    getSVG(type) {
        if (type === "hygrometer") {
            return this.hygrometer.replace("{{svgid}}", this.id)
        } else if (type === "barometer") {
            return this.barometer.replace("{{svgid}}", this.id)
        } else if (type === "clock") {
            return this.clock.replace("{{svgid}}", this.id)
        } else if (type === "anemometer") {
            return this.anemometer.replace("{{svgid}}", this.id)
        } else if (type === "photovoltaic") {
            return this.photovoltaic.replace("{{svgid}}", this.id)
        } else if (type === "thermometer") {
            return this.thermometer.replace("{{svgid}}", this.id)
        }
    }

}

