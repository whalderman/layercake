import { zeroOrTruthy } from './zeroOrTruthy.js';
/**
	Make an accessor from a string, number, function or an array of the combination of any
	@param {String|Number|Function|Array<String|Number|Function>} acc The accessor function, key or list of them.
	@returns {Function | null} An accessor function.
*/
export default function makeAccessor(acc) {
	if (!zeroOrTruthy(acc)) return null;
	if (Array.isArray(acc)) {
		return d =>
			acc.map(k => {
				return typeof k !== 'function' ? d[k] : k(d);
			});
	}
	if (typeof acc !== 'function') {
		return d => d[acc];
	}
	return acc;
}
