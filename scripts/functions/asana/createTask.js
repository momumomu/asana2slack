function createTask(asanaApiToken, myAsanaUserId, asanaWorkspaceId, privateProjectGid, SlackUrl, slackText){
  //事前処理
  //Project上に"slack_url"というカスタムフィールドがあるか確認する
  let customFieldGid = getCustomFieldToProject(
    asanaApiToken,
    privateProjectGid,
    "slack_url"
  );

  //Project上に"slack_url"というカスタムフィールドがなければ作成する
  if ( customFieldGid === null){
    customFieldGid = addCustomFieldToProject(
      asanaApiToken,
      privateProjectGid,
      "slack_url"
    )
    Utilities.sleep(1000); //1秒sleep
  };

  //headerを定義
  headers = {
    'Authorization': 'Bearer ' + asanaApiToken,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }

  const payload = {
    "data": {
      "assignee": myAsanaUserId,
      "name" : slackText.substring(0,80),
      "notes": slackText,
      "workspace": asanaWorkspaceId,
      "projects": [
        privateProjectGid
      ],
      "custom_fields": {
        [customFieldGid]: SlackUrl
      }
    }
  }
  const options = {
    "payload" : JSON.stringify(payload),
    'method': 'post',
    'headers': headers,
    'muteHttpExceptions': true //エラーを無視する
  }  
  //endpointURLの生成
  const endpoint_url = "https://app.asana.com/api/1.0" + "/tasks"

  //post処理を実行
  const response = UrlFetchApp.fetch(endpoint_url, options);
  const responseJson = JSON.parse(response);
  //console.log(responseJson);
}