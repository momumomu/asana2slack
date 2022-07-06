function getTeams(asanaApiToken, asanaWorkspaceId, myAsanaUserId, privateTeamName){
  //headerを定義
  headers = {
    'Authorization': 'Bearer ' + asanaApiToken,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
  //optionsを定義
  const options = {
    'method': 'get',
    'headers': headers
  }
  //endpointURLを生成
  const endpoint_url = "https://app.asana.com/api/1.0" + "/users" + "/" + myAsanaUserId + "/teams" + "?organization=" + asanaWorkspaceId + "&limit=100"
  
  //GET処理
  const response = UrlFetchApp.fetch(endpoint_url, options);
  const response_json = JSON.parse(response);
  
  //合致するチーム名があればgidを返却
  for(let i=0; i<response_json["data"].length; i++){
    let currentTeamName = response_json["data"][i]["name"];
    if ( privateTeamName == currentTeamName ){
      let currentTeamGid = response_json["data"][i]["gid"];
      return currentTeamGid;
    }
  }
  //合致するチーム名がなければnullを返却
  return null
}