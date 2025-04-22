<!--
	@component
	Layer Cake component
 -->
<script>
	import { onMount, setContext } from 'svelte';

	import debounce from './utils/debounce.js';
	import filterObject from './utils/filterObject.js';
	import makeAccessor from './utils/makeAccessor.js';

	import calcDomain from './helpers/calcDomain.js';
	import calcScaleExtents from './helpers/calcScaleExtents.js';
	import createGetter from './helpers/createGetter.js';
	import createScale from './helpers/createScale.js';
	import getRange from './helpers/getRange.js';
	import printDebug from './helpers/printDebug.js';

	import defaultScales from './settings/defaultScales.js';

	const printDebug_debounced = debounce(printDebug, 200);

	/* --------------------------------------------
	 * Parameters
	 * Values that computed properties are based on and that
	 * can be easily extended from config values
	 */
	let {
		/** @type {boolean} [ssr=false] Whether this chart should be rendered server side. */
		ssr = false,
		/** @type {boolean} [pointerEvents=true] Whether to allow pointer events via CSS. Set this to `false` to set `pointer-events: none;` on all components, disabling all mouse interaction. */
		pointerEvents = true,
		/** @type {string} [position='relative'] Determine the positioning of the wrapper div. Set this to `'absolute'` when you want to stack cakes. */
		position = 'relative',
		/** @type {boolean} [percentRange=false] If `true`, set all scale ranges to `[0, 100]`. Ranges reversed via `xReverse`, `yReverse`, `zReverse` or `rReverse` props will continue to be reversed as usual. */
		percentRange = false,

		/** @type {number} [width=containerWidth] Override the automated width. */
		width = undefined,
		/** @type {number} [height=containerHeight] Override the automated height. */
		height = undefined,

		/** @type {number} [containerWidth=100] The bound container width. */
		containerWidth = width || 100,
		/** @type {number} [containerHeight=100] The bound container height. */
		containerHeight = height || 100,

		/**	@type {Element|undefined} [element] The .layercake-container `<div>` tag. Useful for bindings. */
		element = undefined,

		/** @type {string|function|number|Array<string|function|number>|undefined} x The x accessor. The key in each row of data that corresponds to the x-field. This can be a string, an accessor function, a number or an array of any combination of those types. This property gets converted to a function when you access it through the context. */
		x = undefined,
		/** @type {string|function|number|Array<string|function|number>|undefined} y The y accessor. The key in each row of data that corresponds to the y-field. This can be a string, an accessor function, a number or an array of any combination of those types. This property gets converted to a function when you access it through the context. */
		y = undefined,
		/** @type {string|function|number|Array<string|function|number>|undefined} z The z accessor. The key in each row of data that corresponds to the z-field. This can be a string, an accessor function, a number or an array of any combination of those types. This property gets converted to a function when you access it through the context. */
		z = undefined,
		/** @type {string|function|number|Array<string|function|number>|undefined} r The r accessor. The key in each row of data that corresponds to the r-field. This can be a string, an accessor function, a number or an array of any combination of those types. This property gets converted to a function when you access it through the context. */
		r = undefined,

		/** @type {Array<Object>|Object} [data=[]] If `data` is not a flat array of objects and you want to use any of the scales, set a flat version of the data via the `flatData` prop. */
		data = [],

		/** @type {[min: number|null, max: number|null]|Array<string|number>|function|undefined} [xDomain] Set a min or max. For linear scales, if you want to inherit the value from the data's extent, set that value to `null`. This value can also be an array because sometimes your scales are [piecewise](https://github.com/d3/d3-scale#continuous_domain) or are a list of discrete values such as in [ordinal scales](https://github.com/d3/d3-scale#ordinal-scales), useful for color series. Set it to a function that receives the computed domain and lets you return a modified domain, useful for sorting values. */
		xDomain = undefined,
		/** @type {[min: number|null, max: number|null]|Array<string|number>|function|undefined} [yDomain] Set a min or max. For linear scales, if you want to inherit the value from the data's extent, set that value to `null`.  Set it to a function that receives the computed domain and lets you return a modified domain, useful for sorting values. */
		yDomain = undefined,
		/** @type {[min: number|null, max: number|null]|Array<string|number>|function|undefined} [zDomain] Set a min or max. For linear scales, if you want to inherit the value from the data's extent, set that value to `null`. This value can also be an array because sometimes your scales are [piecewise](https://github.com/d3/d3-scale#continuous_domain) or are a list of discrete values such as in [ordinal scales](https://github.com/d3/d3-scale#ordinal-scales), useful for color series. Set it to a function that receives the computed domain and lets you return a modified domain, useful for sorting values. */
		zDomain = undefined,
		/** @type {[min: number|null, max: number|null]|Array<string|number>|function|undefined} [rDomain] Set a min or max. For linear scales, if you want to inherit the value from the data's extent, set that value to `null`. This value can also be an array because sometimes your scales are [piecewise](https://github.com/d3/d3-scale#continuous_domain) or are a list of discrete values such as in [ordinal scales](https://github.com/d3/d3-scale#ordinal-scales), useful for color series. Set it to a function that receives the computed domain and lets you return a modified domain, useful for sorting values. */
		rDomain = undefined,
		/** @type {boolean|number} [xNice=false] Applies D3's [scale.nice()](https://github.com/d3/d3-scale#continuous_nice) to the x domain. */
		xNice = false,
		/** @type {boolean|number} [yNice=false] Applies D3's [scale.nice()](https://github.com/d3/d3-scale#continuous_nice) to the y domain. */
		yNice = false,
		/** @type {boolean|number} [zNice=false] Applies D3's [scale.nice()](https://github.com/d3/d3-scale#continuous_nice) to the z domain. */
		zNice = false,
		/** @type {boolean} [rNice=false] Applies D3's [scale.nice()](https://github.com/d3/d3-scale#continuous_nice) to the r domain. */
		rNice = false,
		/** @type {[leftPixels: number, rightPixels: number]|undefined} [xPadding] Assign a pixel value to add to the min or max of the scale. This will increase the scales domain by the scale unit equivalent of the provided pixels. */
		xPadding = undefined,
		/** @type {[leftPixels: number, rightPixels: number]|undefined} [yPadding] Assign a pixel value to add to the min or max of the scale. This will increase the scales domain by the scale unit equivalent of the provided pixels. */
		yPadding = undefined,
		/** @type {[leftPixels: number, rightPixels: number]|undefined} [zPadding] Assign a pixel value to add to the min or max of the scale. This will increase the scales domain by the scale unit equivalent of the provided pixels. */
		zPadding = undefined,
		/** @type {[leftPixels: number, rightPixels: number]|undefined} [rPadding] Assign a pixel value to add to the min or max of the scale. This will increase the scales domain by the scale unit equivalent of the provided pixels. */
		rPadding = undefined,
		/** @type {function} [xScale=d3.scaleLinear] The D3 scale that should be used for the x-dimension. Pass in an instantiated D3 scale if you want to override the default or you want to extra options. */
		xScale = defaultScales.x,
		/** @type {function} [yScale=d3.scaleLinear] The D3 scale that should be used for the x-dimension. Pass in an instantiated D3 scale if you want to override the default or you want to extra options. */
		yScale = defaultScales.y,
		/** @type {function} [zScale=d3.scaleLinear] The D3 scale that should be used for the x-dimension. Pass in an instantiated D3 scale if you want to override the default or you want to extra options. */
		zScale = defaultScales.z,
		/** @type {function} [rScale=d3.scaleSqrt] The D3 scale that should be used for the x-dimension. Pass in an instantiated D3 scale if you want to override the default or you want to extra options. */
		rScale = defaultScales.r,
		/** @type {[min: number, max: number]|function|Array<string|number>|undefined} [xRange] Override the default x range of `[0, width]` by setting an array or function with argument `({ width, height})` that returns an array. Setting this prop overrides `xReverse`. This can also be a list of numbers or strings for scales with discrete ranges like [scaleThreshhold](https://github.com/d3/d3-scale#threshold-scales) or [scaleQuantize](https://github.com/d3/d3-scale#quantize-scales). */
		xRange = undefined,
		/** @type {[min: number, max: number]|function|Array<string|number>|undefined} [xRange] Override the default y range of `[0, height]` by setting an array or function with argument `({ width, height})` that returns an array. Setting this prop overrides `yReverse`. This can also be a list of numbers or strings for scales with discrete ranges like [scaleThreshhold](https://github.com/d3/d3-scale#threshold-scales) or [scaleQuantize](https://github.com/d3/d3-scale#quantize-scales). */
		yRange = undefined,
		/** @type {[min: number, max: number]|function|Array<string|number>|undefined} [zRange] Override the default z range of `[0, width]` by setting an array or function with argument `({ width, height})` that returns an array. Setting this prop overrides `zReverse`. This can also be a list of numbers or strings for scales with discrete ranges like [scaleThreshhold](https://github.com/d3/d3-scale#threshold-scales) or [scaleQuantize](https://github.com/d3/d3-scale#quantize-scales). */
		zRange = undefined,
		/** @type {[min: number, max: number]|function|Array<string|number>|undefined} [rRange] Override the default r range of `[1, 25]` by setting an array or function with argument `({ width, height})` that returns an array. Setting this prop overrides `rReverse`. This can also be a list of numbers or strings for scales with discrete ranges like [scaleThreshhold](https://github.com/d3/d3-scale#threshold-scales) or [scaleQuantize](https://github.com/d3/d3-scale#quantize-scales). */
		rRange = undefined,
		/** @type {boolean} [xReverse=false] Reverse the default x range. By default this is `false` and the range is `[0, width]`. Ignored if you set the xRange prop. */
		xReverse = false,
		/** @type {boolean|undefined} [yReverse=true] Reverse the default y range. By default this is set dynamically and will be `true` – setting the range to `[height, 0]` – unless the `yScale` has a `.bandwidth` method. Dynamic behavior is overridden if the user sets the prop. Ignored if you set the `yRange` prop. */
		yReverse = undefined,
		/** @type {boolean} [zReverse=false] Reverse the default z range. By default this is `false` and the range is `[0, width]`. Ignored if you set the zRange prop. */
		zReverse = false,
		/** @type {boolean} [rReverse=false] Reverse the default r range. By default this is `false` and the range is `[1, 25]`. Ignored if you set the rRange prop. */
		rReverse = false,
		/** @type {boolean} [xDomainSort=true] Only used when scale is ordinal. Set whether the calculated unique items come back sorted. */
		xDomainSort = true,
		/** @type {boolean} [yDomainSort=true] Only used when scale is ordinal. Set whether the calculated unique items come back sorted. */
		yDomainSort = true,
		/** @type {boolean} [zDomainSort=true] Only used when scale is ordinal. Set whether the calculated unique items come back sorted. */
		zDomainSort = true,
		/** @type {boolean} [rDomainSort=true] Only used when scale is ordinal. Set whether the calculated unique items come back sorted. */
		rDomainSort = true,
		/** @type {{top?: number, right?: number, bottom?: number, left?: number}} [padding={}] The amount of padding to put around your chart. It operates like CSS box-sizing: border-box; where values are subtracted from the parent container's width and height, the same as a [D3 margin convention](https://bl.ocks.org/mbostock/3019563). */
		padding = {},
		/** @type {{ x?: [min: number, max: number], y?: [min: number, max: number], r?: [min: number, max: number], z?: [min: number, max: number] }} [extents] Manually set the extents of the x, y or r scale as a two-dimensional array of the min and max you want. Setting values here will skip any dynamic extent calculation of the data for that dimension. */
		extents = {},

		/** @type {Array<Object|Array<any>>|undefined} [flatData=data] A flat version of data. */
		flatData = data,

		/** @type {Object} custom Any extra configuration values you want available on the LayerCake context. This could be useful for color lookups or additional constants. */
		custom = {},

		/** @type {boolean} debug Enable debug printing to the console. Useful to inspect your scales and dimensions. */
		debug = false,
		/** @type {boolean} [verbose=true] Show warnings in the console. */
		verbose = true
	} = $props();

	/**
	 * Make this reactive
	 */
	const yReverseValue = $derived(
		typeof yReverse === 'undefined' ? typeof yScale.bandwidth !== 'function' : yReverse
	);

	/* --------------------------------------------
	 * Keep track of whether the component has mounted
	 * This is used to emit warnings once we have measured
	 * the container object and it doesn't have proper dimensions
	 */
	let isMounted = false;
	onMount(() => {
		isMounted = true;
	});

	/* --------------------------------------------
	 * Preserve a copy of our passed in settings before we modify them
	 * Return this to the user's context so they can reference things if need be
	 * Add the active keys since those aren't on our settings object.
	 * This is mostly an escape-hatch
	 */
	const config = {
		x,
		y,
		z,
		r,
		xDomain,
		yDomain,
		zDomain,
		rDomain,
		xRange,
		yRange,
		zRange,
		rRange
	};
	$effect(() => {
		config.x = x;
	});
	$effect(() => {
		config.y = y;
	});
	$effect(() => {
		config.z = z;
	});
	$effect(() => {
		config.r = r;
	});
	$effect(() => {
		config.xDomain = xDomain;
	});
	$effect(() => {
		config.yDomain = yDomain;
	});
	$effect(() => {
		config.zDomain = zDomain;
	});
	$effect(() => {
		config.rDomain = rDomain;
	});
	$effect(() => {
		config.xRange = xRange;
	});
	$effect(() => {
		config.yRange = yRange;
	});
	$effect(() => {
		config.zRange = zRange;
	});
	$effect(() => {
		config.rRange = rRange;
	});

	/* --------------------------------------------
	 * Make store versions of each parameter
	 * Prefix these with `_` to keep things organized
	 */
	// const _percentRange = $state(percentRange);
	// const _containerWidth = $state(containerWidth);
	// const _containerHeight = $state(containerHeight);
	const filteredExtents = $state(filterObject(extents));
	// const _data = $state(data);
	// const _flatData = $state(flatData || data);
	// const _padding = $state(padding);
	const _x = $state(makeAccessor(x));
	const _y = $state(makeAccessor(y));
	const _z = $state(makeAccessor(z));
	const _r = $state(makeAccessor(r));
	// const _xDomain = $state(xDomain);
	// const _yDomain = $state(yDomain);
	// const _zDomain = $state(zDomain);
	// const _rDomain = $state(rDomain);
	// const _xNice = $state(xNice);
	// const _yNice = $state(yNice);
	// const _zNice = $state(zNice);
	// const _rNice = $state(rNice);
	// const _xReverse = $state(xReverse);
	// const _yReverse = $state(yReverseValue);
	// const _zReverse = $state(zReverse);
	// const _rReverse = $state(rReverse);
	// const _xPadding = $state(xPadding);
	// const _yPadding = $state(yPadding);
	// const _zPadding = $state(zPadding);
	// const _rPadding = $state(rPadding);
	// const _xRange = $state(xRange);
	// const _yRange = $state(yRange);
	// const _zRange = $state(zRange);
	// const _rRange = $state(rRange);
	// const _xScale = $state(xScale);
	// const _yScale = $state(yScale);
	// const _zScale = $state(zScale);
	// const _rScale = $state(rScale);
	// const _xDomainSort = $state(xDomainSort);
	// const _yDomainSort = $state(yDomainSort);
	// const _zDomainSort = $state(zDomainSort);
	// const _rDomainSort = $state(rDomainSort);
	// const _config = $state(config);
	// const _custom = $state(custom);

	// percentRange = $derived(percentRange);
	// containerWidth = $derived(containerWidth);
	// containerHeight = $derived(containerHeight);
	// extents = $derived(filterObject(extents));
	// data = $derived(data);
	// flatData = $derived(flatData || data);
	// padding = $derived(padding);
	// x = $derived(makeAccessor(x));
	// y = $derived(makeAccessor(y));
	// z = $derived(makeAccessor(z));
	// r = $derived(makeAccessor(r));
	// xDomain = $derived(xDomain);
	// yDomain = $derived(yDomain);
	// zDomain = $derived(zDomain);
	// rDomain = $derived(rDomain);
	// xNice = $derived(xNice);
	// yNice = $derived(yNice);
	// zNice = $derived(zNice);
	// rNice = $derived(rNice);
	// xReverse = $derived(xReverse);
	// yReverse = $derived(yReverseValue);
	// zReverse = $derived(zReverse);
	// rReverse = $derived(rReverse);
	// xPadding = $derived(xPadding);
	// yPadding = $derived(yPadding);
	// zPadding = $derived(zPadding);
	// rPadding = $derived(rPadding);
	// xRange = $derived(xRange);
	// yRange = $derived(yRange);
	// zRange = $derived(zRange);
	// rRange = $derived(rRange);
	// xScale = $derived(xScale);
	// yScale = $derived(yScale);
	// zScale = $derived(zScale);
	// rScale = $derived(rScale);
	// custom = $derived(custom);
	// config = $derived(config);

	/* --------------------------------------------
	 * Create derived values
	 * Suffix these with `_d`
	 */
	const activeGetters_d = $derived.by(() => {
		const obj = {};
		if (x) obj.x = x;
		if (y) obj.y = y;
		if (z) obj.z = z;
		if (r) obj.r = r;
		return obj;
	});

	const defaultPadding = { top: 0, right: 0, bottom: 0, left: 0 };
	const padding_d = $derived.by(() => {
		containerWidth;
		containerHeight;
		return { ...defaultPadding, ...padding };
	});

	const boxRight = $derived(containerWidth - padding_d.right);
	const boxLeft = $derived(padding_d.left);
	const boxWidth = $derived(boxRight - boxLeft);
	const boxBottom = $derived(containerHeight - padding_d.bottom);
	const boxTop = $derived(padding_d.top);
	const boxHeight = $derived(boxBottom - boxTop);
	const box_d = $derived({
		right: boxRight,
		left: boxLeft,
		width: boxWidth,
		bottom: boxBottom,
		top: boxTop,
		height: boxHeight
	});

	if (verbose) {
		$effect(() => {
			if (!isMounted) {
				return;
			}
			if (boxWidth <= 0) {
				console.warn(
					'[LayerCake] Target div has zero or negative width. Did you forget to set an explicit width in CSS on the container?'
				);
			}
			if (boxHeight <= 0) {
				console.warn(
					'[LayerCake] Target div has zero or negative height. Did you forget to set an explicit height in CSS on the container?'
				);
			}
		});
	}

	const width_d = $derived(box_d.width);

	const height_d = $derived(box_d.height);

	/* --------------------------------------------
	 * Calculate extents by taking the extent of the data
	 * and filling that in with anything set by the user
	 * Note that this is different from an "extent" passed
	 * in as a domain, which can be a partial domain
	 */
	const extents_d = $derived.by(() => {
		const getters = filterObject(activeGetters_d, extents);
		if (Object.keys(getters).length === 0) {
			return {};
		}
		const scaleLookup = {
			x: { scale: xScale, sort: xDomainSort },
			y: { scale: yScale, sort: yDomainSort },
			r: { scale: rScale, sort: rDomainSort },
			z: { scale: zScale, sort: zDomainSort }
		};
		const activeScales = Object.fromEntries(Object.keys(getters).map(k => [k, scaleLookup[k]]));

		const calculatedExtents = calcScaleExtents(flatData, getters, activeScales);
		return { ...calculatedExtents, ...extents };
	});

	const xDomain_d = $derived(calcDomain('x', [extents_d, xDomain]));
	const yDomain_d = $derived(calcDomain('y', [extents_d, yDomain]));
	const zDomain_d = $derived(calcDomain('z', [extents_d, zDomain]));
	const rDomain_d = $derived(calcDomain('r', [extents_d, rDomain]));

	const xScale_d = $derived(
		createScale('x', [
			xScale,
			extents_d,
			xDomain_d,
			xPadding,
			xNice,
			xReverse,
			width_d,
			height_d,
			xRange,
			percentRange
		])
	);
	const xGet_d = $derived(createGetter([x, xScale]));

	const yScale_d = $derived(
		createScale('y', [
			yScale,
			extents_d,
			yDomain_d,
			yPadding,
			yNice,
			yReverseValue,
			width_d,
			height_d,
			yRange,
			percentRange
		])
	);
	const yGet_d = $derived(createGetter([y, yScale]));

	const zScale_d = $derived(
		createScale('z', [
			zScale,
			extents_d,
			zDomain_d,
			zPadding,
			zNice,
			zReverse,
			width_d,
			height_d,
			zRange,
			percentRange
		])
	);
	const zGet_d = $derived(createGetter([z, zScale]));

	const rScale_d = $derived(
		createScale('r', [
			rScale,
			extents_d,
			rDomain_d,
			rPadding,
			rNice,
			rReverse,
			width_d,
			height_d,
			rRange,
			percentRange
		])
	);
	const rGet_d = $derived.by(createGetter([_r, rScale_d]));

	// Create new _Domains in case we ran `.nice()` over our domain on scale initialization
	const xDomain_d_possibly_nice = $derived(xScale_d.domain());
	const yDomain_d_possibly_nice = $derived(yScale_d.domain());
	const zDomain_d_possibly_nice = $derived(zScale_d.domain());
	const rDomain_d_possibly_nice = $derived(rScale_d.domain());

	const xRange_d = $derived(getRange([xScale_d]));
	const yRange_d = $derived(getRange([yScale_d]));
	const zRange_d = $derived(getRange([zScale_d]));
	const rRange_d = $derived(getRange([rScale_d]));

	const aspectRatio_d = $derived(width_d / height_d);

	const context = $derived({
		activeGetters: activeGetters_d,
		width: width_d,
		height: height_d,
		percentRange,
		aspectRatio: aspectRatio_d,
		containerWidth,
		containerHeight,
		x: _x,
		y: _y,
		z: _z,
		r: _r,
		custom,
		data,
		xNice,
		yNice,
		zNice,
		rNice,
		xDomainSort,
		yDomainSort,
		zDomainSort,
		rDomainSort,
		xReverse,
		yReverseValue,
		zReverse,
		rReverse,
		xPadding,
		yPadding,
		zPadding,
		rPadding,
		padding: padding_d,
		flatData: flatData,
		extents: extents_d,
		xDomain: xDomain_d_possibly_nice,
		yDomain: yDomain_d_possibly_nice,
		zDomain: zDomain_d_possibly_nice,
		rDomain: rDomain_d_possibly_nice,
		xRange: xRange_d,
		yRange: yRange_d,
		zRange: zRange_d,
		rRange: rRange_d,
		config,
		xScale: xScale_d,
		xGet: xGet_d,
		yScale: yScale_d,
		yGet: yGet_d,
		zScale: zScale_d,
		zGet: zGet_d,
		rScale: rScale_d,
		rGet: rGet_d
	});

	$effect(() => setContext('LayerCake', context));

	$effect(() => {
		if (box_d && debug === true && (ssr === true || typeof window !== 'undefined')) {
			// Call this as a debounce so that it doesn't get called multiple times as these vars get filled in
			printDebug_debounced({
				data: data,
				flatData: typeof flatData !== 'undefined' ? flatData : null,
				boundingBox: box_d,
				activeGetters: activeGetters_d,
				x: config.x,
				y: config.y,
				z: config.z,
				r: config.r,
				xScale: xScale_d,
				yScale: yScale_d,
				zScale: zScale_d,
				rScale: rScale_d
			});
		}
	});
