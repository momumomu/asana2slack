function getDetailProject(asanaApiToken, projects_gid){
  //headerを定義
  headers = {
    'Authorization': 'Bearer ' + asanaApiToken,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
  //optionsを定義
  var options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': headers
  }
  
  const endpoint_url = "https://app.asana.com/api/1.0" + "/projects" + "/" + projects_gid;
  var response = UrlFetchApp.fetch(endpoint_url, options);
  var responseJson = JSON.parse(response);
  
  //結果を返却
  return responseJson;  
}