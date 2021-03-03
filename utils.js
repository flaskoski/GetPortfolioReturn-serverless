var dateFormat = require("dateformat");

module.exports= {
    
// Helper function used to validate input
    checkDefined: function(reference, referenceName) {
        if (!reference) {
            throw new Error(`Parameter ${referenceName} is not defined`);
        }
        return reference;
    },

    dateToString: function(d) {
        d.setHours(15);
        return dateFormat(d, "yyyy-mm-dd");
        // return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    },

    // formatDate: function(date){
    //     if(!date || date.length != 3)
    //         return "";
    //     // 
    //     const dd = (date[2]<10 ? "0"+date[2] : date[2]) 
    //     const mm = (date[1]<10 ? "0"+date[1] : date[1])
    //     const yy = date[0]
    //     return `${dd}-${mm}-${yy}`;
    // }
}