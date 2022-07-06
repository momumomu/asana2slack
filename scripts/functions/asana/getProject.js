function getProject(asanaApiToken, team_gid, targetProjectName){
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
  //endpointURLを生成(/teams/{team_gid}/projects)
  const endpoint_url = "https://app.asana.com/api/1.0" + "/teams" + "/" + team_gid + "/projects";
  //console.log("[debug]EndpointUrl:", endpoint_url);
  
  //GET処理
  const response = UrlFetchApp.fetch(endpoint_url, options);
  const responseJson = JSON.parse(response);
  
  //合致するプロジェクト名があればgidを返却
  for(let i=0; i<responseJson["data"].length; i++){
    let name = responseJson["data"][i]["name"];
    if ( targetProjectName == name ){
      return responseJson["data"][i]["gid"];
    }
  }
  //合致するプロジェクト名がなければnullを返却
  return null
}