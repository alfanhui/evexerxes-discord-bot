export function abbreviateNumber(value:number) {
    var shortValueAnswer: string;
    if (value >= 1000000) {
        var suffixes: Array<string> = ["", "", "m", "b","t"];
        var suffixNum: number = Math.floor( (""+value).length/3 );
        var shortValue: number;
        for (var precision = 2; precision >= 1; precision--) {
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
            var dotLessShortValue: string = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
            if (dotLessShortValue.length <= 2) { break; }
        }
        if (shortValue % 1 != 0){
            shortValueAnswer = shortValue.toFixed(1).toString();
            return  shortValueAnswer+suffixes[suffixNum];
        }  
        return shortValue+suffixes[suffixNum];  
    }
    return Number(value).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}