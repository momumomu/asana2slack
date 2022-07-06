function getWorkspace(asanaApiToken, targetWorkspaceName){
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
  //endpointURLを生成(/workspaces)
  const endpoint_url = "https://app.asana.com/api/1.0" + "/workspaces";
  //console.log("[debug]EndpointUrl:", endpoint_url);
  
  //GET処理
  const response = UrlFetchApp.fetch(endpoint_url, options);
  const responseJson = JSON.parse(response);
  
  //合致するプロジェクト名があればgidを返却
  for(let i=0; i<responseJson["data"].length; i++){
    let name = responseJson["data"][i]["name"];
    if ( targetWorkspaceName == name ){
      return responseJson["data"][i]["gid"];
    }
  }
  //合致するプロジェクト名がなければnullを返却
  return null
}