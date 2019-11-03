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
