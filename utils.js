var dateFormat = require("dateformat");

// Helper function used to validate input
module.exports= {
    checkDefined: function(reference, referenceName) {
        if (!reference) {
            throw new Error(`Error: Parameter ${referenceName} is not defined`);
        }
        return reference;
    },

    dateToString: function(d) {
        d.setHours(15);
        return dateFormat(d, "yyyy-mm-dd");
    }
}