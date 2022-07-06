function getCustomFieldToProject(asanaApiToken, project_gid, customFieldName){
  //headerを定義
  headers = {
    'Authorization': 'Bearer ' + asanaApiToken,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
  //optionsを定義
  const options = {
    'method': 'get',
    'headers': headers,
  }
  //endpointURLを生成(/projects/{project_gid}/custom_field_settings)
  const endpoint_url = "https://app.asana.com/api/1.0" + "/projects" + "/" + project_gid + "/custom_field_settings"
  //console.log("[debug]endpoint_url(get):", endpoint_url);

  //get処理を実行
  const response = UrlFetchApp.fetch(endpoint_url, options);
  const responseJson = JSON.parse(response);
  
  //対象のcustom fieldがあればgidを返却する
  for(let i=0; i < responseJson["data"].length; i++){
    let name = responseJson["data"][i]["custom_field"]["name"];
    if ( customFieldName == name ){
      return responseJson["data"][i]["custom_field"]["gid"];
    }
  }

  //存在しなければnullを返却
  return null
}