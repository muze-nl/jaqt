function isObject(data) {
	return typeof data === 'object' && !(
		data instanceof String
		|| data instanceof Number
		|| data instanceof Boolean
		|| Array.isArray(data)
		|| data === null
	)
}

function isString(data) {
	return typeof data === 'string' || data instanceof String
}

/**
 * implements a minimal graphql-alike selection syntax, using plain javascript
 * use with Array.prototype.select defined above
 * @param  {any}             data   The data to select keys and values from
 * @param  {object|function} filter Which keys with which values you want
 * @return {object}                 The result object 
 */
function select(data, filter) {
	let result = {} // make sure that arrays are handled somewhere else
	if (filter instanceof Function) {
		filter = filter(data)
	}
	for (const [fKey,fVal] of Object.entries(filter)) {
		if (isObject(fVal)) {
			if (Array.isArray(data[fKey])) {
				result[fKey] = from(data[fKey]).select(fVal)
			} else if (isObject(data[fKey])) {
				result[fKey] = select(data[fKey], fVal)
			} else { // data[fKey] doesn't exist
				result[fKey] = null
			}
		} else if (fVal instanceof Function) {
			result[fKey] = fVal(data, fKey)
		} else {
			result[fKey] = fVal
		}
	}
	return result
}

/**
 * Implements a filter that matches the data object
 * with the shape/where parameter.
 * @param  {object} data  The data to match
 * @param  {object} where The shape to match data with
 * @return {bool}         True if the data matches, false otherwise
 */
function where(data, where) {
	for (const [wKey, wVal] of Object.entries(where)) {
	  if (wVal instanceof Function) {
	  	let matches = wVal(data, wKey)
	  	if (!matches) {
	  		return false
	  	}
	  } else if (wVal instanceof RegExp) {
	  	let matches = wVal.test(data[wKey])
	  	if (!matches) {
	  		return false
	  	}
	  } else if (isObject(wVal)) {
	  	if (Array.isArray(data[wKey])) {
	  		let matches = from(data[wKey]).where(wVal)
	  		if (matches.length==0) {
	  			return false
	  		}
	  	} else if (isObject(data[wKey])) {
	  		let matches = where(data[wKey], wVal)
	  		if (!matches) {
	  			return false
	  		}
	  	} else {
	  		return false
	  	}
	  } else if (data[wKey]!==wVal) {
	  	return false
	  }
	}
	return true
}

const FunctionProxyHandler = {
	apply(target, thisArg, argumentsList) {
		let result = target.apply(thisArg,argumentsList)
		if (typeof result === 'object') {
			return new Proxy(result, DataProxyHandler)
		}
		return result
	}
}

const DataProxyHandler = {
	get(target, property) {
		if (Array.isArray(target)) {
			if (property==='where') {
				return function(shape) {
					return new Proxy(target.filter(_ => where(_, shape)), DataProxyHandler)
				}
			}
			if (property==='select') {
				return function(filter) {
  		    return new Proxy(target.map(_ => select(_, filter)), DataProxyHandler)
				}
			}
		}
		if (target && typeof target==='object') {
			if (property==='select') {
				return function(filter) {
					return new Proxy(select(target, filter), DataProxyHandler)
				}
			}
		}
		if (target && typeof target[property]==='function') {
			return new Proxy(target[property], FunctionProxyHandler)
		}
		return target[property]
	}
}

const EmptyHandler = {
	get(target, property) {
		if (property==='where') {
			return function(shape) {
				return new Proxy([], EmptyHandler)
			}
		}
		if (property==='select') {
			return function(filter) {
				return null
			}
		}
		return null
	}
}

export function from(data) {
	if (!data || typeof data !== 'object') {
		return new Proxy([], EmptyHandler)
	}
	return new Proxy(data, DataProxyHandler)
}

function getVal(data, key) {
  return key ? data[key] : data
}

const handler = {
	get(target, property) {
		return (_) => _[property]
	},
	apply(target, thisArg, argumentsList) {
		return target(...argumentsList)
	}
}

export const _ = new Proxy(getVal, handler)
