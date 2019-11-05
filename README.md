# widget_7segment
A FHEM FTUI widget to show values with a 7segment display

Example Definitons
```
<li data-row="1" data-col="7" data-sizex="1" data-sizey="6">
<header>7-segment</header>
	<div 
		data-type = "7segment"
		data-get-value = "<Device>:<Reading>"
		data-decimals ="1"
		data-digits ="5"
		data-color-fg="limegreen"
		class="top-space">
	</div>
	<div 
		data-type = "7segment"
		data-get-value = "<Device>:<Reading>"
		data-limits ="[500,700,900,1000]"
		data-limit-colors ='["yellow","orange","orangered","red"]'
		class="top-space">
	</div>
	<div 
		data-type = "7segment"
		data-get-value = "<Device>:<Reading>"
		data-color-fg="yellow"
		data-digits = "5"
		class="top-space">
	</div>
</li>
```

# widget_gauge

A FHEM FTUI widget which contains several analogue gauges
- hygrometer
- barometer
- anemometer
- thermometer
- photovoltaic (visualize a combination of generation, consumption and SoC of a battery)
- clock


Example Definitions

```
<li data-row="1" data-col="1" data-sizex="3" data-sizey="3">
  <header>HYGROMETER</header>
	<div 
	data-type = "gauge"
	data-view = "hygrometer"
	data-get-temperature = "Wetterstation:temperatureInside"
	data-get-humidity = "Wetterstation:humidityInside"
	data-show-devpoint= "1"
	data-pointer-speed = "20"
	data-pointer-widths = '["6","6"]'
	data-pointer-lengths = '["370.0","370.0"]'
	data-text-sizes = '["30"]'
	data-color-scale = "red"
	data-color-background = "black"
	data-color-pointer = "red"
	data-size = "250"
	style=""
	class="top-space">
</div>
</li>
<li data-row="1" data-col="4" data-sizex="3" data-sizey="3">
  <header>BAROMETER</header>
  <div 
	data-type = "gauge"
	data-view = "barometer"
	data-baro-show-value = "1"
	data-baro-history = "2"
	data-get-pressure = "Wetterstation:pressureRel"
	data-pointer-speed = "10"
	data-pointer-widths = '["6"]'
	data-color-scale = "red"
	data-color-background = "black"
	data-color-pointer = "red"
	data-size = "250"
	data-text-sizes = '["30"]'
	style=""
	class="top-space">
</div>
</li>
<li data-row="4" data-col="1" data-sizex="3" data-sizey="3">
<header>CLOCK</header>
  <div 
	data-type = "gauge"
	data-view = "clock"
	data-clock-timezone = "0"
	data-color-scale = "red"
	data-color-background = "black"
	data-pointer-colors = '["red","red","red"]'
	data-pointer-widths = '["8","8","3"]'
	data-size = "250"
	style=""
	class="top-space">
</div>
</li>
<li data-row="4" data-col="4" data-sizex="3" data-sizey="3">
<header>ANEMOMETER</header>
  <div 
	data-type = "gauge"
	data-view = "anemometer"
	data-get-wind-speed = "Wetterstation:windkmh"
	data-get-wind-direction = "Wetterstation:windDirection"
	data-wind-unit = "km/h"
	data-pointer-speed = "10"
	data-pointer-widths = '["6"]'
	data-color-scale = "red"
	data-color-background = "black"
	data-color-pointer = "red"
	data-size = "250"
	data-text-sizes = '["30"]'
	style=""
	class="top-space">
</div>
</li>
<li data-row="1" data-col="8" data-sizex="3" data-sizey="3">
<header>PHOTOVOLTAIC</header>
  <div 
	data-type = "gauge"
	data-view = "photovoltaic"
	data-color-scale = "red"
	data-color-background = "black"
	data-pointer-colors = '["red","red","red"]'
	data-get-pv-soc = "Solarwatt:Bat_SoC"
	data-get-pv-generation = "Wechselrichter1:ProdTotal"
	data-get-pv-consumption = "ESPEasy_sonoff_7_Watt:StromverbrauchAktuell"
	data-get-pv-batstate = "Solarwatt:Bat_State"
	data-pointer-speed = "10"
	data-pointer-widths = '["6"]'
	data-text-sizes = '["30","30","35"]'
	data-size = "250"
	style=""
	class="top-space">
</div>
</li>
<li data-row="4" data-col="8" data-sizex="3" data-sizey="3">
<header>Thermometer</header>
  <div 
	data-type = "gauge"
	data-view = "thermometer"
	data-color-scale = "red"
	data-color-background = "black"
	data-pointer-colors = '["red","red","red"]'
	data-get-thermometer-temp = "Wetterstation:temperature"
	data-pointer-speed = "10"
	data-pointer-widths = '["6"]'
	data-text-sizes = '["30","30","35"]'
	data-size = "250"
	style=""
	class="top-space">
</div>
</li>
```