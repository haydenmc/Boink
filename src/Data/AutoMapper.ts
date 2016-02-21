/**
 * AutoMapper is a utility for deep cloning and processing of incoming JSON objects
 * into proper JS objects with Observable properties for use in DataModels.
 */
class AutoMapper {
    /**
     * Maps an object to a new instance of the specified JS class.
     * @param {any} from The object to read from
     * @param {Function} to The class name of the object to map properties to
     */
    public static map(from: any, to: { new(): any }): any {
        var newObj = new to();
        for (var i in newObj) {
            // HACK: Check if this is an IObservable by seeing if it has a .value
            if (newObj.hasOwnProperty(i) && typeof newObj[i].value !== "undefined") {
                if (typeof from[i] !== "undefined") {
                    if (typeof from[i].value !== "undefined") {
                        newObj[i].value = from[i].value;
                    } else {
                        newObj[i].value = from[i];
                    }
                }
            }
        }
        return newObj;
    }
}
