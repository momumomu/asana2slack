//main関数を5分おきに実行するためだけのTriggerを設定する関数
function createTrigger() {
  //main関数のTriggerが設定済か確認
  const currentTriggers = ScriptApp.getProjectTriggers();
  for(let i=0; i<currentTriggers.length; i++){
    let triggerName = currentTriggers[i].getHandlerFunction();
    if ( triggerName == "main" ){
      return  //設定済ならなにもせず終了
    }
  }
  //設定されていなければTriggerの設定
  //ScriptApp.newTrigger('main').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('main').timeBased().everyMinutes(1).create();
}