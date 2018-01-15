const fs = require('fs');
const csvSync = require('csv-parse/lib/sync'); // requiring sync module
const sta = require("simple-statistics");

const targeHour = "12";
const test_mode = true;

// ################
// ### issue
// ################
// ★
// ★

//################
//### Complete
//################
// ★
// ★
// ★
// ★


//********************//
//*** Init
//********************//
let myconfig = JSON.parse(fs.readFileSync("./src/myconfig.json", 'utf8'));


let file_report = myconfig.r2path + "/reports/spreadStat.csv";
let file_config = myconfig.r2path + "/config.json";

if(test_mode === true){
    file_report = file_report.replace(".csv","-test.csv");
    file_config = file_config.replace(".json","-test.json")

    console.log("-------- DEMO MODE ---------")
}

console.log(file_report);
console.log(file_config);
console.log(myconfig);

let data = fs.readFileSync(file_report);
var json = JSON.parse(fs.readFileSync(file_config, 'utf8'));
let res = csvSync(data);

let ts_now = new Date();
let ts_startTarget = new Date();
ts_startTarget.setHours(ts_startTarget.getHours() - targeHour);
console.log("ts_now:",ts_now);
console.log("ts_startTarget:",ts_startTarget);


console.log("minTargetProfitPercent:",json.minTargetProfitPercent);

//項目：日付時刻、 Best Ask、Best Bid、Best組み合わせ時の予想収益+収益率%、Worst Ask、Worst Bid、Worst組み合わせ時の予想収益+収益率
arrayBestProfit = [];
arrayBestProfitPercent = [];

for(let i = 1; i < res.length; i++){

    let recordTime = transformStrToDate(res[i][0]);
    //console.log("recordTime:",recordTime)

    if(recordTime.getTime() < ts_startTarget.getTime()){
        //console.log("continue");
        continue;
    }

    arrayBestProfit.push(Number(res[i][10]));
    arrayBestProfitPercent.push(Number(res[i][11]));
}


// console.log(res);
//console.log(arrayBestProfit);
console.log("average BestProfit:",sta.mean(arrayBestProfit));
console.log("stdeviation BestProfit:",sta.standardDeviation(arrayBestProfit));


let TargetProfitPercent = Math.round(sta.mean(arrayBestProfitPercent) * 100.0) / 100.0;
let stdTargetProfitPercent = Math.round(sta.standardDeviation(arrayBestProfitPercent) * 1000.0) / 1000.0;

console.log("average BestProfitPercent:",sta.mean(arrayBestProfitPercent));
console.log("stdeviation BestProfitPercent:",sta.standardDeviation(arrayBestProfitPercent));

console.log("TargetProfitPercent:",TargetProfitPercent);
console.log("stdTargetProfitPercent:",stdTargetProfitPercent);

json.minTargetProfitPercent = TargetProfitPercent + stdTargetProfitPercent * 3.0
console.log("minTargetProfitPercent:",json.minTargetProfitPercent);

//console.log(json)
fs.writeFile(file_config, JSON.stringify(json, null, '    '));




///////////////////////////////////////////////////////////////////////////

function transformStrToDate(timestamp){
    //2018-1-14 21:54:43
    array = timestamp.split(" ");

    array_date = array[0].split("-");
    array_time = array[1].split(":");

    result = new Date(array_date[0],(array_date[1]-1),array_date[2],array_time[0],array_time[1],array_time[2])
    //console.log("result:",result);

    return result;

}