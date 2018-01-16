const fs = require('fs');
const csvSync = require('csv-parse/lib/sync'); // requiring sync module
const sta = require("simple-statistics");


const test_mode = false;

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
const targeHour = myconfig.targeHour;
console.log("targetHour:",targeHour);

let totalRecord = 0;
let minusRecord = 0;

if(test_mode === true){
    file_report = file_report.replace(".csv","-test.csv");
    file_config = file_config.replace(".json","-test.json")

    console.log("-------- TEST MODE ---------")
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
arrayWorstProfit = [];
arrayWorstProfitPercent = [];

for(let i = 1; i < res.length; i++){

    let recordTime = transformStrToDate(res[i][0]);
    //console.log("recordTime:",recordTime)

    if(recordTime.getTime() < ts_startTarget.getTime()){
        //console.log("continue");
        continue;
    }

    if(Number(res[i][11]) < 0){
        minusRecord ++;
        continue;
    }

    arrayBestProfit.push(Number(res[i][10]));
    arrayBestProfitPercent.push(Number(res[i][11]));
    arrayWorstProfit.push(Number(res[i][21]));
    arrayWorstProfitPercent.push(Number(res[i][22]));

    totalRecord ++;
}


// console.log(res);
//console.log(arrayBestProfit);
console.log("");

let averageBestProfit = Math.round(sta.mean(arrayBestProfit) * 100.0) / 100.0;
let averageWorstProfit = Math.round(sta.mean(arrayWorstProfit) * 100.0) / 100.0;
let stdDevBestProfit = Math.round(sta.standardDeviation(arrayBestProfit) * 1000.0) / 1000.0;
let averageProfitPercent = Math.round(sta.mean(arrayBestProfitPercent) * 100.0) / 100.0;
let stdDevProfitPercent = Math.round(sta.standardDeviation(arrayBestProfitPercent) * 1000.0) / 1000.0;
let averageProfitPercent_worst = Math.round(sta.mean(arrayWorstProfitPercent) * 100.0) / 100.0;
let stdDevProfitPercent_worst = Math.round(sta.standardDeviation(arrayWorstProfitPercent) * 1000.0) / 1000.0;

console.log("xNumber:", myconfig.xNumber);
let targetProfit = averageBestProfit + stdDevBestProfit * myconfig.xNumber
let targetProfitPercent = averageProfitPercent + stdDevProfitPercent * myconfig.xNumber
targetProfitPercent = Math.round(targetProfitPercent * 100.0) / 100.0;

console.log("totalRecord:", totalRecord);
console.log("minusRecord:", minusRecord);
console.log("");

console.log("average BestProfit:",averageBestProfit);
console.log("stdDev BestProfit:", stdDevBestProfit);
console.log("average WorstProfit:",averageWorstProfit);
console.log("");
console.log("average BestProfitPercent:",averageProfitPercent);
console.log("stdDev BestProfitPercent:",stdDevProfitPercent);
console.log("Max BestProfitPercent:",sta.max(arrayBestProfitPercent));
console.log("Min BestProfitPercent:",sta.min(arrayBestProfitPercent));
console.log("");
console.log("average WorstProfitPercent:",averageProfitPercent_worst);
console.log("stdev WorstProfitPercent:",stdDevProfitPercent_worst);
console.log("");
console.log("TargetProfitPercent:",targetProfitPercent);

json.minTargetProfitPercent = targetProfitPercent;
console.log("minTargetProfitPercent:",json.minTargetProfitPercent);

//console.log(json)
fs.writeFile(file_config, JSON.stringify(json, null, '    '),()=>{
    console.log("... writeFile is done.")
});

deleteLog(myconfig.r2path)


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

function deleteLog(path){

    fs.writeFile(path + "/logs/debug.log", "",()=>{
        console.log("... debug.log is delete.");
    });

    fs.writeFile(path + "/logs/info.log", "",()=>{
        console.log("... info.log is delete.");
    });

}