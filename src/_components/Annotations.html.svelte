<!--
	@component
	Adds text annotations based on a config object that has CSS styles as fields.
 -->
<script>
	const physicalInsetProps = ['top', 'right', 'bottom', 'left'];

	let {
		/** @type {Array} annotations - A list of annotation objects. It expects values of `top`, `right`, `bottom` and `left` whose values are CSS values like `'10px'` or `'5%'` that will be used to absolutely position the text div. See the [Column](https://layercake.graphics/example/Column) chart example for the schema and options. */
		annotations = [],

		/** @type {(d: {text: string}) => string} [getText=d => d.text] - An accessor function to get the field to display. */
		getText = d => d.text
	} = $props();

	function fillStyle(annotation) {
		let style = '';
		for (const prop of physicalInsetProps) {
			const val = annotation[prop];
			if (val) {
				style += `${prop}:${val};`;
			}
		}
		return style;
	}
</script>

<div class="layercake-annotations">
	{#each annotations as annotation, i}
		<div class="layercake-annotation" data-id={i} style={fillStyle(annotation)}>
			{getText(annotation)}
		</div>
	{/each}
</div>

<style>
	.layercake-annotation {
		position: absolute;
	}
</style>
