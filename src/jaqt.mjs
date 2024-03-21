/**
 * checks if data is a plain object and not null, String, Number, Boolean or Array or other classes
 * 
 * @param  {mixed}  data The data to check
 * @return {Boolean}     True if data is a plain object
 */
function isPlainObject(data) 
{
    return data?.constructor === Object 
        || data?.constructor === undefined // object with null prototype: Object.create(null)
}

export function one(selectFn, whichOne='last') {
    return (data, key, context) => {
        let result = selectFn(data, key, context)
        if (Array.isArray(result)) {
            if (whichOne=='last') {
                result = result.pop()
            } else if (whichOne=='first') {
                result = result.shift()
            } else if (typeof whichOne == 'function') {
                result = whichOne(result)
            }
        }
        return result
    }
}

export function many(selectFn) {
    return (data, key, context) => {
        let result = selectFn(data, key, context)
        if (result == null) {
            result = []
        } else if (!Array.isArray(result)) {
            result = [result]
        }
        return result
    }
}

/**
 * implements a minimal graphql-alike selection syntax, using plain javascript
 * use with from(...arr).select
 * 
 * @param  {object|function} filter Which keys with which values you want
 * @return Function a function that selects values from objects as defined by filter
 */
function getSelectFn(filter) {
    let fns = []
    if (filter instanceof Function) {
        fns.push(filter)
    } else for (const [filterKey, filterValue] of Object.entries(filter)) {
        if (isPlainObject(filterValue)) {
            fns.push( (data) => { 
                return {
                    [filterKey]: from(data[filterKey]).select(filterValue)
                }
            })
        } else if (filterValue instanceof Function) {
            fns.push( (data) => {
                return {
                    [filterKey]: filterValue(data, filterKey, 'select')
                }
            })
        } else {
            fns.push( (data) => {
                return {
                    [filterKey]: filterValue 
                }
            })
        }
    }
    if (fns.length==1) {
        return fns[0]
    }
    return (data) => {
        let result = {}
        for (let fn of fns) {
            Object.assign(result, fn(data))
        }
        return result
    }
}

/**
 * This function checks whether the given data matches the given pattern
 * Pattern can be a function, a regular expression, an object or a literal value
 * The pattern is matched recursively
 * Use with from(...arr).where
 * 
 * @param  {mixed} pattern The pattern to test
 * @return Function        The filter function
 */
export function getMatchFn(pattern)
{
    let fns = []
    if (Array.isArray(pattern)) {
        throw new Error('not yet implemented')
    } else if (pattern instanceof RegExp) {
        fns.push((data) => pattern.test(data))
    } else if (pattern instanceof Function) {
        fns.push((data) => pattern(data))
    } else if (isPlainObject(pattern)) {
        let patternMatches = {}
        for (const [wKey, wVal] of Object.entries(pattern)) {
            patternMatches[wKey] = getMatchFn(wVal)
        }
        let matchFn = (data) => {
            if (Array.isArray(data)) {
                return data.filter(element => matchFn(element)).length>0
            }
            if (!isPlainObject(data)) {
                return false
            }
            for (let wKey in patternMatches) {
                let patternMatchFn = patternMatches[wKey]
                if (!patternMatchFn(data[wKey])) {
                    return false
                }
            }
            return true
        }
        fns.push(matchFn)
    } else {
        fns.push((data) => pattern==data)
    }
    if (fns.length==1) {
        return fns[0]
    }
    return (data) => {
        let result = {}
        for (let fn of fns) {
            if (!fn(data)) {
                return false
            }
        }
        return true
    }
}

/**
 * If used in a pattern for orderBy(), denotes that the key
 * value should be sorted ascending
 */
export const asc = Symbol('asc')

/**
 * If used in a pattern for orderBy(), denotes that the key
 * value should be sorted descending
 */
export const desc = Symbol('desc')

/**
 * Returns a function to sort an array according to the pattern. A pattern is
 * an object with keys which are a sub pattern object or
 * one of the asc/desc symbols, or a custom sort(a,b) function
 * @param  {mixed} pattern The comparison pattern
 * @return Function The function to use with toSorted()
 */
export function getSortFn(pattern) {
    let comparisons = Object.entries(pattern)
    let fns = []
    for (let [key,compare] of comparisons) {
        if (compare instanceof Function) {
            fns.push(compare)
        } else if (isPlainObject(compare)) {
            let subFn = getSortFn(compare)
            fns.push((a,b) => subFn(a[key],b[key]))
        } else if (compare === asc) {
            fns.push((a,b) => (a[key]>b[key] ? 1 : a[key]<b[key] ? -1: 0))
        } else if (compare === desc) {
            fns.push((a,b) => (a[key]<b[key] ? 1 : a[key]>b[key] ? -1: 0))
        } else {
            throw new Error('Unknown sort order',compare)
        }
    }
    if (fns.length==1) {
        return fns[0] // special case, if you only have one sort element, just return that, it is faster
    }
    return (a,b) => {
        for (let fn of fns) {
            let result = fn(a,b)
            if (result!==0) {
                return result
            }
        }
        return 0
    }
}