</script>

{#if ssr === true || typeof window !== 'undefined'}
	<div
		bind:this={element}
		class="layercake-container"
		style:position
		style:top={position === 'absolute' ? '0' : null}
		style:right={position === 'absolute' ? '0' : null}
		style:bottom={position === 'absolute' ? '0' : null}
		style:left={position === 'absolute' ? '0' : null}
		style:pointer-events={pointerEvents === false ? 'none' : null}
		bind:clientWidth={containerWidth}
		bind:clientHeight={containerHeight}
	>
		<slot
			{element}
			width={width_d}
			height={height_d}
			aspectRatio={aspectRatio_d}
			{containerWidth}
			{containerHeight}
			activeGetters={activeGetters_d}
			{percentRange}
			{x}
			{y}
			{z}
			{r}
			{custom}
			{data}
			{xNice}
			{yNice}
			{zNice}
			{rNice}
			{xDomainSort}
			{yDomainSort}
			{zDomainSort}
			{rDomainSort}
			{xReverse}
			yReverse={yReverseValue}
			{zReverse}
			{rReverse}
			{xPadding}
			{yPadding}
			{zPadding}
			{rPadding}
			padding={padding_d}
			{flatData}
			extents={extents_d}
			xDomain={xDomain_d}
			yDomain={yDomain_d}
			zDomain={zDomain_d}
			rDomain={rDomain_d}
			xRange={xRange_d}
			yRange={yRange_d}
			zRange={zRange_d}
			rRange={rRange_d}
			{config}
			xScale={xScale_d}
			xGet={xGet_d}
			yScale={yScale_d}
			yGet={yGet_d}
			zScale={zScale_d}
			zGet={zGet_d}
			rScale={rScale_d}
			rGet={rGet_d}
		/>
	</div>
{/if}

<style>
	.layercake-container,
	.layercake-container :global(*) {
		box-sizing: border-box;
	}
	.layercake-container {
		width: 100%;
		height: 100%;
	}
</style>
