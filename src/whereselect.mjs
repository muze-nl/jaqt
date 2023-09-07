/**
 * checks if data is an object and not null, String, Number, Boolean or Array
 * @param  {mixed}  data The data to check
 * @return {Boolean}     True if data is an object and not null, String, Number, Boolean or Array
 */
function isObject(data) 
{
    return typeof data === 'object' && !(
        data instanceof String
        || data instanceof Number
        || data instanceof Boolean
        || Array.isArray(data)
        || data === null
    )
}

/**
 * implements a minimal graphql-alike selection syntax, using plain javascript
 * use with Array.prototype.select defined above
 * @param  {any}             data   The data to select keys and values from
 * @param  {object|function} filter Which keys with which values you want
 * @return {object}                 The result object 
 */
export function select(data, filter) 
{
    let result = {} // make sure that arrays are handled somewhere else
    if (filter instanceof Function) {
        filter = filter(data)
    }

    for (const [filterKey,filterValue] of Object.entries(filter)) {
    
        if (isObject(filterValue)) {
            if (Array.isArray(data[filterKey])) {
                result[filterKey] = from(data[filterKey]).select(filterValue)
            } else if (isObject(data[filterKey])) {
                result[filterKey] = select(data[filterKey], filterValue)
            } else { // data[filterKey] doesn't exist
                //result[filterKey] = null
            }
        } else if (filterValue instanceof Function) {
            result[filterKey] = filterValue(data, filterKey)
        } else {
            result[filterKey] = filterValue
        }
        
    }
    return result
}

/**
 * This function checks whether the given data matches the given pattern
 * Pattern can be a function, a regular expression, an object or a literal value
 * The pattern is matched recursively
 * @param  {mixed} data    The data to match to the pattern
 * @param  {mixed} pattern The pattern to test
 * @return {Boolean}         True if the pattern matches the data
 */
export function matches(data, pattern) 
{
    if (Array.isArray(pattern)) {
        //return from(data).where(pattern).length>0
        throw new Error('not yet implemented')
    } else if (pattern instanceof RegExp) {
        return pattern.test(data)
    } else if (pattern instanceof Function) {
        return pattern(data)
    } else if (isObject(pattern)) {
        if (Array.isArray(data)) {
            return data.filter(element => matches(element,pattern)).length>0
        }
        if (!isObject(data)) {
            return false
        }
        for (const [wKey, wVal] of Object.entries(pattern)) {
          if (!matches(data[wKey], wVal)) {
              return false
          }
        }
        return true
    } else {
        return pattern===data
    }
}

/**
 * Not inverts the result from the matches function.
 * It returns a function expecting a data parameter and inverts the result
 * of matching that data with the pattern given to not()
 * @param  {mixed} pattern The pattern to match not
 * @return {function}      A function that inverts the match, with a single data parameter
 */
export function not(pattern) 
{
    return data => !matches(pattern,data)
}

/**
 * AnyOf returns a function that returns true if any of the patterns match the data parameter
 * @param  {...mixed} patterns The patterns to test
 * @return {Boolean}           True if at least one pattern matches
 */
export function anyOf(...patterns) 
{
    return data => patterns.some(pattern => matches(data, pattern))
}

/**
 * AllOf returns a function that returns true if all of the patterns match the data parameter
 * @param  {...mixed} patterns The patterns to test
 * @return {Boolean}           True if all of the patterns match
 */
export function allOf(...patterns)
{
    return data => patterns
        .map(pattern => matches(data, pattern))
        .filter(value => !value)
        .length===0
}

/**
 * Handler for proxying functions like filter, map, etc. So that
 * results of those functions will still be proxied when using from()
 * and you can chain .select() after it
 * @type {Object}
 */
const FunctionProxyHandler = {
    apply(target, thisArg, argumentsList) 
    {
        let result = target.apply(thisArg,argumentsList)
        if (typeof result === 'object') {
            return new Proxy(result, DataProxyHandler)
        }
        return result
    }
}

/**
 * Handler for proxying data returned with from()
 * @type {Object}
 */
const DataProxyHandler = {
    get(target, property) 
    {
        if (Array.isArray(target)) {
            if (property==='where') {
                return function(shape) {
                    return new Proxy(target.filter(element => matches(element, shape)), DataProxyHandler)
                }
            }
            if (property==='select') {
                return function(filter) {
              return new Proxy(target.map(element => select(element, filter)), DataProxyHandler)
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

/**
 * Handler for proxying null of undefined values, so that
 * you can still chain the from.where.select functions
 * @type {Object}
 */
const EmptyHandler = {
    get(target, property) 
    {
        if (property==='where') {
            return function() {
                return new Proxy([], EmptyHandler)
            }
        }
        if (property==='select') {
            return function() {
                return null
            }
        }
        return null
    }
}

/**
 * This returns a proxy object for the given data, that adds
 * .where() and .select() functions
 * @param  {mixed} data The data to proxy
 * @return {Proxy}      The proxy
 */
export function from(data) 
{
    if (!data || typeof data !== 'object') {
        return new Proxy([], EmptyHandler)
    }
    return new Proxy(data, DataProxyHandler)
}

/**
 * This is the function that _ is mapped to
 * It returns either the data given, or if a key is set, 
 * it returns the value of data[key]
 * This allows you to use either _ or _.key in the select()
 * queries
 * @param  {mixed} data Any data
 * @param  {string} key Optional key for data objects
 * @return {mixed}      Data or data[key]
 */
function getVal(data, key) 
{
  return key ? data[key] : data
}

/**
 * Handler for the getval proxy, used to implement _
 * The get trap handles things like _.key, it returns a function
 * so that select can apply it on result objects
 * @type {Object}
 */
const handler = {
    get(target, property) 
    {
        return element => element[property]
    },
    apply(target, thisArg, argumentsList) 
    {
        return target(...argumentsList)
    }
}

/**
 * Placeholder in select queries that gets replaced with the 
 * object or value being selected, or a specific key of that object
 * @type {Proxy}
 */
export const _ = new Proxy(getVal, handler)
