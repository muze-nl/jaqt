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
function subselect(data, filter) {
	let result = {} // make sure that arrays are handled somewhere else
	if (filter instanceof Function) {
		filter = filter(data)
	}
	for (const [fKey,fVal] of Object.entries(filter)) {
		if (isObject(fVal)) {
			if (Array.isArray(data[fKey])) {
				result[fKey] = data[fKey].select(fVal)
			} else if (isObject(data[fKey])) {
				result[fKey] = subselect(data[fKey], fVal)
			} else { // data[fKey] doesn't exist
				result[fKey] = null
			}
		} else if (fVal instanceof Function) {
			result[fKey] = fVal(data, fKey)
		} else if (isString(fVal) && typeof data[fVal]!=='undefined'){
			result[fKey] = data[fVal]
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
function match(data, where) {
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
	  		let matches = data[wKey].where(wVal)
	  		if (matches.length==0) {
	  			return false
	  		}
	  	} else if (isObject(data[wKey])) {
	  		let matches = match(data[wKey], wVal)
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

Object.defineProperty(Array.prototype, 'select', { 
  value: function(filter) {
    return this.map((_) => subselect(_, filter))
  }
})

Object.defineProperty(Object.prototype, 'select', {
	value: function(filter) {
		return subselect(this,filter)
	}
})

Object.defineProperty(Array.prototype, 'where', { 
  value: function(shape) {
    return this.filter((_) => match(_, shape))
  }
})

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

const _ = new Proxy(getVal, handler)

export default _
