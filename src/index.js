const fs = require('fs');
const csvSync = require('csv-parse/lib/sync'); // requiring sync module
const sta = require("simple-statistics");

const test_mode = false; //test用jsonファイルで計算する
// ################
// ### issue
// ################
// ★最低 stdを計算するの大切 ave 0.42 std 0.75 * 3.5 は問題なさそう 0.52 0.072 * 3.5 = 0.739はやや危険。
// ★reportのファイル削減
// ★[考察]何が利益を生むのか？ => 瞬間的なスプレッドの開き std

//################
//### Complete
//################
// ★r2の停止などにより、データがない場合は計算しない（例えば100サンプル以下）
// ★最低targetProfitPercentの設定　=> myconfig minTargetPercentで設定
// ★myconfigにave,std書き出し
// ★


//********************//
//*** Init
//********************//
let myconfig = JSON.parse(fs.readFileSync("./src/myconfig.json", 'utf8'));

let file_report = myconfig.r2path + "/reports/spreadStat.csv";
let file_config = myconfig.r2path + "/config.json";

//const exportfilepath = myconfig.r2path + "/reports/spreadStat-tt.csv";

const targeHour = myconfig.targeHour;
//console.log("targetHour:",targeHour);

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

//暫定的に
if(res.length < 100) process.exit(0);

for(let i = 1; i < res.length; i++){

    let recordTime = transformStrToDate(res[i][0]);
    //console.log("recordTime:",recordTime)

    //基準時間よりも前のデータの場合は飛ばす
    if(recordTime.getTime() < ts_startTarget.getTime()){
        //console.log("continue");
        continue;
    }

    //負の値の場合は考慮しない
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

//////// target Profit Percent処理///////////////////////
console.log("xNumber:", myconfig.xNumber);

let tempStdDevProfitPercent = stdDevProfitPercent;
//stdが小さすぎる場合は、0.08以上にする。
if(tempStdDevProfitPercent < myconfig.stdDevPerMinLimit) {
    tempStdDevProfitPercent = myconfig.stdDevPerMinLimit;
    console.log("StdDevProfitPercent < myconfig.stdDevPerMinLimit = ", myconfig.stdDevPerMinLimit);
}

let targetProfit = averageBestProfit + stdDevBestProfit * myconfig.xNumber
let targetProfitPercent = averageProfitPercent + tempStdDevProfitPercent * myconfig.xNumber
targetProfitPercent = Math.round(targetProfitPercent * 100.0) / 100.0;

if(targetProfitPercent < myconfig.minTargetPercent){
    targetProfitPercent = myconfig.minTargetPercent;
    console.log("targetProfitPercent < myconfig.minTargetPercent:targetProfitPercent = ", targetProfitPercent);
}

console.log("");
console.log("readRecord:", (res.length - 1));
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

//////// JSON 書き込み処理///////////////////////
json.minTargetProfitPercent = targetProfitPercent;
console.log("minTargetProfitPercent:",json.minTargetProfitPercent);

//console.log(json)
fs.writeFile(file_config, JSON.stringify(json, null, '    '),()=>{
    console.log("... writeFile(config.json) is done.")
});

deleteLog(myconfig.r2path)

myconfig.averageProfitPercent = averageProfitPercent;
myconfig.stdDevProfitPercent = stdDevProfitPercent;

//console.log(json)
fs.writeFile("./src/myconfig.json", JSON.stringify(myconfig, null, '    '),()=>{
    console.log("... writeFile(myconfig.json) is done.")
});

saveArray = selectContent(res);

exportCSV(saveArray, file_report);

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

// 配列をcsvで保存するfunction
function exportCSV(content, filepath){

    let formatCSV ="";

    for (let i = 0; i < content.length; i++) {
        var value = content[i];
  
        for (let j = 0; j < value.length; j++) { var innerValue = value[j]===null?'':value[j].toString(); var result = innerValue.replace(/"/g, '""'); if (result.search(/("|,|\n)/g) >= 0)
        result = '"' + result + '"';
        if (j > 0)
        formatCSV += ',';
        formatCSV += result;
      }
      formatCSV += '\r\n';
    }
    fs.writeFile(filepath , formatCSV, 'utf8', function (err) {
      if (err) {
        console.log('保存できませんでした');
      } else {
        console.log('... rewrite spreadStat.csv is done.');
      }
    });
  }

  // 配列をcsvで保存するfunction
function selectContent(targetArray){

    let resultArray = [];

    let ts_startTarget = new Date();
    ts_startTarget.setHours(ts_startTarget.getHours() - 24); //24時間前から記録

    resultArray.push(targetArray[0])    //見出し行

    for (let i = 1; i < targetArray.length; i++) {

        let contentTime = transformStrToDate(targetArray[i][0]);

        if(contentTime.getTime() < ts_startTarget.getTime()){
            continue;
        }        
        
        resultArray.push(targetArray[i]);

    }

    return resultArray;
    
}