/**
	A function to help truth test values. Returns a `true` if zero.
	@param {any} val The value to test.
	@returns {any}
*/
export function zeroOrTruthy(val) {
	if (val === 0) {
		return true;
	}
	return val;
}
