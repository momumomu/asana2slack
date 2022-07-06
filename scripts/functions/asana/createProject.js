function createProject(asanaApiToken, team_gid, projectName){
  //headerを定義
  headers = {
    'Authorization': 'Bearer ' + asanaApiToken,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }

  //POSTオプションを定義
  const payload = {
    "data": {
      "name" : projectName,
      "public": false
    }
  }
  //optionsを定義
  const options = {
    "payload" : JSON.stringify(payload),
    'method': 'post',
    'headers': headers
  }  
  //endpointURLの生成(/teams/{team_gid}/projects)
  const endpoint_url = "https://app.asana.com/api/1.0" + "/teams" + "/" + team_gid + "/projects"
  
  //post処理
  const response = UrlFetchApp.fetch(endpoint_url, options);
  const responseJson = JSON.parse(response);
  //console.log(responseJson);

  //GIDを返却
  return responseJson["data"]["gid"]

}