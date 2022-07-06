//指定されたタスクIDの詳細を返却するだけの関数
function getTaskDetails(asanaApiToken, tasks_gid){
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
  
  const endpoint_url = "https://app.asana.com/api/1.0" + "/tasks" + "/" + tasks_gid;
  var response = UrlFetchApp.fetch(endpoint_url, options);
  var responseJson = JSON.parse(response);
  return responseJson
}