/**
 * Returns a function that groups an array by one or more values defined in the pattern
 * 
 * @param (object) data     The data to parse and get the group from
 * @param (object) pattern  The groups and instructions
 */
function groupBy(data, pattern) {
    let groups = {}

    function addEntity(matchingGroups, entity, groups) {
        for (let key in matchingGroups) {
            if (typeof groups[key] == 'undefined') {
                groups[key] = []
            }
            if (typeof matchingGroups[key] == 'function') {
                let result = matchingGroups[key](entity,groups[key],'groupBy')
                if (typeof result != 'undefined') {
                    groups[key] = result
                }
            } else {
                if (Array.isArray(groups[key])) {
                    groups[key] = {}
                }
                addEntity(matchingGroups[key], entity, groups[key])
            }
        }
    }

    /**
     * select the values of the pattern applied to data
     * and set those as group keys in the result
     */
    function getMatchingGroups(data, pattern) {
        let value = {}
        for (let prop in pattern) {
            let innerValue, defaultValue=[]
            if (isPlainObject(pattern[prop])) {
                if (Array.isArray(data[prop])) {
                    for (let v of data[prop]) {
                        Object.assign(value, getMatchingGroups(v, pattern[prop]))
                    }
                } else {
                    Object.assign(value, getMatchingGroups(data[prop], pattern[prop]))
                }
                continue
            } else if (typeof pattern[prop] == 'function') {
                defaultValue = pattern[prop]
            }
            if (data && typeof data[prop] != 'undefined') {
                innerValue = data[prop]
                if (Array.isArray(innerValue)) {
                    for (let v of innerValue) {
                        value[v] = defaultValue
                    }
                } else {
                    value[innerValue] = defaultValue
                }
            }
        }
        return value
    }

    for (let entity of data) {
        let matchingGroups = getMatchingGroups(entity, pattern)
        if (Array.isArray(matchingGroups)) {
            for (let g of matchingGroups) {
                addEntity(g, entity, groups)                    
            }
        } else {
            addEntity(matchingGroups, entity, groups)
        }
    }
    return groups
}

/**
 * Creates a function to sum (add) all grouped values, assumes/enforces all values are floats
 * 
 * @param fetchFn   the function that fetches the correct value, e.g. _.price
 * @return Function function (value, accumulator) => accumulator + value
 */
export function sum(fetchFn) {
    return (o,a) => {
        if (Array.isArray(a)) {
            a = 0
        }
        a += parseFloat(fetchFn(o)) || 0
        return a
    }
}

/**
 * Creates a function to average all grouped values, assumes/enforces all values are floats 
 * 
 * @param fetchFn   the function that fetches the correct value, e.g. _.price
 * @return Function function (value, accumulator) => average(accumulator + value)
 */
export function avg(fetchFn) {
    return (o,a) => {
        if (Array.isArray(a)) {
            a = new Number(0)
            a.count = 0
        }
        let count = a.count+1
        a = new Number(a + ((parseFloat(fetchFn(o)) || 0) - a) / count)
        a.count = count
        return a
    }
}

/**
 * Creates a function that removes duplicate values from the grouped data
 * 
 * @param fetchFn   the function that fetches the correct value, e.g. _.name
 * @return Function 
 */
export function distinct(fetchFn) {
    return (o, a) => {
        let v = fetchFn(o)
        if (!a.includes[v]) {
            a.push(v)
        }
        return a
    }
}

/**
 * Creates a function to count all grouped values
 * 
 * @param fetchFn   the function that fetches the correct value, e.g. _.price
 * @return Function function (value, accumulator) => accumulator + 1
 */
export function count() {
    return (o, a) => {
        if (Array.isArray(a)) {
            a = 0
        }
        return a+1
    }
}

/**
 * Creates a function to find the maximum value in all grouped values, assumes/enforces all values are floats 
 * 
 * @param fetchFn   the function that fetches the correct value, e.g. _.price
 * @return Function function (value, accumulator) => Math.max(accumulator, value)
 */
export function max(fetchFn) {
    return (o,a) => {
        if (Array.isArray(a)) {
            a = Number.NEGATIVE_INFINITY
        }
        let value = parseFloat(fetchFn(o))
        if (!isNaN(value) && value>a) {
            a = value
        }
        return a
    }
}

/**
 * Creates a function to find the minimum value in all grouped values, assumes/enforces all values are floats 
 * 
 * @param fetchFn   the function that fetches the correct value, e.g. _.price
 * @return Function function (value, accumulator) => Math.min(accumulator, value)
 */
