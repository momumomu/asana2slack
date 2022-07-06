//emailからSlackIDを取得する関数
function userLookupByEmail(slackApiToken, email){
  let return_dict = {}; //結果を格納するlist
  
  //headerを定義
  headers = {
    'Authorization': 'Bearer ' + slackApiToken,
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  //optionsを定義
  var options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': headers
  }
  
  const endpoint_url = "https://slack.com/api" + "/users.lookupByEmail" + "?email=" + email;
  let response = UrlFetchApp.fetch(endpoint_url, options);
  let responseJson = JSON.parse(response);

  return responseJson["user"]["id"];
}