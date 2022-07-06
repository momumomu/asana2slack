function addCustomFieldToProject(asanaApiToken, project_gid, customFieldName){
  //headerを定義
  headers = {
    'Authorization': 'Bearer ' + asanaApiToken,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
  //POSTオプションを定義
  const payload = {
    "data": {
      "custom_field": {
        "name": customFieldName,
        "resource_subtype": "text"
      }
    }
  }
  //optionsを定義
  const options = {
    "payload" : JSON.stringify(payload),
    'method': 'post',
    'headers': headers,
    'muteHttpExceptions': true //エラーを無視する
  }

  //endpointURLを生成(/projects/{project_gid}/addCustomFieldSetting)
  const endpoint_url = "https://app.asana.com/api/1.0" + "/projects" + "/" + project_gid + "/addCustomFieldSetting"
  //console.log("[debug]endpoint_url(post):", endpoint_url);

  //post処理
  const response = UrlFetchApp.fetch(endpoint_url, options);
  const responseJson = JSON.parse(response);
  //console.log("addCustomFieldToProject:", responseJson);

  //GIDを返却
  return responseJson["data"]["custom_field"]["gid"];
}