export function min(fetchFn) {
    return (o,a) => {
        if (Array.isArray(a)) {
            a = Number.POSITIVE_INFINITY
        }
        let value = parseFloat(fetchFn(o))
        if (!isNaN(value) && value<a) {
            a = value
        }
        return a
    }
}

/**
 * Not inverts the result from the matches function.
 * It returns a function expecting a data parameter and inverts the result
 * of matching that data with the pattern given to not()
 * 
 * @param  {mixed} pattern The pattern to match not
 * @return {function}      A function that inverts the match, with a single data parameter
 */
export function not(pattern) 
{
    let matchFn = getMatchFn(pattern)
    return data => !matchFn(data)
}

/**
 * AnyOf returns a function that returns true if any of the patterns match the data parameter
 * 
 * @param  {...mixed} patterns The patterns to test
 * @return {Boolean}           True if at least one pattern matches
 */
export function anyOf(...patterns) 
{
    let matchFns = patterns.map(pattern => getMatchFn(pattern))
    return data => matchFns.some(fn => fn(data))
}

/**
 * AllOf returns a function that returns true if all of the patterns match the data parameter
 * 
 * @param  {...mixed} patterns The patterns to test
 * @return {Boolean}           True if all of the patterns match
 */
export function allOf(...patterns)
{
    let matchFns = patterns.map(pattern => getMatchFn(pattern))
    return data => matchFns
        .map(matchFn => matchFn(data))
        .filter(value => !value)
        .length===0
}

/**
 * Handler for proxying functions like filter, map, etc. So that
 * results of those functions will still be proxied when using from()
 * and you can chain .select() after it
 * 
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
 * 
 * @type {Object}
 */
const DataProxyHandler = {
    get(target, property) 
    {
        if (Array.isArray(target)) {
            switch(property) {
                case 'where':
                    return function(shape) {
                        let matchFn = getMatchFn(shape)
                        return new Proxy(target
                            .filter(element => matchFn(element))
                            , DataProxyHandler)
                    }
                break
                case 'select':
                    return function(filter) {
                        let selectFn = getSelectFn(filter)
                        return new Proxy(target
                            .map(element => selectFn(element))
                            , DataProxyHandler)
                    }
                break
                case 'orderBy':
                    return function(pattern) {
                        let sortFn = getSortFn(pattern)
                        return new Proxy(target
                            .toSorted(sortFn)
                            , DataProxyHandler)
                    }
                break
                case 'groupBy':
                    return function(groups) {
                        let temp = groupBy(target, groups)
                        return new Proxy(temp
                            , DataProxyHandler)
                    }
                break
            }
        }
        if (target && typeof target==='object') {
            if (property==='select') {
                return function(filter) {
                    let selector = getSelectFn(filter)
                    return new Proxy(selector(target), DataProxyHandler)
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
 * 
 * @type {Object}
 */
const EmptyHandler = {
    get(target, property) 
    {
        switch(property) {
            case 'where':
                return function() {
                    return new Proxy([], EmptyHandler)
                }
            break
            case 'select':
                return function() {
                    return null
                }
            break
            case 'orderBy':
                return function() {
                    return new Proxy([], EmptyHandler)
                }
            break
            case 'groupBy':
                return function() {
                    return new Proxy([], EmptyHandler)
                }
            break
        }
        if (target && typeof target[property]==='function') {
            return new Proxy(target[property], FunctionProxyHandler)
        }
        return null
    }
}

/**
 * This returns a proxy object for the given data, that adds
 * .where() and .select() functions
 * 
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
 * 
 * @param  {mixed} data Any data
 * @param  {string} key Optional key for data objects in select context or group in groupBy context
 * @param  {string} context Optional, whether in select or groupBy context
 * @param  {array}  group Optional, contains group in groupBy context
 * @return {mixed}      Data or data[key]
 */
function getVal(data, key, context) 
{
    switch(context) {
        case 'groupBy':
            key.push(data)
        break
        case 'select':
        default:
            let result = data
            if (key) {
                result = data ? data[key] : null
            }
            return result
        break
    }
}

/**
 * Handler for the getval proxy, used to implement _
 * The get trap handles things like _.key, it returns a function
 * so that select can apply it on result objects
 * 
 * @type {Object}
 */
const handler = {
    get(target, property) 
    {
        //@FIXME: this implementation only allows for _.name
        //not for _.films.title for example
        //should probably return a new Proxy for getVal
        //with element[property] as the data
        return (element,key,context) => {
            if (!element) {
                return null
            }
            if (context=='groupBy') {
                key.push(element[property])
            } else {
                return element[property]
            }
        }
    },
    apply(target, thisArg, argumentsList) 
    {
        return target(...argumentsList)
    }
}

/**
 * Placeholder in select queries that gets replaced with the 
 * object or value being selected, or a specific key of that object
 * 
 * @type {Proxy}
 */
export const _ = new Proxy(getVal, handler)
