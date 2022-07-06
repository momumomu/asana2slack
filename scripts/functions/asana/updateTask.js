function updateTask(asanaApiToken, tasks_gid, slackUrl, eventType, projects_gid_list=[]){
  let payload = {}; //初期値
  if ( eventType == "addSlackUrl"){
    //事前処理
    if ( projects_gid_list == [] ){
      return
    }
    let customFieldGid
    for(let i=0; i<projects_gid_list.length; i++){
      let projects_gid = projects_gid_list[i];
      //Project上に"slack_url"というカスタムフィールドがあるか確認する
      let customFieldGid_ = getCustomFieldToProject(
        asanaApiToken,
        projects_gid,
        "slack_url"
      );      
      //Project上に"slack_url"というカスタムフィールドがなければ作成する
      if ( customFieldGid_ === null){
        customFieldGid_ = addCustomFieldToProject(
          asanaApiToken,
          projects_gid,
          "slack_url"
        )
        Utilities.sleep(1000); //1秒sleep
      };
      customFieldGid = customFieldGid_; //どれでもいいので適当に代入
    };
    //payloadを定義
    payload = {
      "data": {
        "custom_fields": {
          [customFieldGid]: slackUrl
        }
      }
    }
  }
  if ( eventType == "completed"){
    //payloadを定義
    payload = {
      "data": {
        "completed": true
      }
    }
  }
  //headerを定義
  headers = {
    'Authorization': 'Bearer ' + asanaApiToken,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }

  const options = {
    "payload" : JSON.stringify(payload),
    'method': 'put',
    'headers': headers,
    'muteHttpExceptions': true //エラーを無視する
  }
  //endpointURLの生成
  const endpoint_url = "https://app.asana.com/api/1.0" + "/tasks" + "/" + tasks_gid

  //post処理を実行
  const response = UrlFetchApp.fetch(endpoint_url, options);
  const responseJson = JSON.parse(response);
  //console.log("updateTask: ", responseJson);
}